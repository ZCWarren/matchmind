"""Generate scene narration, original music, effects, and bilingual subtitles."""

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
    (
        "storm", 0, 8,
        "A football match produces 1,275 events. The score tells you almost none of them.",
        "一场足球比赛产生1275个事件，比分却只能讲述其中极少一部分。",
    ),
    (
        "reveal", 8, 19,
        "MatchMind reveals the pressure, movement and tactical structure beneath the score.",
        "MatchMind让比分背后的压力、跑动与战术结构清晰可见。",
    ),
    (
        "pass", 19, 29,
        "At seventy two twelve, NHR-08 threads twenty four point six meters "
        "through point eight two pressure.",
        "72分12秒，NHR-08在0.82压力下送出24.6米破线传球。",
    ),
    (
        "agents", 29, 38,
        "Five specialized agents share one evidence graph. Each has a different responsibility.",
        "五个专业智能体共享一张证据图，各自承担不同职责。",
    ),
    (
        "revision", 38, 47,
        "If language goes beyond the evidence, the checker sends it back. "
        "One revision, then verification again.",
        "当表述超出证据，核查者会将其退回。一次修订，然后再次验证。",
    ),
    (
        "evidence", 47, 55,
        "Every number is checked against event-level proof. Models explain. The verifier decides.",
        "每个数字都经过事件级证据核验。模型负责解释，验证器负责裁决。",
    ),
    (
        "director", 55, 63,
        "The Director ranks, deduplicates and finds the right stoppage. "
        "A human keeps the final call.",
        "Director负责排序、去重并选择合适死球窗口，人类保留最终决策权。",
    ),
    (
        "product", 63, 73,
        "From live replay to broadcast approval, one workspace turns verified "
        "insight into airtime.",
        "从实时回放到播出审批，同一工作台将经过验证的洞察转化为播出内容。",
    ),
    (
        "audiences", 73, 82,
        "The same moment becomes a broadcast overlay and a personal story for every kind of fan.",
        "同一时刻既能成为转播画面，也能成为每种球迷都能理解的个性故事。",
    ),
    (
        "outro", 82, 90,
        "MatchMind. See the game beneath the game. Explore the moment now.",
        "MatchMind，看见比赛背后的比赛。现在，开始解剖关键时刻。",
    ),
]


async def narration() -> None:
    folder = AUDIO / "voice"
    folder.mkdir(parents=True, exist_ok=True)
    for name, _, _, text, _ in SCENES:
        target = folder / f"{name}.mp3"
        communicate = edge_tts.Communicate(text, "en-GB-RyanNeural", rate="+12%", pitch="-2Hz")
        await communicate.save(str(target))
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
    chinese = []
    for index, (_, start, end, en, zh) in enumerate(SCENES, start=1):
        english.append(f"{index}\n{timestamp(start)} --> {timestamp(end - 0.08)}\n{en}\n")
        chinese.append(f"{index}\n{timestamp(start)} --> {timestamp(end - 0.08)}\n{zh}\n")
    for folder in (OUT, WEB):
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "promo.en.srt").write_text("\n".join(english), encoding="utf-8")
        (folder / "promo.zh.srt").write_text("\n".join(chinese), encoding="utf-8")


if __name__ == "__main__":
    AUDIO.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    asyncio.run(narration())
    music(90, 120, AUDIO / "music.wav")
    music(15, 128, AUDIO / "teaser-music.wav")
    effects()
    subtitles()
    print("audio, music, effects, and subtitles ready")
