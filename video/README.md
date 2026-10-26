# MatchMind films

Two independently composed Remotion productions share the same real hero data and visual language:

- `MatchMindPromo`: 1920x1080, 30fps, 2700 frames, exactly 90 seconds.
- `MatchMindTeaser`: 1080x1920, 30fps, 450 frames, exactly 15 seconds.

The main film follows one hero pass through data, structure, agents, bounded revision, verification, Director planning and multi-surface delivery. The vertical teaser is not a center crop of the main film.

## Build

```bash
cd video
npm install
npm run sync
uv run --with edge-tts --with numpy python scripts/generate_audio.py
npm run render
```

Useful commands:

```bash
npm run preview
npm run render:main
npm run render:teaser
npx remotion compositions src/index.ts --browser-executable=/usr/bin/google-chrome
```

## Inputs

- `scripts/sync-demo.mjs` reads the actual static hero events and `prompt-v3` insight, then writes `src/generated/hero.json`.
- `src/MatchWorld.tsx` renders those event coordinates through `@remotion/three` and React Three Fiber.
- `public/screens/` contains captures of the current product, not the old dashboard.
- `scripts/generate_audio.py` creates ten scene narration files with Edge TTS, original synthesized music and effects, plus English and Chinese sidecar subtitles.
- `public/audio/` contains the generated narration, WAV music and effects.

## Output

- `out/promo.mp4` is copied to `web/public/promo.mp4` and `docs/promo.mp4`.
- `out/teaser.mp4` is copied to `web/public/teaser.mp4`.
- `out/promo.en.srt` and `out/promo.zh.srt` are also written to `web/public/`.

Validate the actual media:

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,duration -of json out/promo.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,duration -of json out/teaser.mp4
```

The main video stream is exactly 90 seconds. AAC container padding can add a few milliseconds to the format duration. Key frames are rendered and visually inspected before the full render.
