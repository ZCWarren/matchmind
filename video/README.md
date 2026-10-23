# MatchMind promo

Remotion composition for the two-minute MatchMind promo.

```bash
cd video
npm install --include=dev
npx remotion studio src/index.ts
npx remotion render src/index.ts MatchMindPromo out/promo.mp4 \
  --codec=h264 --crf=20 --concurrency=2 \
  --browser-executable=/usr/bin/google-chrome
```

- `src/Promo.tsx` contains the nine scenes and the 3600-frame timeline.
- `public/screens/` holds the Studio, overlay, Guide, About, and Fan screenshots.
- `public/audio/ambient.mp3` is a synthesized ambient bed.
- `public/fonts/` holds IBM Plex Sans/Mono.
- The render is 1280x720 at 30fps, exactly 120 seconds, with H.264/AAC output.

The output is copied to `docs/promo.mp4` and `web/public/promo.mp4`.
