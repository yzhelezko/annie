#!/usr/bin/env bash
# Сжимает видео для сайта: H.264 mp4 (до 1920px, без звука для лупов) + кадр-постер .jpg рядом.
#   scripts/encode-video.sh input.mov content/projects/my-project/loop        → loop.mp4 + loop.jpg
#   SOUND=1 scripts/encode-video.sh film.mov content/projects/my-project/film → со звуком
set -euo pipefail
in="$1"; out="${2%.mp4}"
audio=(-an)
[ "${SOUND:-0}" = "1" ] && audio=(-c:a aac -b:a 128k)
ffmpeg -y -loglevel error -i "$in" -vf "scale='min(1920,iw)':-2" -c:v libx264 -preset slow -crf "${CRF:-24}" \
  -pix_fmt yuv420p -movflags +faststart "${audio[@]}" "$out.mp4"
ffmpeg -y -loglevel error -i "$out.mp4" -vf "select=eq(n\,0)" -frames:v 1 -q:v 3 "$out.jpg"
ls -lh "$out.mp4" "$out.jpg"
