"""Generate concise English narration, original music, effects, and subtitles."""

from __future__ import annotations

import asyncio
from pathlib import Path

import edge_tts
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / "video/public/audio"
OUT = ROOT / "video/out"
WEB = ROOT / "web/public"
RATE = 44100

SCENES = [
    ("storm", 0, 8, "1,275 events. One scoreline. Almost no explanation."),
    ("reveal", 8, 19, "See the pressure and structure beneath the score."),
    ("pass", 19, 29, "Twenty four point six metres through point eight two pressure."),
    ("agents", 29, 38, "Five agents work behind the scenes, so every insight earns your trust."),
    ("revision", 38, 47, "One revision. Verification again."),
    ("evidence", 47, 55, "Models explain. The verifier decides."),
    ("director", 55, 63, "The Director schedules. A human decides."),
    ("product", 63, 73, "From verified insight to airtime."),
    ("audiences", 73, 82, "One moment. Every audience."),
    ("outro", 82, 90, "MatchMind. See the game beneath the game."),
]


async def narration() -> None:
    folder = AUDIO / "voice"
    folder.mkdir(parents=True, exist_ok=True)
    for name, _, _, text in SCENES:
        target = folder / f"{name}.mp3"
        for attempt in range(2):
            try:
                communicate = edge_tts.Communicate(
                    text, "en-GB-RyanNeural", rate="+12%", pitch="-2Hz"
                )
                await asyncio.wait_for(communicate.save(str(target)), timeout=30)
                break
            except TimeoutError:
                if attempt == 1:
                    raise
                print(f"retry voice: {name}", flush=True)
        print(f"voice: {name}", flush=True)


def envelope(length: int, attack: float, release: float) -> np.ndarray:
    env = np.ones(length)
    attack_n = min(length, int(attack * RATE))
    release_n = min(length, int(release * RATE))
    if attack_n:
        env[:attack_n] = np.linspace(0, 1, attack_n)
    if release_n:
        env[-release_n:] = np.linspace(1, 0, release_n)
    return env


def music(seconds: int, bpm: int, target: Path) -> None:
    rng = np.random.default_rng(20261026)
    total = seconds * RATE
    mix = np.zeros(total)
    beat = 60 / bpm
    roots = [73.42, 65.41, 87.31, 98.0]
    for index, start in enumerate(np.arange(0, seconds, beat)):
        length = min(int(beat * RATE), total - int(start * RATE))
        t = np.arange(length) / RATE
        kick = np.sin(2 * np.pi * (48 * t + 35 * 0.07 * (1 - np.exp(-t * 20)))) * np.exp(-t * 12)
        root = roots[(index // 8) % len(roots)]
        bass = np.sin(2 * np.pi * root * t) * np.exp(-t * 4.5) * 0.4
        hat = rng.normal(0, 1, length) * np.exp(-t * 42) * 0.12
        bar = (kick * 0.65 + bass + hat) * envelope(length, 0.004, 0.08)
        offset = int(start * RATE)
        mix[offset:offset + length] += bar
        if index % 2 == 0:
            pad_length = min(int(beat * 8 * RATE), total - offset)
            pt = np.arange(pad_length) / RATE
            pad = sum(np.sin(2 * np.pi * root * ratio * pt) for ratio in (1, 1.5, 2)) / 3
            mix[offset:offset + pad_length] += pad * envelope(pad_length, 0.25, 0.7) * 0.1
    for start in np.arange(7, seconds, 8):
        length = min(RATE, total - int(start * RATE))
        if length <= 0:
            continue
        t = np.arange(length) / RATE
        riser = rng.normal(0, 1, length) * np.sin(np.pi * t) ** 2 * 0.055
        offset = int(start * RATE)
        mix[offset:offset + length] += riser
    mix = np.tanh(mix * 1.35)
    mix *= 0.82 / max(0.01, float(np.max(np.abs(mix))))
    stereo = np.column_stack((mix, np.roll(mix, 173)))
    write_wav(target, stereo)


def effects() -> None:
    length = int(1.4 * RATE)
    t = np.arange(length) / RATE
    impact = (np.sin(2 * np.pi * (52 * t + 18 * (1 - np.exp(-t * 9)))) * np.exp(-t * 4) * 0.85)
    impact += np.random.default_rng(72).normal(0, 1, length) * np.exp(-t * 18) * 0.18
    write_wav(AUDIO / "impact.wav", impact)
    length = int(0.8 * RATE)
    t = np.arange(length) / RATE
    verify = sum(np.sin(2 * np.pi * frequency * t) for frequency in (660, 880, 1320)) / 3
    verify *= np.exp(-t * 5) * envelope(length, 0.005, 0.3)
    write_wav(AUDIO / "verify.wav", verify)


def write_wav(target: Path, samples: np.ndarray) -> None:
    import wave

    target.parent.mkdir(parents=True, exist_ok=True)
    values = np.clip(samples, -1, 1)
    if values.ndim == 1:
        channels = 1
    else:
        channels = values.shape[1]
    pcm = (values * 32767).astype("<i2")
    with wave.open(str(target), "wb") as output:
        output.setnchannels(channels)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())


def timestamp(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int(seconds % 3600 // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def subtitles() -> None:
    english = []
    for index, (_, start, end, en) in enumerate(SCENES, start=1):
        english.append(f"{index}\n{timestamp(start)} --> {timestamp(end - 0.08)}\n{en}\n")
    for folder in (OUT, WEB):
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "promo.en.srt").write_text("\n".join(english), encoding="utf-8")
        (folder / "promo.zh.srt").unlink(missing_ok=True)


if __name__ == "__main__":
    AUDIO.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    asyncio.run(narration())
    music(90, 120, AUDIO / "music.wav")
    music(15, 128, AUDIO / "teaser-music.wav")
    effects()
    subtitles()
    print("audio, music, effects, and subtitles ready")
