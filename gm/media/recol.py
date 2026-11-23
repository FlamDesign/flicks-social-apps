import numpy as np, cv2
def lin(x): return np.power(np.clip(x,0,1),2.2)
def srgb(x): return np.power(np.clip(x,0,1),1/2.2)
def ss(e0,e1,x): t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)
def key_parts(l):
    r,g,b = l[...,0],l[...,1],l[...,2]
    spec = np.minimum(g, np.minimum(r,b))
    rd, bd = r-spec, b-spec
    mx = np.maximum(np.maximum(r,b),1e-5)
    sat = (mx - g)/mx                          # how much magenta chroma vs white/grey
    ratio = bd/np.maximum(rd,1e-5)             # 0.1..1.3 for this paint; lilac sky reflections up to ~6
    strong = ss(0.22,0.45,sat) * ss(0.012,0.06,ratio) * (1-ss(2.6,4.0,ratio)) * ss(0.002,0.008,mx)
    weak = ss(0.05,0.16,sat) * ss(0.012,0.06,ratio) * (1-ss(9.0,16.0,ratio)) * ss(0.002,0.006,mx)
    return strong, weak, spec, rd, bd
NEAR_K = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
def key(l):
    """Two-layer key. Confident paint (strict), plus pale sky reflections and edge fringes (loose)
    accepted only within ~12 px of confident paint, so a pale pink sunset sky never counts."""
    strong, weak, spec, rd, bd = key_parts(l)
    near = ss(0.3, 0.8, cv2.dilate(strong.astype(np.float32), NEAR_K))
    m = np.maximum(strong, weak*near)
    return m, spec, rd, bd, near
HALO_K = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45))
def recol(bgr, hexc, spec_mul=1.0, A=0.85, sil=None):
    """Recolour the magenta paint. Mirrors gm/engine.js: key and paint strength smoothed (video colour is stored at
    half resolution in blocks), fine shading restored from brightness, pale/lilac reflections count as paint inside
    the car silhouette, and leftover magenta is stripped on the car and in a thin halo around it."""
    if sil is None:
        from silhouette import silhouette
        sil = silhouette(bgr)
    l = lin(bgr[...,::-1].astype(np.float32)/255)
    strong, weak, spec, rd, bd = key_parts(l)
    blur = lambda x, s: cv2.GaussianBlur(x.astype(np.float32), (0, 0), s)
    near = ss(0.15, 0.6, sil)
    halo = ss(0.2, 0.7, cv2.dilate(sil, HALO_K))
    m = ss(0.05, 0.85, np.maximum(blur(strong, 1.2), blur(weak, 1.2)*near))
    Y = l @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    D = blur((rd + bd)/A, 1.2) * np.clip(Y/np.maximum(blur(Y, 1.5), 1e-4), 0.55, 1.7)
    t = lin(np.array([int(hexc[i:i+2],16)/255 for i in (1,3,5)],np.float32))
    o = t*D[...,None] + spec[...,None]*spec_mul + t*spec[...,None]*(1-spec_mul)*0.6
    dz = np.maximum(near, halo)
    s_ = np.maximum(0, np.minimum(l[...,0], l[...,2]) - l[...,1])*dz
    ld = l - np.stack([s_, np.zeros_like(s_), s_], -1)
    ld[...,2] = ld[...,2]*(1-dz) + np.minimum(ld[...,2], np.maximum(ld[...,0], ld[...,1]))*dz
    out = ld*(1-m[...,None]) + o*m[...,None]
    return (srgb(out)[...,::-1]*255).astype(np.uint8), m
