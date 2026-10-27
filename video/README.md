# MatchMind films

Two independently composed Remotion productions share the same real hero data and Daylight visual language:

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
- `scripts/generate_audio.py` creates ten concise English narration files with Edge TTS, the original score and sound effects, plus English sidecar subtitles. `--music-only` skips the network narration step and only needs numpy.
- `public/audio/` contains the generated narration, WAV scores (`music.wav`, `teaser-music.wav`) and `sfx/`.

## Sound design

The score is composed against the edit instead of looping a beat. `scripts/cuesheet.py` is the cue sheet, `scripts/score.py` the arrangement engine, and `scripts/soundlab.py` the numpy DSP kit (additive/FM synths, sweepable STFT filters, convolution reverb, sidechain, limiter).

- **Key and tempo**: D major / B minor at 120 BPM, so every scene cut falls on a beat (one beat = 15 frames). One four-bar hook (D, A, Bm, G) is hinted in the reveal, grows through the film and resolves in the outro.
- **Arc**: Storm (dissonant B drone and data ticks that collapse into silence) -> Reveal (floodlight bells, groove arrives) -> Hero pass (pressure trap, stop-time, release on the ball strike at 21.17 s) -> Agents (machine-room sequencer) -> Revision (darker, hollow, wrong note at 40.3 s) -> Evidence (rising dominant, resolution on the stamp at 50.17 s) -> Director -> Product (build) -> Audiences (full hook) -> Outro (resolution at 84 s, long tail).
- **Sync**: events that are off the beat grid (ball strike, verifier stamp) get a short stop-time gap so the hit lands on the picture.
- **Mix**: the score is level-matched, then ducked under each narration clip by a per-scene depth solved so the 200 Hz-5.2 kHz band stays about 12 dB under the speech (measured 12-14 dB in the 0.5-4 kHz presence band; lows duck least). `VOICE_VOLUME` in `src/Promo.tsx` must match `voice_gain` in `scripts/score.py`. Sound effects live in `public/audio/sfx/` and are placed from the cue lists in `src/Promo.tsx`; UI blips climb D major pentatonic.
- **Targets**: about -16.6 LUFS integrated with peaks below -1 dBFS for both films (the old mix was -20.9 / -21.5 LUFS with the narration only 1-2 dB above the music).

Changing only the audio does not require re-rendering frames:

```bash
npm run audio          # regenerate score and sfx (numpy only)
npm run render:audio   # Remotion mix of score + narration + sfx -> out/*-audio.wav
npm run mux            # swap that mix into web/public and docs mp4s, video stream copied untouched
```

## Output

- `out/promo.mp4` is copied to `web/public/promo.mp4` and `docs/promo.mp4`.
- `out/teaser.mp4` is copied to `web/public/teaser.mp4`.
- `out/promo.en.srt` is also written to `web/public/`; no Chinese captions are rendered.

Validate the actual media:

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,duration -of json out/promo.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,codec_type,width,height,duration -of json out/teaser.mp4
```

The main video stream is exactly 90 seconds. AAC container padding can add a few milliseconds to the format duration. Key frames are rendered and visually inspected before the full render.
