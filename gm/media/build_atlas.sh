#!/usr/bin/env bash
# build_atlas.sh <car> <mod1> <mod2> <mod3> : 6x2 grid, cell = env*4 + mod (envs lake,desert,coast; mods stock,m1,m2,m3)
set -e
car=$1; shift; mods=(stock "$@"); envs=(lake desert coast)
cd /home/claude/flicks-social-apps/gm/media
in=(); n=0
for e in "${envs[@]}"; do for m in "${mods[@]}"; do in+=(-i "${car}_${e}_${m}.mp4"); n=$((n+1)); done; done
f=""; lay=""
for i in $(seq 0 11); do f+="[$i:v]scale=540:960:flags=lanczos,setsar=1,fps=24[c$i];"; x=$(( (i%6)*540 )); y=$(( (i/6)*960 )); lay+="${x}_${y}|"; done
ins=$(for i in $(seq 0 11); do printf "[c$i]"; done)
ffmpeg -v error -y "${in[@]}" -filter_complex "${f}${ins}xstack=inputs=12:layout=${lay%|}[v]" -map "[v]" -frames:v 241 \
  -c:v libx264 -preset slow -crf 25 -profile:v high -level 5.1 -pix_fmt yuv420p -movflags +faststart -an atlas_${car}.mp4
echo "atlas_${car}.mp4 $(du -k atlas_${car}.mp4 | cut -f1)KB"
