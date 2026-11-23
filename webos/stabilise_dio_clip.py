"""Local addition: holds a Veo clip still. Veo sometimes drifts the camera (a slow zoom out, a little pan) even when told
not to, and sometimes paints back a moon the still doesn't have. This lines up every frame of the clip with its still
picture, so the city never moves, and, for the night scenes in make_dioramas.MOONS, paints the moon out of every frame
with the sky from the still. The original clip is kept in for-veo/originals/. Needs OpenCV (pip install opencv-python).

    python3 webos/stabilise_dio_clip.py ~/Desktop/dioramas clear-night [fog ...]
"""
import os
import shutil
import subprocess
import sys
import tempfile

import cv2
import numpy as np

import make_dioramas


def main():
    src = os.path.expanduser(sys.argv[1])
    for stem in sys.argv[2:]:
        clip = os.path.join(src, stem + '.mp4')
        keep = os.path.join(src, 'for-veo', 'originals')
        os.makedirs(keep, exist_ok=True)
        original = os.path.join(keep, stem + '.mp4')
        if not os.path.exists(original):
            shutil.move(clip, original)
        img = {'snow-day': 'snow'}.get(stem, stem)
        still = cv2.imread(os.path.join(src, img + '.jpg'))
        cap = cv2.VideoCapture(original)
        fps = cap.get(cv2.CAP_PROP_FPS) or 24
        frames = []
        while True:
            ok, f = cap.read()
            if not ok:
                break
            frames.append(f)
        H, W = frames[0].shape[:2]
        ref = cv2.resize(still, (W, int(round(W * still.shape[0] / float(still.shape[1])))), interpolation=cv2.INTER_AREA)
        rh = ref.shape[0]
        orb = cv2.ORB_create(5000)
        kr, dr = orb.detectAndCompute(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY), None)
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        params = []
        for f in frames:
            kf, df = orb.detectAndCompute(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), None)
            m = bf.match(df, dr)
            pf = np.float32([kf[x.queryIdx].pt for x in m])
            pr = np.float32([kr[x.trainIdx].pt for x in m])
            M, _ = cv2.estimateAffinePartial2D(pf, pr, method=cv2.RANSAC, ransacReprojThreshold=2.5)
            s = np.hypot(M[0, 0], M[1, 0]); a = np.arctan2(M[1, 0], M[0, 0])
            params.append([s, a, M[0, 2], M[1, 2]])
        p = np.array(params)
        k = 9   # smoothed over a few frames, so the correction itself never jitters
        pad = np.pad(p, ((k // 2, k // 2), (0, 0)), mode='edge')
        p = np.stack([np.convolve(pad[:, i], np.ones(k) / k, mode='valid') for i in range(4)], 1)
        # the moon, painted out of every frame with that frame's own sky around it (a smooth gradient fitted to a ring
        # around the glow, stars left out), as make_dioramas.py does for the still
        moon = None
        if stem in make_dioramas.MOONS:
            fx, fy, fr, fe = make_dioramas.MOONS[stem]
            x, y, r, e = fx * W, fy * rh, fr * W * 1.6, fe * W * 1.4   # a little wider: Veo's moon and glow run larger
            R = int(r + e + 70)
            x0, y0, x1, y1 = max(0, int(x - R)), max(0, int(y - R)), min(W, int(x + R)), min(rh, int(y + R))
            gy, gx = np.mgrid[y0:y1, x0:x1]
            d = np.sqrt((gx - x) ** 2 + (gy - y) ** 2)
            hole = (np.clip((r + e - d) / e, 0, 1) ** 0.7)[..., None]
            ring = (d > r + e) & (d < r + e + 60)
            u, v = (gx - x) / 200.0, (gy - y) / 200.0
            T = np.stack([np.ones_like(u), u, v, u * u, v * v, u * v], -1)
            moon = (x0, y0, x1, y1, hole, ring, T)
        tmp = os.path.join(tempfile.gettempdir(), stem + '-steady.avi')
        out = cv2.VideoWriter(tmp, cv2.VideoWriter_fourcc(*'MJPG'), fps, (W, rh))
        for f, (s, a, tx, ty) in zip(frames, p):
            M = np.array([[s * np.cos(a), -s * np.sin(a), tx], [s * np.sin(a), s * np.cos(a), ty]], dtype=np.float32)
            g = cv2.warpAffine(f, M, (W, rh), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
            if moon is not None:
                x0, y0, x1, y1, hole, ring, T = moon
                roi = g[y0:y1, x0:x1].astype(np.float32)
                rr = ring & (roi.mean(-1) < np.percentile(roi.mean(-1)[ring], 85))
                fill = np.stack([T @ np.linalg.lstsq(T[rr], roi[..., c][rr], rcond=None)[0] for c in range(3)], -1)
                g[y0:y1, x0:x1] = (roi * (1 - hole) + fill * hole).clip(0, 255).astype(np.uint8)
            out.write(g)
        out.release()
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-i', original, '-map', '0:v', '-map', '1:a?',
                               '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', clip])
        os.remove(tmp)
        print('%-14s held still: zoom %.3f..%.3f, drift %.0f px; %s' % (stem, p[:, 0].min(), p[:, 0].max(),
              np.hypot(p[:, 2] - p[0, 2], p[:, 3] - p[0, 3]).max(), 'moon painted out' if moon is not None else 'no moon to paint'))


if __name__ == '__main__':
    main()
