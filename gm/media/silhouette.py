# Car silhouette from the magenta key: confident paint -> close -> fill holes -> keep real blobs -> widen -> soften.
# Used as the "this is the car" region: inside it, pale/lilac sky reflections on the paint count as paint; outside, nothing does.
import cv2, numpy as np
from recol import key_parts, lin
ss = lambda e0, e1, x: (lambda t: t*t*(3-2*t))(np.clip((x-e0)/(e1-e0), 0, 1))
K_CLOSE = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))
K_GROW = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))
def silhouette(bgr, min_area=2500):
    l = lin(bgr[..., ::-1].astype(np.float32)/255)
    strong, weak, spec, rd, bd = key_parts(l)
    conf = (strong*ss(0.15, 0.28, (rd + bd)/0.85) > 0.5).astype(np.uint8)
    m = cv2.morphologyEx(conf, cv2.MORPH_CLOSE, K_CLOSE)
    # fill holes (windows, intakes inside the body)
    h, w = m.shape; ff = m.copy()*255; mask = np.zeros((h+2, w+2), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 128)
    m = np.where(ff == 128, 0, 1).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros_like(m)
    if n > 1:
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        for i in range(1, n):
            if i == big or stats[i, cv2.CC_STAT_AREA] >= min_area: keep[lab == i] = 1
    # grow through connected pale/lilac reflections on the paint (up to ~30 px), never across non-paint gaps into the sky
    r, g, b = l[..., 0], l[..., 1], l[..., 2]
    sp = np.minimum(g, np.minimum(r, b)); mx = np.maximum(np.maximum(r, b), 1e-5)
    sat = (mx - g)/mx; ratio = (b - sp)/np.maximum(r - sp, 1e-5)
    pale = (ss(0.04, 0.12, sat)*ss(0.012, 0.06, ratio)*(1 - ss(9.0, 16.0, ratio))*ss(0.002, 0.006, mx) > 0.3).astype(np.uint8)
    allow = np.maximum(pale, keep); k3 = np.ones((3, 3), np.uint8); grown = keep.copy()
    for _ in range(30): grown = cv2.dilate(grown, k3) & allow
    keep = cv2.dilate(grown, K_GROW)
    return cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 5)
