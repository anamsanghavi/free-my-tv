"""Local addition, run once per new clip: finds where each clip's picture sits relative to its still (Veo often frames
a clip a little closer or further off than the picture it was made from), so make_dio_video.py cuts the clip's close-up
to line up with the still's. Writes webos/dio_align.json. Needs OpenCV (pip install opencv-python); without it, or for
a clip not listed, make_dio_video.py assumes the clip is framed like its still.

    python3 webos/align_dio_clips.py <folder with the dioramas>
"""
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

from dio_frame import box

HERE = os.path.dirname(os.path.abspath(__file__))
NAMES = {'snow-day': 'snow', 'snowy-day': 'snow'}


def main():
    src = os.path.expanduser(sys.argv[1])
    out = {}
    for name in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in ('.mp4', '.mov', '.webm', '.m4v'):
            continue
        img = NAMES.get(stem, stem)
        still = next((os.path.join(src, img + e) for e in ('.jpg', '.jpeg', '.png') if os.path.exists(os.path.join(src, img + e))), None)
        if not still:
            continue
        frame = os.path.join(tempfile.gettempdir(), 'align-%s.png' % stem)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-ss', '0.2', '-i', os.path.join(src, name), '-frames:v', '1', frame])
        a = cv2.imread(still, cv2.IMREAD_GRAYSCALE)
        b = cv2.imread(frame, cv2.IMREAD_GRAYSCALE)
        k = b.shape[1] / float(a.shape[1])
        a_small = cv2.resize(a, (b.shape[1], b.shape[0]), interpolation=cv2.INTER_AREA)
        orb = cv2.ORB_create(6000)
        ka, da = orb.detectAndCompute(a_small, None)
        kb, db = orb.detectAndCompute(b, None)
        matches = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(da, db)
        pa = np.float32([ka[m.queryIdx].pt for m in matches])
        pb = np.float32([kb[m.trainIdx].pt for m in matches])
        M, inl = cv2.estimateAffinePartial2D(pa, pb, method=cv2.RANSAC, ransacReprojThreshold=3.0)
        if M is None or inl.sum() < 40:
            print('%-20s no reliable match, left as is' % stem)
            continue
        s = float(np.hypot(M[0, 0], M[1, 0]))
        x0, y0, x1, y1 = [v * k for v in box(a.shape[1], a.shape[0])]
        tx, ty = M[0, 2], M[1, 2]
        r = [x0 * s + tx, y0 * s + ty, x1 * s + tx, y1 * s + ty]
        # never outside the clip: shift back in (keeping the size), then shrink if it still doesn't fit
        w, h = r[2] - r[0], r[3] - r[1]
        W, H = b.shape[1], b.shape[0]
        if w > W or h > H:
            f = min(W / w, H / h); cx, cy = (r[0] + r[2]) / 2, (r[1] + r[3]) / 2; w *= f; h *= f
            r = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
        dx = -r[0] if r[0] < 0 else (W - r[2] if r[2] > W else 0)
        dy = -r[1] if r[1] < 0 else (H - r[3] if r[3] > H else 0)
        r = [int(round(r[0] + dx)), int(round(r[1] + dy)), int(round(r[2] + dx)), int(round(r[3] + dy))]
        out[stem] = r
        print('%-20s scale %.3f, %d matches, crop %s%s' % (stem, s, int(inl.sum()), r, ' (pulled inside the frame)' if dx or dy else ''))
    with open(os.path.join(HERE, 'dio_align.json'), 'w') as f:
        json.dump(out, f, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
