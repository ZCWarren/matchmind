"""Small numpy-only DSP kit used to score the MatchMind films.

Everything is deterministic: synths are additive/FM, filters are STFT based so
they can sweep, and the "room" is a synthetic decaying-noise impulse response.
"""

from __future__ import annotations

import subprocess
import wave
from collections.abc import Callable
from functools import cache, lru_cache
from pathlib import Path

import numpy as np

RATE = 44100
TAU = 2 * np.pi


def mtof(midi: float) -> float:
    return 440.0 * 2.0 ** ((midi - 69) / 12)


def db(x: float) -> float:
    return 10 ** (x / 20)


def seconds_axis(seconds: float) -> np.ndarray:
    return np.arange(int(round(seconds * RATE))) / RATE


def smoothstep(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def fade_edges(sig: np.ndarray, attack: float, release: float) -> np.ndarray:
    n = len(sig)
    out = sig.copy()
    a = min(n, int(attack * RATE))
    r = min(n, int(release * RATE))
    shape = (-1, 1) if sig.ndim == 2 else (-1,)
    if a:
        out[:a] *= smoothstep(np.linspace(0, 1, a)).reshape(shape)
    if r:
        out[-r:] *= smoothstep(np.linspace(1, 0, r)).reshape(shape)
    return out


def normalize(sig: np.ndarray, peak: float = 1.0) -> np.ndarray:
    top = float(np.max(np.abs(sig)))
    return sig if top < 1e-9 else sig * (peak / top)


class Stage:
    """A stereo mix bus that sounds can be dropped onto at absolute times."""

    def __init__(self, seconds: float):
        self.n = int(round(seconds * RATE))
        self.buf = np.zeros((self.n, 2), dtype=np.float32)

    def put(self, sig: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0) -> None:
        start = int(round(at * RATE))
        if start < 0:
            sig = sig[-start:]
            start = 0
        length = min(len(sig), self.n - start)
        if length <= 0 or gain == 0:
            return
        sig = sig[:length]
        if sig.ndim == 2:
            self.buf[start : start + length] += sig * gain
            return
        angle = (pan + 1) * np.pi / 4
        self.buf[start : start + length, 0] += sig * (np.cos(angle) * gain)
        self.buf[start : start + length, 1] += sig * (np.sin(angle) * gain)


def stft_filter(
    x: np.ndarray,
    cutoff: Callable[[np.ndarray], np.ndarray] | float,
    kind: str = "lp",
    order: int = 2,
    hop: int = 1024,
) -> np.ndarray:
    """Time-varying low/high-pass. `cutoff` is Hz, or a function of seconds."""
    if x.ndim == 2:
        return np.stack(
            [stft_filter(x[:, c], cutoff, kind, order, hop) for c in range(x.shape[1])], axis=1
        )
    n = len(x)
    win = 2 * hop
    window = np.hanning(win + 1)[:-1]
    padded = np.concatenate([np.zeros(hop), x.astype(np.float64), np.zeros(win + hop)])
    blocks = (len(padded) - win) // hop + 1
    index = np.arange(win)[None, :] + hop * np.arange(blocks)[:, None]
    spec = np.fft.rfft(padded[index] * window, axis=1)
    centers = (np.arange(blocks) * hop - hop + win / 2) / RATE
    fc = np.asarray(
        cutoff(centers) if callable(cutoff) else np.full(blocks, cutoff), dtype=np.float64
    )
    freqs = np.fft.rfftfreq(win, 1 / RATE)[None, :]
    ratio = (freqs + 1e-3) / fc[:, None] if kind == "lp" else fc[:, None] / (freqs + 1e-3)
    spec *= 1.0 / np.sqrt(1.0 + ratio ** (2 * order))
    frames = np.fft.irfft(spec, n=win, axis=1)
    out = frames[:, :hop].copy()
    out[1:] += frames[:-1, hop:]
    return out.reshape(-1)[hop : hop + n].astype(np.float32)


def stft_eq(x: np.ndarray, points: list[tuple[float, float]], hop: int = 2048) -> np.ndarray:
    """Static EQ: `points` are (Hz, dB), interpolated across log-frequency."""
    if x.ndim == 2:
        return np.stack([stft_eq(x[:, c], points, hop) for c in range(x.shape[1])], axis=1)
    n = len(x)
    win = 2 * hop
    window = np.hanning(win + 1)[:-1]
    padded = np.concatenate([np.zeros(hop), x.astype(np.float64), np.zeros(win + hop)])
    blocks = (len(padded) - win) // hop + 1
    index = np.arange(win)[None, :] + hop * np.arange(blocks)[:, None]
    spec = np.fft.rfft(padded[index] * window, axis=1)
    freqs = np.fft.rfftfreq(win, 1 / RATE)
    xs = np.log([max(p[0], 1.0) for p in points])
    gain = 10 ** (np.interp(np.log(np.maximum(freqs, 1.0)), xs, [p[1] for p in points]) / 20)
    frames = np.fft.irfft(spec * gain[None, :], n=win, axis=1)
    out = frames[:, :hop].copy()
    out[1:] += frames[:-1, hop:]
    return out.reshape(-1)[hop : hop + n].astype(np.float32)


def bandpass(x: np.ndarray, low: float, high: float, order: int = 2, hop: int = 1024) -> np.ndarray:
    return stft_filter(stft_filter(x, low, "hp", order, hop), high, "lp", order, hop)


def split_bands(x: np.ndarray, edges: tuple[float, ...], hop: int = 2048) -> list[np.ndarray]:
    """Complementary band split so the bands sum back to the input."""
    bands = []
    rest = x
    for edge in edges:
        low = stft_filter(rest, edge, "lp", 2, hop)
        bands.append(low)
        rest = rest - low
    bands.append(rest)
    return bands


def curve(points: list[tuple[float, float]]) -> Callable[[np.ndarray], np.ndarray]:
    xs = np.array([p[0] for p in points], dtype=np.float64)
    ys = np.array([p[1] for p in points], dtype=np.float64)
    return lambda t: np.interp(t, xs, ys)


def log_curve(points: list[tuple[float, float]]) -> Callable[[np.ndarray], np.ndarray]:
    xs = np.array([p[0] for p in points], dtype=np.float64)
    ys = np.log(np.array([p[1] for p in points], dtype=np.float64))
    return lambda t: np.exp(np.interp(t, xs, ys))


@cache
def _noise(seed: int, n: int) -> np.ndarray:
    return np.random.default_rng(seed).normal(0, 1, n).astype(np.float32)


def _harmonic_stack(
    freq: float,
    t: np.ndarray,
    count: int,
    amp: Callable[[int], float],
    decay: Callable[[int], float],
) -> np.ndarray:
    count = max(1, min(count, int(11000 / freq)))
    out = np.zeros(len(t), dtype=np.float32)
    for n in range(1, count + 1):
        out += (amp(n) * np.exp(-t * decay(n))).astype(np.float32) * np.sin(
            TAU * freq * n * t
        ).astype(np.float32)
    return out


@lru_cache(maxsize=512)
def pluck(
    freq: float, dur: float = 0.5, bright: float = 1.0, body: float = 4.0, tilt: float = 2.6
) -> np.ndarray:
    """Plucked glass/marimba-ish tone: upper partials die faster than the fundamental."""
    t = seconds_axis(dur)
    sig = np.zeros(len(t), dtype=np.float32)
    for detune in (0.9975, 1.0025):
        sig += _harmonic_stack(
            freq * detune,
            t,
            14,
            amp=lambda n: bright ** (n - 1) / n**1.15,
            decay=lambda n: body + tilt * (n - 1),
        )
    return normalize(fade_edges(sig, 0.002, min(0.04, dur / 3)))


@lru_cache(maxsize=256)
def bell(
    freq: float, dur: float = 1.6, index: float = 2.2, ratio: float = 3.0, ring: float = 2.4
) -> np.ndarray:
    t = seconds_axis(dur)
    mod = index * np.exp(-t * 4.5) * np.sin(TAU * freq * ratio * t)
    sig = np.sin(TAU * freq * t + mod) * np.exp(-t * ring)
    sig += 0.22 * np.sin(TAU * freq * 2 * t) * np.exp(-t * (ring + 1.2))
    return normalize(fade_edges(sig.astype(np.float32), 0.002, min(0.08, dur / 3)))


def pad_voice(freq: float, dur: float, attack: float, release: float, seed: int = 0) -> np.ndarray:
    """Slow detuned band-limited saw stack; filter it afterwards for movement."""
    t = seconds_axis(dur).astype(np.float32)
    rng = np.random.default_rng(seed + int(freq * 10))
    sig = np.zeros(len(t), dtype=np.float32)
    for cents in (-8, 0, 8):
        f = freq * 2 ** (cents / 1200)
        phase = rng.uniform(0, TAU)
        count = max(2, min(14, int(7000 / f)))
        for n in range(1, count + 1):
            sig += np.sin(TAU * f * n * t + phase * n).astype(np.float32) / n
    sig *= 1.0 + 0.04 * np.sin(TAU * 0.23 * t + rng.uniform(0, TAU))
    return normalize(fade_edges(sig, attack, release))


@lru_cache(maxsize=256)
def sub(freq: float, dur: float) -> np.ndarray:
    t = seconds_axis(dur)
    sig = np.sin(TAU * freq * t) + 0.22 * np.sin(TAU * freq * 2 * t)
    sig = np.tanh(sig * 1.25)
    return normalize(fade_edges(sig.astype(np.float32), 0.012, min(0.09, dur / 2)))


@lru_cache(maxsize=16)
def kick(
    tone: float = 48.0,
    sweep: float = 90.0,
    decay: float = 7.5,
    click: float = 0.1,
    length: float = 0.42,
) -> np.ndarray:
    t = seconds_axis(length)
    freq = tone + sweep * np.exp(-t * 38)
    phase = TAU * np.cumsum(freq) / RATE
    sig = np.sin(phase) * np.exp(-t * decay)
    sig += _noise(3, len(t)) * np.exp(-t * 420) * click
    return normalize(fade_edges(sig.astype(np.float32), 0.0008, 0.03))


@lru_cache(maxsize=16)
def hat(open_: bool = False, seed: int = 11) -> np.ndarray:
    length = 0.32 if open_ else 0.07
    t = seconds_axis(length)
    noise = np.diff(_noise(seed, len(t) + 2), n=2)
    sig = noise * np.exp(-t * (13 if open_ else 70))
    return normalize(fade_edges(sig.astype(np.float32), 0.0005, 0.01))


@lru_cache(maxsize=4)
def clap(seed: int = 21) -> np.ndarray:
    length = 0.42
    t = seconds_axis(length)
    noise = _noise(seed, len(t))
    env = np.zeros(len(t), dtype=np.float32)
    for offset, level in ((0.0, 0.7), (0.011, 0.8), (0.021, 0.9), (0.033, 1.0)):
        start = int(offset * RATE)
        env[start:] += level * np.exp(-(t[: len(t) - start]) * 160)
    env += 0.55 * np.exp(-np.clip(t - 0.033, 0, None) * 17) * (t >= 0.033)
    sig = bandpass(noise * env, 900, 7500)
    return normalize(fade_edges(sig, 0.0005, 0.05))


@lru_cache(maxsize=4)
def rim() -> np.ndarray:
    t = seconds_axis(0.09)
    sig = np.sin(TAU * 1750 * t) * np.exp(-t * 90) + 0.5 * np.sin(TAU * 3100 * t) * np.exp(-t * 120)
    sig += _noise(5, len(t)) * np.exp(-t * 300) * 0.4
    return normalize(fade_edges(sig.astype(np.float32), 0.0004, 0.02))


def blip(freq: float, dur: float = 0.22) -> np.ndarray:
    t = seconds_axis(dur)
    sig = np.sin(TAU * freq * t) * np.exp(-t * 26) + 0.3 * np.sin(TAU * freq * 3.01 * t) * np.exp(
        -t * 55
    )
    return normalize(fade_edges(sig.astype(np.float32), 0.0006, 0.03))


def riser(
    dur: float, lo: float, hi: float, seed: int = 1, tone: float = 0.35, power: float = 2.2
) -> np.ndarray:
    """Noise sweep (plus an optional rising sine bed) that swells toward its end."""
    t = seconds_axis(dur)
    noise = _noise(seed, len(t))
    sweep = log_curve([(0, lo), (dur, hi)])
    sig = stft_filter(noise, sweep, "hp", 2, 512)
    sig = stft_filter(sig, lambda tt: sweep(tt) * 3.2, "lp", 2, 512)
    sig = normalize(sig)
    if tone > 0:
        glide = np.exp(np.log(lo * 0.6) + (np.log(hi * 0.35) - np.log(lo * 0.6)) * (t / dur) ** 1.4)
        phase = TAU * np.cumsum(glide) / RATE
        sig = sig + tone * (np.sin(phase) + 0.4 * np.sin(2 * phase))
    env = (t / dur) ** power
    return normalize(fade_edges(sig.astype(np.float32) * env.astype(np.float32), 0.01, 0.004))


def swell_down(dur: float, hi: float, lo: float, seed: int = 2) -> np.ndarray:
    """Falling filtered noise tail: the music 'collapsing' after a peak."""
    t = seconds_axis(dur)
    noise = _noise(seed, len(t))
    sig = stft_filter(noise, log_curve([(0, hi), (dur, lo)]), "lp", 2, 512)
    env = np.exp(-t * 2.0 / dur * 1.8)
    return normalize(fade_edges(sig * env.astype(np.float32), 0.004, dur * 0.4))


def crash(dur: float = 3.0, seed: int = 31) -> np.ndarray:
    t = seconds_axis(dur)
    noise = _noise(seed, len(t))
    sig = stft_filter(noise, 2800, "hp", 2, 512)
    sig *= (np.exp(-t * 2.3) + 0.9 * np.exp(-t * 22)).astype(np.float32)
    return normalize(fade_edges(sig, 0.001, 0.4))


def boom(dur: float = 3.2, seed: int = 41) -> np.ndarray:
    t = seconds_axis(dur)
    freq = 34 + 64 * np.exp(-t * 7.0)
    phase = TAU * np.cumsum(freq) / RATE
    low = np.sin(phase) * np.exp(-t * 1.5)
    thump = np.sin(TAU * np.cumsum(55 + 140 * np.exp(-t * 28)) / RATE) * np.exp(-t * 10)
    air = stft_filter(_noise(seed, len(t)), 6500, "lp", 2, 512)
    air = stft_filter(air, 120, "hp", 2, 512) * np.exp(-t * 7) * 0.55
    tail = stft_filter(_noise(seed + 1, len(t)), 420, "lp", 2, 1024) * np.exp(-t * 2.1) * 0.55
    sig = low + 0.7 * thump + air + tail
    return normalize(fade_edges(sig.astype(np.float32), 0.0015, 0.5))


def whoosh(
    dur: float = 1.1, seed: int = 51, peak_at: float = 0.72, spread: float = 0.75
) -> np.ndarray:
    """Stereo air sweep for cuts: rises into `peak_at`, then dissolves."""
    t = seconds_axis(dur)
    out = []
    centre = log_curve([(0, 380), (dur * peak_at, 3400), (dur, 1500)])
    for channel, pan in enumerate((-spread, spread)):
        noise = _noise(seed + channel, len(t))
        sig = stft_filter(noise, lambda tt: centre(tt) * 0.45, "hp", 2, 512)
        sig = stft_filter(sig, lambda tt: centre(tt) * 2.2, "lp", 2, 512)
        env = np.where(
            t < dur * peak_at,
            (t / (dur * peak_at)) ** 2.0,
            np.exp(-(t - dur * peak_at) * 7.0),
        )
        side = 0.5 + 0.5 * np.tanh((t / dur - 0.55) * 4) * np.sign(pan)
        out.append(sig * env * side.astype(np.float32))
    return normalize(fade_edges(np.stack(out, axis=1).astype(np.float32), 0.02, 0.15), 0.9)


def make_impulse_response(seconds: float, seed: int, brightness: float = 7500.0) -> np.ndarray:
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    rng = np.random.default_rng(seed)
    ir = rng.normal(0, 1, (n, 2)).astype(np.float32)
    ir *= np.exp(-t * 6.91 / seconds)[:, None].astype(np.float32)
    ir = stft_filter(ir, log_curve([(0, brightness), (seconds, 900.0)]), "lp", 1, 512)
    ir[: int(0.004 * RATE)] *= 0.0
    ir = np.concatenate([np.zeros((int(0.022 * RATE), 2), dtype=np.float32), ir])
    return ir / np.sqrt(np.sum(ir**2, axis=0, keepdims=True))


def convolve(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    n = len(x) + len(ir)
    size = 1 << (n - 1).bit_length()
    out = np.zeros_like(x, dtype=np.float32)
    for c in range(2):
        wet = np.fft.irfft(np.fft.rfft(x[:, c], size) * np.fft.rfft(ir[:, c], size), size)
        out[:, c] = wet[: len(x)]
    return out


def ping_pong(
    mono: np.ndarray, time: float, feedback: float, taps: int = 6, tone: float = 4200.0
) -> np.ndarray:
    out = np.zeros((len(mono), 2), dtype=np.float32)
    step = int(round(time * RATE))
    for k in range(1, taps + 1):
        offset = k * step
        if offset >= len(mono):
            break
        out[offset:, (k - 1) % 2] += mono[: len(mono) - offset] * feedback ** (k - 1)
    return stft_filter(out, tone, "lp", 1, 1024)


def pump_curve(
    length: int, hits: list[tuple[float, float]], depth: float, release: float = 0.22
) -> np.ndarray:
    """Sidechain-style gain (1 = no ducking) that dips at each (time, weight) hit."""
    gain = np.ones(length, dtype=np.float32)
    window = int(release * 5 * RATE)
    t = np.arange(window) / RATE
    shape = np.exp(-t / release) * smoothstep(t / 0.006)
    for at, weight in hits:
        start = int(at * RATE)
        if start >= length:
            continue
        stop = min(length, start + window)
        dip = (1 - depth * weight * shape[: stop - start]).astype(np.float32)
        gain[start:stop] = np.minimum(gain[start:stop], dip)
    return gain


def control_follow(control: np.ndarray, rate: float, attack: float, release: float) -> np.ndarray:
    """Attack/release smoothing of a control signal sampled at `rate` Hz."""
    out = np.zeros_like(control, dtype=np.float64)
    a = np.exp(-1.0 / max(1e-6, attack * rate))
    r = np.exp(-1.0 / max(1e-6, release * rate))
    level = 0.0
    for i, value in enumerate(control):
        coefficient = a if value > level else r
        level = coefficient * level + (1 - coefficient) * value
        out[i] = level
    return out


def limit(
    x: np.ndarray, ceiling: float = 0.89, lookahead: float = 0.004, release: float = 0.12
) -> np.ndarray:
    block = 32
    n = len(x)
    padded = np.pad(np.abs(x).max(axis=1), (0, (-n) % block))
    peaks = padded.reshape(-1, block).max(axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peaks, 1e-9))
    look = max(1, int(lookahead * RATE / block))
    anticipated = need.copy()
    for shift in range(1, look + 1):
        anticipated[:-shift] = np.minimum(anticipated[:-shift], need[shift:])
    rate = RATE / block
    smooth = np.zeros_like(anticipated)
    level = 1.0
    r = np.exp(-1.0 / (release * rate))
    for i, value in enumerate(anticipated):
        level = value if value < level else r * level + (1 - r) * value
        smooth[i] = level
    smooth = np.minimum(smooth, anticipated)
    gain = np.interp(np.arange(n), (np.arange(len(smooth)) + 0.5) * block, smooth)
    return (x * gain[:, None]).astype(np.float32)


def decode(path: Path) -> np.ndarray:
    """Decode any audio file to mono float32 at RATE using ffmpeg."""
    raw = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(path),
            "-f",
            "f32le",
            "-ac",
            "1",
            "-ar",
            str(RATE),
            "-",
        ],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def voice_activity(path: Path, hop: float = 0.01, threshold_db: float = -34.0) -> np.ndarray:
    """1.0 while the narration is speaking, sampled every `hop` seconds."""
    x = decode(path)
    step = int(hop * RATE)
    frames = len(x) // step
    rms = np.sqrt(np.mean(x[: frames * step].reshape(frames, step) ** 2, axis=1) + 1e-12)
    level = 20 * np.log10(rms)
    gate = (level > threshold_db).astype(np.float64)
    bridge = int(0.18 / hop)
    kernel = np.ones(2 * bridge + 1)
    return (np.convolve(gate, kernel, mode="same") > 0).astype(np.float64)


def write_wav(target: Path, samples: np.ndarray) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    values = np.clip(samples, -1, 1)
    channels = 1 if values.ndim == 1 else values.shape[1]
    pcm = (values * 32767).astype("<i2")
    with wave.open(str(target), "wb") as output:
        output.setnchannels(channels)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def measure_lufs(path: Path) -> float | None:
    try:
        result = subprocess.run(
            ["ffmpeg", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
            capture_output=True,
            text=True,
            check=True,
        ).stderr
    except (FileNotFoundError, subprocess.CalledProcessError):
        return None
    marker = result.rfind("I:")
    return float(result[marker + 2 :].split("LUFS")[0]) if marker >= 0 else None
