#!/usr/bin/env bash
# build_mask_grid.sh <out.mp4> <cols> <clip>... : silhouette grid with the SAME layout as the colour grid, at half size (270x480 cells)
set -e
out=$1; cols=$2; shift 2; n=$#; cd /home/claude/masks
in=(); f=""; lay=""; ins=""; i=0
for c in "$@"; do in+=(-i "mask_$c.mp4"); f+="[$i:v]setsar=1,fps=24[c$i];"; lay+="$(( (i%cols)*270 ))_$(( (i/cols)*480 ))|"; ins+="[c$i]"; i=$((i+1)); done
if [ $n -eq 1 ]; then ffmpeg -v error -y -i "mask_$1.mp4" -frames:v 241 -c:v libx264 -crf 30 -pix_fmt yuv420p -movflags +faststart -an "$out"
else ffmpeg -v error -y "${in[@]}" -filter_complex "${f}${ins}xstack=inputs=$n:layout=${lay%|}[v]" -map "[v]" -frames:v 241 \
  -c:v libx264 -preset slow -crf 30 -profile:v high -pix_fmt yuv420p -movflags +faststart -an "$out"; fi
echo "$(basename $(dirname $(dirname $out)))/$(basename $out) $(du -k "$out" | cut -f1)KB"
