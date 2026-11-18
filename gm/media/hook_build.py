# Feed intro film: 4:5, 12 s loop, three vehicles x four beats, light sweep (with shine band) on every change.
# Writes media/hook.mp4 and media/hook.json (the beat schedule the page uses for its caption).
import sys, json; sys.path.insert(0,'/home/claude/seg')
import cv2, numpy as np, subprocess
from recol import recol
M='/home/claude/flicks-social-apps/gm/media/'
import json as _j
PLAN = _j.load(open(sys.argv[1]))      # [{car, env, mod, col, label}] one per beat
BEAT, SW, OFF = 1.0, 0.45, 12          # seconds per beat, sweep length, start frame inside each drive
W, H, Y0 = 720, 900, 150               # 4:5 crop of the 720x1280 clips
caps = {}
def frame(b, n):
    k = (b['car'], b['env'], b['mod'])
    if k not in caps: caps[k] = cv2.VideoCapture(f"{M}{k[0]}_{k[1]}_{k[2]}.mp4")
    c = caps[k]; c.set(cv2.CAP_PROP_POS_FRAMES, n); ok, f = c.read()
    return recol(f, b['col'])[0][Y0:Y0+H]
def carStart(i):                       # first beat index of this beat's vehicle
    while i > 0 and PLAN[i-1]['car'] == PLAN[i]['car']: i -= 1
    return i
xs = np.linspace(0,1,W)[None,:,None]; ys = np.linspace(0,1,H)[:,None,None]; pos = xs*0.75 + ys*0.25
N = int(len(PLAN)*BEAT*24)
p = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r','24','-i','-',
    '-c:v','libx264','-preset','slow','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','-an',M+'hook.mp4'], stdin=subprocess.PIPE)
fidx = lambda i, n: OFF + n - int(carStart(i)*BEAT*24)
for n in range(N):
    t = n/24; i = int(t//BEAT); b = PLAN[i]
    o = frame(b, fidx(i, n)).astype(np.float32)
    dt = t - i*BEAT
    if dt < SW:                                     # sweep from the previous beat (beat 0 sweeps from the last: seamless loop)
        j = (i-1) % len(PLAN); pj = fidx(j, n if j < i else n + N)
        po = frame(PLAN[j], pj).astype(np.float32)
        w = -0.12 + (dt/SW)*1.32
        a = np.clip((w - pos)/0.1 + 0.5, 0, 1)      # 1 = new state
        o = po*(1-a) + o*a + 255*0.30*np.exp(-((pos-w)/0.03)**2)
    p.stdin.write(np.clip(o,0,255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait()
json.dump([{'t': i*BEAT, 'label': b['label'], 'car': b['car'], 'env': b['env'], 'mod': b['mod'], 'col': b['col']} for i, b in enumerate(PLAN)], open(M+'hook.json','w'))
print('ok', N, 'frames')
