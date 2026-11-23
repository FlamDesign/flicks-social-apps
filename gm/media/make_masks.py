# For each clip: per-frame car silhouette (see silhouette.py), widened by 1 frame either side in time so a small
# video drift never matters, saved as a 270x480 grey video (one grid cell at half resolution).
import sys, os, subprocess, numpy as np, cv2
from multiprocessing import Pool
sys.path.insert(0, '/home/claude/seg')
from silhouette import silhouette
M = '/home/claude/flicks-social-apps/gm/media/'
OUT = '/home/claude/masks/'
def run(clip):
    out = f'{OUT}mask_{clip}.mp4'
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(M + clip + '.mp4'): return clip, 'cached'
    c = cv2.VideoCapture(M + clip + '.mp4'); fr = []
    while True:
        ok, f = c.read()
        if not ok: break
        fr.append(cv2.resize(silhouette(f), (270, 480), interpolation=cv2.INTER_AREA))
    fr = np.array(fr)
    sm = np.maximum(fr, np.maximum(np.roll(fr, 1, 0), np.roll(fr, -1, 0)))   # +-1 frame in time
    sm[0] = np.maximum(fr[0], fr[1]); sm[-1] = np.maximum(fr[-1], fr[-2])
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', '270x480', '-r', '24', '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-an', out], stdin=subprocess.PIPE)
    p.stdin.write((np.clip(sm, 0, 1)*255).astype(np.uint8).tobytes()); p.stdin.close(); p.wait()
    return clip, len(fr)
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    mods = {'sierra': ['stock', 'boat', 'camper', 'overland'], 'corvette': ['stock', 'bronze', 'carbon', 'stripes'], 'hummer': ['stock', 'kayaks', 'rooftent', 'big37']}
    clips = [f'{car}_{env}_{m}' for car, ms in mods.items() for env in ('lake', 'desert', 'coast') for m in ms]
    with Pool(int(sys.argv[1]) if len(sys.argv) > 1 else 4) as pool:
        for r in pool.imap_unordered(run, clips): print(*r, flush=True)
