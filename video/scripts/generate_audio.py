"""Generate concise English narration, the original score, sound effects, and subtitles.

python scripts/generate_audio.py               # narration (needs network) + score + sfx + subtitles
python scripts/generate_audio.py --music-only  # score + sfx only, reuses the narration on disk
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

import cuesheet  # noqa: E402
import score  # noqa: E402
import soundlab as sl  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / "video/public/audio"
SFX = AUDIO / "sfx"
OUT = ROOT / "video/out"
WEB = ROOT / "web/public"

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
    import edge_tts

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


def music() -> None:
    scratch = AUDIO / ".master-scratch.wav"
    for label, arrangement, target in (
        ("promo score", cuesheet.promo(AUDIO / "voice", SCENES), AUDIO / "music.wav"),
        ("teaser score", cuesheet.teaser(), AUDIO / "teaser-music.wav"),
    ):
        print(f"{label}:", flush=True)
        mix = score.render(arrangement)
        mastered = score.master(arrangement, mix, scratch)
        sl.write_wav(target, mastered)
        print(f"  {target.name}: {sl.measure_lufs(target)} LUFS", flush=True)


def tick_ladder() -> list[float]:
    """D major pentatonic: UI blips climb the key of the score."""
    return [74, 76, 78, 81, 83]


def strike_sfx() -> np.ndarray:
    t = sl.seconds_axis(0.6)
    swipe = sl.stft_filter(
        sl._noise(61, len(t)), sl.log_curve([(0, 8000), (0.42, 1100)]), "lp", 2, 512
    )
    swipe = sl.stft_filter(swipe, 800, "hp", 2, 512) * (
        sl.smoothstep(t / 0.015) * np.exp(-t * 7.5)
    ).astype(np.float32)
    drop = 940 * np.exp(-t * 2.4)
    dive = np.sin(sl.TAU * np.cumsum(drop) / sl.RATE) + 0.55 * np.sin(
        sl.TAU * np.cumsum(drop * 1.4142) / sl.RATE
    )
    dive = dive * np.exp(-t * 8.5) * 0.4
    return sl.normalize(sl.fade_edges((swipe + dive).astype(np.float32), 0.002, 0.12), 0.8)


def verify_sfx() -> np.ndarray:
    stage = sl.Stage(2.2)
    for at, midi, gain in ((0.0, 74, 1.0), (0.07, 81, 0.85), (0.14, 86, 0.75), (0.23, 90, 0.6)):
        stage.put(sl.bell(sl.mtof(midi), 2.0, 1.8, 3.0, 2.4), at, gain, (midi - 80) / 30)
    stage.put(sl.pluck(sl.mtof(62), 1.2, 0.6, 2.0), 0.0, 0.35, 0.0)
    return sl.normalize(stage.buf, 0.85)


def lock_sfx() -> np.ndarray:
    stage = sl.Stage(1.4)
    t = sl.seconds_axis(0.3)
    thunk = np.sin(sl.TAU * np.cumsum(58 + 120 * np.exp(-t * 26)) / sl.RATE) * np.exp(-t * 17)
    stage.put(sl.rim().astype(np.float32), 0.0, 0.8)
    stage.put(sl.normalize(thunk.astype(np.float32)), 0.0, 0.9)
    stage.put(sl.bell(sl.mtof(86), 1.2, 1.2, 3.0, 4.5), 0.035, 0.5, 0.2)
    stage.put(sl.bell(sl.mtof(93), 1.2, 1.0, 3.0, 5.0), 0.07, 0.3, -0.2)
    return sl.normalize(stage.buf, 0.8)


def effects() -> None:
    sl.write_wav(SFX / "impact.wav", sl.normalize(sl.boom(), 0.85))
    sl.write_wav(SFX / "whoosh.wav", sl.whoosh(1.0, peak_at=0.75) * 0.9)
    for index, midi in enumerate(tick_ladder()):
        sl.write_wav(SFX / f"tick-{index}.wav", sl.blip(sl.mtof(midi), 0.3) * 0.8)
    sl.write_wav(SFX / "strike.wav", strike_sfx())
    sl.write_wav(SFX / "verify.wav", verify_sfx())
    sl.write_wav(SFX / "lock.wav", lock_sfx())
    for stale in (AUDIO / "impact.wav", AUDIO / "verify.wav"):
        stale.unlink(missing_ok=True)


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
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--music-only", action="store_true", help="skip narration synthesis (no network needed)"
    )
    args = parser.parse_args()
    AUDIO.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    if not args.music_only:
        asyncio.run(narration())
    music()
    effects()
    subtitles()
    print("audio, music, effects, and subtitles ready")
