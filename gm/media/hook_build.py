# Feed intro film: 4:5, 12 s loop, three vehicles x four beats.
# Transitions match the configurator: paint/package/vehicle changes = a glossy ripple across the car body only;
# road changes = one ring that spreads from the car across the scenery. Both bend the image slightly as they pass.
# Writes media/hook.mp4 and media/hook.json (the beat schedule the page uses for its caption and tap-to-open state).
import sys, json; sys.path.insert(0,'/home/claude/seg')
import cv2, numpy as np, subprocess
from recol import recol, key_parts as rkey, lin as rlin
M='/home/claude/flicks-social-apps/gm/media/'
PLAN = json.load(open(sys.argv[1]))
OUT = (sys.argv[2].rstrip('/') + '/') if len(sys.argv) > 2 else M   # where hook.mp4 / hook.json go (source clips always come from M)
BEAT, SW, OFF = 1.0, 0.72, 12          # seconds per beat, transition length, start frame inside each drive
W, H, Y0, FH = 720, 900, 150, 1280     # 4:5 crop of the 720x1280 clips
ss = lambda e0, e1, x: (lambda t: t*t*(3-2*t))(np.clip((x-e0)/(e1-e0), 0, 1))
caps = {}
def frame(b, n):
    k = (b['car'], b['env'], b['mod'])
    if k not in caps: caps[k] = cv2.VideoCapture(f"{M}{k[0]}_{k[1]}_{k[2]}.mp4")
    c = caps[k]; c.set(cv2.CAP_PROP_POS_FRAMES, n); ok, f = c.read()
    img, m = recol(f, b['col'])
    km, _, _, rd, bd = rkey(rlin(f[Y0:Y0+H, :, ::-1].astype(np.float32)/255.0))
    conf = ss(0.45, 0.75, km)*ss(0.15, 0.28, (rd + bd)/0.85)          # confident, well-lit paint only (no red rock, no haze)
    return img[Y0:Y0+H].astype(np.float32)/255.0, conf.astype(np.float32)   # confident paint only
def carStart(i):
    while i > 0 and PLAN[i-1]['car'] == PLAN[i]['car']: i -= 1
    return i
def modeOf(i):
    a, b = PLAN[(i-1) % len(PLAN)], PLAN[i]
    return 'road' if (a['car'] == b['car'] and a['env'] != b['env']) else 'car'
ss = lambda e0, e1, x: (lambda t: t*t*(3-2*t))(np.clip((x-e0)/(e1-e0), 0, 1))
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
U, V = xs/W, (ys+Y0)/FH                                  # frame uv, same space as the shader
SA = 0.5625; CTR = (0.5, 0.56)
POS = (U*SA*0.8 + V*0.6)/1.05
RV = np.sqrt(((U-CTR[0])*SA)**2 + (V-CTR[1])**2)
DIRC = np.array([SA*0.8, 0.6]); DIRC /= np.linalg.norm(DIRC)
RX, RY = (U-CTR[0]), (V-CTR[1]); RN = np.sqrt(RX**2+RY**2)+1e-5; RX, RY = RX/RN, RY/RN
k_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (23, 23))
k_wide = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(0.15*W), int(0.084*FH)))
def lin(x): return np.power(np.clip(x,0,1), 2.2)
def srgb(x): return np.power(np.clip(x,0,1), 1/2.2)
def remap(img, dx, dy): return cv2.remap(img, (xs+dx).astype(np.float32), (ys+dy).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

N = int(len(PLAN)*BEAT*24)
p = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r','24','-i','-',
    '-c:v','libx264','-preset','slow','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','-an',OUT+'hook.mp4'], stdin=subprocess.PIPE)
fidx = lambda i, n: OFF + n - int(carStart(i)*BEAT*24)
for n in range(N):
    t = n/24; i = int(t//BEAT); b = PLAN[i]
    B, mB = frame(b, fidx(i, n))
    dt = t - i*BEAT
    if dt >= SW:
        out = B
    else:
        j = (i-1) % len(PLAN); A, mA = frame(PLAN[j], fidx(j, n if j < i else n + N))
        prog = 0.5 - 0.5*np.cos(np.pi*dt/SW)
        if modeOf(i) == 'car':
            d = POS - (0.08 + 0.9*prog); dx, dy = DIRC
            region = ss(0.15, 0.6, cv2.GaussianBlur(cv2.dilate(np.maximum(mA, mB), k_small), (0,0), 6)) * ss(0.26, 0.34, V) * (1 - ss(0.9, 0.97, V))   # only where the car can be: never the sky
            shape = ss(0.1, 0.5, cv2.GaussianBlur(cv2.dilate(np.maximum(mA, mB), k_wide), (0,0), 14))
        else:
            d = RV - (0.02 + 0.84*prog); dx, dy = RX, RY
            region = 1.0 - ss(0.1, 0.5, cv2.GaussianBlur(cv2.dilate(mB, k_wide), (0,0), 14))
        near = np.exp(-d*d/0.0016)
        amp = np.sin(d*110.0)*near*0.008*region
        A2 = remap(A, amp*dx*W, amp*dy*FH); B2 = remap(B, amp*dx*W, amp*dy*FH)
        soft = 1.0 - ss(0.25, 0.75, prog)
        zone = np.maximum(region, shape) if modeOf(i) == 'car' else region   # car changes: whole vehicle (racks, trailers) reveals behind the front
        tt = (soft*(1-zone) + ss(-0.008, 0.008, d)*zone)[..., None]   # hard reveal only where the transition belongs; dissolve elsewhere
        c = lin(B2)*(1-tt) + lin(A2)*tt
        core = np.exp(-(d/0.008)**2); edge = np.exp(-((d+0.012)/0.008)**2); sheen = np.exp(-((d+0.03)/0.06)**2)
        echo = (0.45*np.exp(-((d+0.07)/0.007)**2) + 0.2*np.exp(-((d+0.13)/0.008)**2)) if modeOf(i) == 'car' else 0*d
        irid = 0.5 + 0.5*np.cos(6.2831*(d[...,None]*22.0 + np.array([0.0, 0.33, 0.67])[::-1]))   # bgr order
        film = 0.55 + 0.45*irid
        lum = (c @ np.array([0.1, 0.6, 0.3]))[..., None]
        glow = core[...,None]*1.05 + film*edge[...,None]*0.3 + echo[...,None]*0.4
        glow = glow + (np.array([1.0, 0.95, 0.9])*sheen[...,None]*(0.04 + 0.22*lum) if modeOf(i) == 'car' else np.array([1.0, 0.92, 0.85])*sheen[...,None]*0.06)
        out = srgb(c + glow*region[...,None])
    p.stdin.write((np.clip(out,0,1)*255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait()
json.dump([{'t': i*BEAT, 'label': b['label'], 'car': b['car'], 'env': b['env'], 'mod': b['mod'], 'col': b['col']} for i, b in enumerate(PLAN)], open(OUT+'hook.json','w'))
print('ok', N, 'frames', [modeOf(i) for i in range(len(PLAN))])
