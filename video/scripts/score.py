"""Arrangement engine: turns a section/chord/cue sheet into a finished stereo score.

The score is written against the edit, not against a loop: every build, drop,
stop-time and chord change below lands on a visual event of the film.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import soundlab as sl
from soundlab import RATE, Stage

BPM = 120
BEAT = 60 / BPM
STEP = BEAT / 4

# Key of D major / B minor. `tones` is the pad voicing, `root` the sub-bass note.
CHORDS: dict[str, dict] = {
    "Bsus": dict(root=35, tones=[47, 54, 60, 61]),
    "Bm": dict(root=35, tones=[59, 62, 66, 69]),
    "G": dict(root=31, tones=[55, 59, 62, 66]),
    "D": dict(root=38, tones=[57, 62, 66, 69]),
    "A": dict(root=33, tones=[57, 61, 64, 71]),
    "Em": dict(root=40, tones=[52, 55, 59, 62]),
    "Gm": dict(root=31, tones=[55, 58, 62, 65]),
}

# Indices into the six arp notes (chord tones one octave up, then two more above).
ARP = {
    "A": [0, 2, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 5, 4, 3, 2],
    "B": [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 5, 3, 5, 4, 2],
    "S": [0, 1, 2, 1, 0, 1, 2, 3, 0, 1, 2, 1, 3, 2, 1, 0],
    "L": [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2],
}

# The four-bar hook (D, A, Bm, G) as (beat, midi, beats); other chords borrow its shape.
MOTIF: dict[str, list[tuple[float, int, float]]] = {
    "D": [(0, 78, 1.5), (1.5, 76, 0.5), (2, 74, 1), (3, 78, 1)],
    "A": [(0, 76, 1.5), (1.5, 73, 0.5), (2, 76, 1), (3, 81, 1)],
    "Bm": [(0, 74, 1.5), (1.5, 78, 0.5), (2, 83, 1), (3, 81, 1)],
    "G": [(0, 79, 1.5), (1.5, 78, 0.5), (2, 74, 2)],
    "Em": [(0, 76, 1.5), (1.5, 74, 0.5), (2, 71, 2)],
}
MOTIF_FINAL = [(0, 81, 1.5), (1.5, 78, 0.5), (2, 74, 4)]

KICK_PATTERNS = {"four": (0, 4, 8, 12), "heart": (0, 8), "one": (0,)}
CLAP_PATTERNS = {"back": (4, 12)}
RIM_PATTERNS = {"agents": (4, 7, 12, 15), "beat": (0, 4, 8, 12)}
BASS_PATTERNS = {"off": (2, 6, 10, 14), "drive": (0, 3, 6, 8, 11, 14)}
HAT_VELOCITY = [0.5, 0.28, 0.85, 0.28] * 4

# Static mix balance of the individual layers before mastering.
GAIN = dict(
    kick=0.8,
    clap=0.75,
    hat=0.55,
    rim=0.4,
    sub=0.45,
    bass=0.3,
    pad=0.42,
    arp=0.5,
    lead=0.42,
    bell=0.4,
    tick=0.3,
    riser=0.5,
    crash=0.55,
    stab=0.4,
    drone=0.55,
)


MASTER_EQ = [
    (30, -3.0),
    (60, -3.0),
    (120, -2.5),
    (300, -2.0),
    (800, 0.0),
    (2000, 1.5),
    (4500, 3.5),
    (9000, 5.5),
    (16000, 5.0),
]


@dataclass
class Sec:
    t0: float
    t1: float
    p: dict = field(default_factory=dict)


def sec(t0: float, t1: float, **p) -> Sec:
    return Sec(t0, t1, p)


@dataclass
class Arrangement:
    length: float
    sections: list[Sec]
    chords: list[tuple]
    hits: list[tuple] = field(default_factory=list)  # (time, crash, stab, kick)
    risers: list[tuple] = field(default_factory=list)  # (t0, t1, lo, hi, gain)
    rolls: list[tuple] = field(default_factory=list)  # (t0, t1, gain)
    falls: list[tuple] = field(default_factory=list)  # (t0, dur, gain)
    bells: list[tuple] = field(default_factory=list)  # (time, midi, gain)
    gaps: list[tuple] = field(default_factory=list)  # (t0, t1)
    lp: list[tuple] = field(default_factory=lambda: [(0, 20000.0)])
    hp: list[tuple] = field(default_factory=lambda: [(0, 20.0)])
    ticks: tuple | None = None  # (t0, t1) of the data-storm blips
    voices: list[tuple[float, Path]] = field(default_factory=list)
    fade_in: float = 0.25
    fade_out: float = 1.2
    target_lufs: float = -17.0  # loudness of the open (un-ducked) score
    voice_gain: float = 1.35  # must match VOICE_VOLUME in src/Promo.tsx
    speech_ratio_db: float = 12.0
    duck_min_db: float = 3.0
    duck_max_db: float = 14.0

    def lv(self, key: str, t: float) -> float:
        for s in self.sections:
            if s.t0 <= t < s.t1:
                v = s.p.get(key, 0.0)
                if isinstance(v, tuple):
                    return v[0] + (v[1] - v[0]) * (t - s.t0) / (s.t1 - s.t0)
                return float(v)
        return 0.0

    def pat(self, key: str, t: float):
        for s in self.sections:
            if s.t0 <= t < s.t1:
                return s.p.get(key)
        return None

    def level_points(self, key: str, default: float = 0.0) -> list[tuple[float, float]]:
        points: list[tuple[float, float]] = []
        for s in self.sections:
            v = s.p.get(key, default)
            a, b = v if isinstance(v, tuple) else (v, v)
            points += [(s.t0, a), (s.t1 - 1e-3, b)]
        return points

    def chord_at(self, t: float) -> str:
        name = self.chords[0][1]
        for entry in self.chords:
            if entry[0] <= t + 1e-6:
                name = entry[1]
        return name

    def segments(self) -> list[tuple[float, float, str, float]]:
        out = []
        for i, entry in enumerate(self.chords):
            end = self.chords[i + 1][0] if i + 1 < len(self.chords) else self.length
            out.append((entry[0], end, entry[1], entry[2] if len(entry) > 2 else 0.35))
        return out


def _xy(points: list[tuple[float, float]]) -> tuple[list[float], list[float]]:
    return [p[0] for p in points], [p[1] for p in points]


def arp_notes(chord: str) -> list[int]:
    tones = CHORDS[chord]["tones"]
    return [t + 12 for t in tones] + [t + 24 for t in tones[:2]]


def _vel(rng: np.random.Generator, spread: float = 0.07) -> float:
    return 1.0 + rng.uniform(-spread, spread)


def render(arr: Arrangement, seed: int = 20261028, verbose: bool = True) -> np.ndarray:
    rng = np.random.default_rng(seed)
    names = ("kick", "drums", "sub", "bass", "pad", "arp", "lead", "bells", "fx")
    bus = {name: Stage(arr.length) for name in names}
    length = bus["kick"].n
    t_axis = np.arange(length, dtype=np.float32) / RATE
    kick_hits: list[tuple[float, float]] = []
    hit_times = [h[0] for h in arr.hits if h[3]]

    def note(msg: str) -> None:
        if verbose:
            print(f"  {msg}", flush=True)

    note("pad + sub")
    for a, b, name, attack in arr.segments():
        chord = CHORDS[name]
        span = b - a
        for i, midi in enumerate(chord["tones"]):
            voice = sl.pad_voice(sl.mtof(midi), span + 1.3, attack, 1.2, seed=i)
            pan = (-0.45, 0.3, -0.2, 0.5)[i % 4]
            bus["pad"].put(voice, a - min(attack, 0.1), 0.55 + 0.1 * i, pan)
        if arr.lv("sub", a + 0.01) > 0.01:
            level = arr.lv("sub", a + 0.01)
            bus["sub"].put(sl.sub(sl.mtof(chord["root"]), span + 0.06), a, level)
    pad_level = np.interp(t_axis, *_xy(arr.level_points("pad")))
    bus["pad"].buf *= pad_level[:, None].astype(np.float32)
    pad_fc = sl.log_curve(arr.level_points("padfc", default=4000.0))
    bus["pad"].buf[:] = sl.stft_filter(bus["pad"].buf, pad_fc, "lp", 2, 1024)

    drone_points = arr.level_points("drone")
    if any(v > 0 for _, v in drone_points):
        note("storm drone")
        end = max(t for t, v in drone_points if v > 0) + 0.1
        t = sl.seconds_axis(end)
        bed = np.zeros(len(t), dtype=np.float32)
        for freq, amp, beat in (
            (61.74, 1.0, 0.6),
            (92.5, 0.55, 0.9),
            (123.47, 0.4, 1.4),
            (138.6, 0.12, 2.1),
        ):
            bed += amp * (np.sin(sl.TAU * freq * t) + np.sin(sl.TAU * (freq + beat) * t)).astype(
                np.float32
            )
        wind = sl.stft_filter(
            sl._noise(77, len(t)), sl.log_curve([(0, 300), (end, 2400)]), "lp", 2, 1024
        )
        wind *= 0.7 * (0.5 + 0.5 * np.sin(sl.TAU * 0.31 * t)).astype(np.float32)
        bed = sl.normalize(bed) + 0.4 * sl.normalize(wind)
        bed *= np.interp(t, *_xy(drone_points)).astype(np.float32)
        bus["pad"].put(sl.normalize(bed, 0.7), 0, GAIN["drone"] / GAIN["pad"] * 0.55, 0.0)

    if arr.ticks:
        note("data ticks")
        a, b = arr.ticks
        scale = [83, 86, 90, 93, 95, 98, 102]
        step = STEP / 2
        for t in np.arange(a, b, step):
            x = np.clip((t - a) / (b - a), 0, 1)
            density = (
                0.1 + 0.8 * np.sin(min(1, x / 0.5) * np.pi / 2)
                if x < 0.5
                else 0.9 * (1 - (x - 0.5) / 0.5) ** 1.3 + 0.04
            )
            if rng.random() < density * 0.55:
                midi = int(rng.choice(scale)) - (12 if rng.random() < 0.3 else 0)
                level = (0.25 + 0.75 * density) * rng.uniform(0.5, 1.0)
                bus["fx"].put(
                    sl.blip(sl.mtof(midi)), t, GAIN["tick"] * level, rng.uniform(-0.8, 0.8)
                )

    note("groove")
    for index in range(int(arr.length / STEP)):
        t = index * STEP
        s16 = index % 16
        near_hit = any(abs(t - h) < 0.07 for h in hit_times)
        k = arr.lv("kick", t)
        if (
            k > 0.02
            and s16 in KICK_PATTERNS.get(arr.pat("kickpat", t) or "four", ())
            and not near_hit
        ):
            bus["kick"].put(sl.kick(), t, GAIN["kick"] * k)
            kick_hits.append((t, min(1.0, k)))
        c = arr.lv("clap", t)
        if c > 0.02 and s16 in CLAP_PATTERNS["back"]:
            bus["drums"].put(sl.clap(), t, GAIN["clap"] * c * _vel(rng, 0.05), 0.05)
        r = arr.lv("rim", t)
        if r > 0.02 and s16 in RIM_PATTERNS.get(arr.pat("rimpat", t) or "agents", ()):
            bus["drums"].put(sl.rim(), t, GAIN["rim"] * r * _vel(rng), -0.2 if s16 % 8 else 0.25)
        h = arr.lv("hat", t)
        if h > 0.02:
            style = arr.pat("hatpat", t) or "off8"
            seed_pick = 11 + (index % 3)
            if style == "off8" and s16 % 4 == 2:
                bus["drums"].put(sl.hat(False, seed_pick), t, GAIN["hat"] * h * _vel(rng), 0.3)
            elif style == "16":
                bus["drums"].put(
                    sl.hat(False, seed_pick),
                    t,
                    GAIN["hat"] * h * HAT_VELOCITY[s16] * _vel(rng, 0.12),
                    0.25 * (1 if index % 2 else -1),
                )
            elif style == "16open":
                if s16 % 4 == 2:
                    bus["drums"].put(sl.hat(True, 14), t, GAIN["hat"] * h * 0.85, 0.35)
                else:
                    bus["drums"].put(
                        sl.hat(False, seed_pick),
                        t,
                        GAIN["hat"] * h * HAT_VELOCITY[s16] * 0.8 * _vel(rng, 0.12),
                        -0.25 if index % 2 else 0.25,
                    )
        chord = arr.chord_at(t + 0.001)
        root = CHORDS[chord]["root"]
        b = arr.lv("bass", t)
        if b > 0.02 and s16 in BASS_PATTERNS.get(arr.pat("basspat", t) or "off", ()):
            accent = 1.0 if s16 == 0 else 0.82
            bus["bass"].put(
                sl.pluck(sl.mtof(root + 12), 0.24, 0.5, 9.0),
                t,
                GAIN["bass"] * b * accent * _vel(rng),
                0.0,
            )
        a = arr.lv("arp", t)
        if a > 0.02:
            pattern = ARP[arr.pat("arppat", t) or "B"]
            rate = arr.pat("arprate", t) or 1
            if index % rate == 0:
                midi = arp_notes(chord)[pattern[(index // rate) % 16]]
                bright = 0.9 if (arr.lv("arpdark", t) < 0.5) else 0.6
                bus["arp"].put(
                    sl.pluck(sl.mtof(midi), 0.34 * rate, bright, 5.5, 1.8),
                    t,
                    GAIN["arp"] * a * (1.0 if s16 % 4 == 0 else 0.78) * _vel(rng, 0.1),
                    0.45 * np.sin(index * 1.7),
                )
        if s16 == 0 and t % (4 * BEAT) < 1e-6:
            lead_level = arr.lv("lead", t + 0.01)
            if lead_level > 0.02 and chord in MOTIF:
                mode = arr.pat("leadmode", t + 0.01) or "full"
                phrase = MOTIF_FINAL if mode == "final" else MOTIF[chord]
                for beat, midi, beats in phrase:
                    if mode == "half" and beat >= 2:
                        continue
                    f = sl.mtof(midi)
                    dur = beats * BEAT + 0.55
                    at = t + beat * BEAT
                    bus["lead"].put(
                        sl.pluck(f, dur, 0.78, 1.7), at, GAIN["lead"] * lead_level, 0.12
                    )
                    bus["bells"].put(
                        sl.bell(f * 2, min(dur, 1.6), 1.4, 3.0, 3.2),
                        at,
                        GAIN["bell"] * lead_level * 0.28,
                        -0.25,
                    )

    note("cues")
    for at, midi, gain in arr.bells:
        bus["bells"].put(
            sl.bell(sl.mtof(midi), 2.2, 2.2, 3.0, 2.0),
            at,
            GAIN["bell"] * gain,
            rng.uniform(-0.4, 0.4),
        )
    for t0, t1, lo, hi, gain in arr.risers:
        bus["fx"].put(
            sl.riser(t1 - t0, lo, hi, seed=int(t0 * 10) + 1), t0, GAIN["riser"] * gain, 0.0
        )
    for t0, dur, gain in arr.falls:
        bus["fx"].put(
            sl.swell_down(dur, 7000, 220, seed=int(t0 * 10) + 2), t0, GAIN["riser"] * gain, 0.0
        )
    for t0, t1, gain in arr.rolls:
        t, i = t0, 0
        while t < t1 - 0.02:
            progress = (t - t0) / (t1 - t0)
            bus["drums"].put(sl.clap(), t, GAIN["clap"] * gain * (0.25 + 0.75 * progress), 0.0)
            t += 0.25 * (1 - progress) + 0.055 * progress
            i += 1
    for at, crash_gain, stab_gain, kick_gain in arr.hits:
        name = arr.chord_at(at + 0.001)
        if crash_gain:
            bus["fx"].put(sl.crash(3.2), at, GAIN["crash"] * crash_gain, 0.0)
        if stab_gain:
            for j, midi in enumerate(CHORDS[name]["tones"]):
                f = sl.mtof(midi + 12)
                bus["bells"].put(
                    sl.bell(f, 2.0, 1.6, 3.0, 2.2),
                    at,
                    GAIN["stab"] * stab_gain * 0.6,
                    (-0.4, 0.4, -0.15, 0.2)[j],
                )
                bus["lead"].put(
                    sl.pluck(f, 1.4, 0.7, 2.4),
                    at,
                    GAIN["stab"] * stab_gain * 0.8,
                    (-0.3, 0.3, -0.1, 0.1)[j],
                )
        if kick_gain:
            bus["kick"].put(sl.kick(length=0.5), at, GAIN["kick"] * kick_gain)
            kick_hits.append((at, 1.0))

    note("sidechain + space")
    for name, depth in (
        ("pad", 0.55),
        ("sub", 0.65),
        ("bass", 0.5),
        ("arp", 0.3),
        ("lead", 0.18),
        ("bells", 0.12),
    ):
        bus[name].buf *= sl.pump_curve(length, kick_hits, depth)[:, None]

    send = (
        bus["pad"].buf * 0.34
        + bus["arp"].buf * 0.22
        + bus["lead"].buf * 0.42
        + bus["bells"].buf * 0.7
        + bus["fx"].buf * 0.3
        + bus["drums"].buf * 0.1
    )
    room = sl.convolve(send, sl.make_impulse_response(2.8, seed=7))
    echo_in = (
        bus["arp"].buf.sum(axis=1) * 0.5
        + bus["lead"].buf.sum(axis=1) * 0.55
        + bus["bells"].buf.sum(axis=1) * 0.3
    )
    echo = sl.ping_pong(echo_in.astype(np.float32), BEAT * 0.75, 0.42)

    mix = sum(b.buf for b in bus.values()) + room * 0.62 + echo * 0.45
    del bus, send, room, echo

    note("transitions")
    for t0, t1 in arr.gaps:
        gain = np.ones(length, dtype=np.float32)
        a, b = int(t0 * RATE), int(t1 * RATE)
        ramp = int(0.012 * RATE)
        gain[a:b] = 0.0
        gain[a - ramp : a] = np.linspace(1, 0, ramp)
        mix *= gain[:, None]
    mix *= (10 ** (np.interp(t_axis, *_xy(arr.level_points("vol", default=0.0))) / 20)).astype(
        np.float32
    )[:, None]
    mix = sl.stft_filter(mix, sl.log_curve(arr.lp), "lp", 2, 1024)
    mix = sl.stft_filter(mix, sl.log_curve(arr.hp), "hp", 2, 1024)
    fade = np.ones(length, dtype=np.float32)
    fade *= np.clip(t_axis / arr.fade_in, 0, 1)
    fade *= np.clip((arr.length - t_axis) / arr.fade_out, 0, 1)
    mix *= sl.smoothstep(fade)[:, None]

    return mix.astype(np.float32)


def _rms_db(x: np.ndarray) -> float:
    return 20 * np.log10(np.sqrt(np.mean(x**2)) + 1e-9)


def duck_under_voice(mix: np.ndarray, arr: Arrangement, verbose: bool = True) -> np.ndarray:
    """Dip the score under each narration clip by exactly as much as that scene needs.

    Each clip's depth is solved iteratively so the 200 Hz-5.2 kHz band of the
    score sits `arr.speech_ratio_db` below the speech while it talks, instead
    of using one global amount. Lows duck least and air ducks a little, so the
    score keeps its weight and shimmer.
    """
    rate = 100
    low, mid, high = sl.split_bands(mix, (200.0, 5200.0))
    clips = []
    mask = np.zeros(int(arr.length * rate) + 2000)
    for start, path in arr.voices:
        speech = sl.voice_activity(path, 1 / rate)
        voice = sl.decode(path) * arr.voice_gain
        a = int(start * RATE)
        active = np.repeat(speech, RATE // rate)[: len(voice)] > 0
        k = min(len(voice), len(active), len(mix) - a)
        clips.append(
            dict(
                name=path.stem,
                start=start,
                a=a,
                k=k,
                active=active[:k],
                voice_rms=_rms_db(voice[:k][active[:k]]),
                span=len(speech),
            )
        )
        c0 = int(start * rate)
        mask[c0 : c0 + len(speech)] = np.maximum(mask[c0 : c0 + len(speech)], speech)
    follow = sl.control_follow(
        np.roll(mask, -14), rate, 0.07, 0.55
    )  # dip just before the first syllable
    control_t = np.arange(len(follow)) / rate
    t = np.arange(len(mix)) / RATE
    follow_t = np.interp(t, control_t, follow).astype(np.float32)
    mid_mono = mid.mean(axis=1)

    def gains(depths: list[float]):
        depth_ctrl = np.zeros_like(mask)
        for clip, depth in zip(clips, depths, strict=True):
            c0 = int(clip["start"] * rate)
            depth_ctrl[c0 : c0 + clip["span"] + int(1.2 * rate)] = depth
        amount = follow_t * np.interp(t, control_t, depth_ctrl).astype(np.float32)
        return lambda fraction: (10 ** (-fraction * amount / 20))[:, None]

    def apply(depths: list[float]) -> np.ndarray:
        shape = gains(depths)
        return low * shape(0.5) + mid * shape(1.0) + high * shape(0.7)

    depths = [arr.duck_min_db] * len(clips)
    for _ in range(4):
        ducked = mid_mono * gains(depths)(1.0)[:, 0]
        for i, clip in enumerate(clips):
            under = _rms_db(ducked[clip["a"] : clip["a"] + clip["k"]][clip["active"]])
            shortfall = (clip["voice_rms"] - under) - arr.speech_ratio_db
            depths[i] = float(np.clip(depths[i] - shortfall, arr.duck_min_db, arr.duck_max_db))
    if verbose:
        print(
            "  ducking: "
            + ", ".join(f"{c['name']} {d:.1f}" for c, d in zip(clips, depths, strict=True))
            + " dB",
            flush=True,
        )
    return apply(depths)


def master(arr: Arrangement, mix: np.ndarray, scratch: Path, verbose: bool = True) -> np.ndarray:
    """Tone, level-match the open score, duck it under the narration, then limit."""
    mix = sl.stft_filter(mix, 28.0, "hp", 2, 4096)
    mix = sl.stft_eq(mix, MASTER_EQ)
    mix = np.tanh(mix * 0.9) / np.tanh(0.9)
    gain = 1.0
    for _ in range(3):
        sl.write_wav(scratch, sl.limit(mix * gain))
        loud = sl.measure_lufs(scratch)
        if loud is None or abs(loud - arr.target_lufs) < 0.15:
            break
        gain *= 10 ** ((arr.target_lufs - loud) / 20)
    scratch.unlink(missing_ok=True)
    mix = mix * gain
    if arr.voices:
        mix = duck_under_voice(mix, arr, verbose)
    return sl.limit(mix)
