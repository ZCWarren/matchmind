#!/usr/bin/env bash
# Swap the soundtrack of the shipped films for the Remotion audio mix without re-rendering any frames.
# Run `npm run render:audio` first. Video streams are copied bit-for-bit.
set -euo pipefail

cd "$(dirname "$0")/.."
root=$(cd .. && pwd)

mux() {
  local source=$1 mix=$2 seconds=$3 target=$4
  local scratch
  scratch=$(mktemp --suffix=.mp4)
  ffmpeg -y -v error -i "$source" -i "$mix" -map 0:v:0 -map 1:a:0 -c:v copy \
    -c:a aac -b:a 192k -ar 48000 -t "$seconds" -movflags +faststart "$scratch"
  cp "$scratch" "$target"
  rm -f "$scratch"
  echo "muxed $target"
}

mux "$root/web/public/promo.mp4" out/promo-audio.wav 90 "$root/web/public/promo.mp4"
cp "$root/web/public/promo.mp4" "$root/docs/promo.mp4"
mux "$root/web/public/teaser.mp4" out/teaser-audio.wav 15 "$root/web/public/teaser.mp4"
