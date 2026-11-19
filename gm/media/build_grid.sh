#!/usr/bin/env bash
# build_grid.sh <out.mp4> <cols> <clip1> <clip2> ... : packs synced 720x1280 clips into one video of 540x960 cells
# (row-major, cell index = position in the list). Used by the lighter GM configurator versions.
set -e
out=$1; cols=$2; shift 2; n=$#
cd "$(dirname "$0")"
in=(); f=""; lay=""; ins=""
i=0; for c in "$@"; do in+=(-i "$c.mp4"); f+="[$i:v]scale=540:960:flags=lanczos,setsar=1,fps=24[c$i];"; lay+="$(( (i%cols)*540 ))_$(( (i/cols)*960 ))|"; ins+="[c$i]"; i=$((i+1)); done
ffmpeg -v error -y "${in[@]}" -filter_complex "${f}${ins}xstack=inputs=$n:layout=${lay%|}[v]" -map "[v]" -frames:v 241 \
  -c:v libx264 -preset slow -crf 25 -profile:v high -level 5.1 -pix_fmt yuv420p -movflags +faststart -an "$out"
echo "$out $(du -k "$out" | cut -f1)KB"
