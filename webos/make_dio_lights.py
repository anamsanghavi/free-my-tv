"""Local addition: lights that follow the clock. For each night diorama, find its lit windows and street lights and make
pictures of them switched off, in groups: scenes/dio-<name>-lights-<k>.png (960x540, scaled up on the TV). The home screen
shows more of these groups late at night (custom.js: lightsOff), so the city goes quiet a few blocks at a time.

A scene with a video is read from the video's first frame (that's what's on screen), so the dark windows line up.

    python3 webos/make_dio_lights.py
"""
import os
import random
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'scenes')
W, H = 960, 540
GROUPS = 6
CELL = 22   # windows in the same patch of city switch off together (a floor, a house)
BORROW = {'partly-cloudy-night': 'overcast-night', 'flurries': 'snow'}   # as in make_dioramas.py


def frame(name):
    """What the TV shows for this scene: the clip's first frame when it has a clip, else its still."""
    clip = os.path.join(WEB, 'dio-%s.mp4' % name)
    if os.path.exists(clip):
        out = os.path.join(tempfile.gettempdir(), 'lights-%s.png' % name)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-ss', '0.2', '-i', clip, '-frames:v', '1', '-vf', 'scale=%d:%d' % (W, H), out])
        return Image.open(out).convert('RGB')
    return Image.open(os.path.join(WEB, 'dio-%s.jpg' % name)).convert('RGB').resize((W, H), Image.LANCZOS)


def blur(a, r):
    return np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)


def blurf(a, r):
    """Blur a 0..1 float map."""
    return blur(a * 255.0, r) / 255.0


def make(name):
    im = np.asarray(frame(name), dtype=np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    # warm, bright, and small: brighter than what's right around it (a window or a lamp), not a glowing plaza or a lit wall
    peak = lum - blur(lum, 7)
    lit = (lum > 110) & (r > 140) & (r - b > 40) & (r >= g) & (peak > 22)
    model = np.ones((H, W), dtype=bool)
    mask_path = os.path.join(WEB, 'dio-%s-mask.png' % name)
    if os.path.exists(mask_path):   # only on the model, never the backdrop
        model = np.asarray(Image.open(mask_path).getchannel('A').resize((W, H)), dtype=np.float32) < 128
    lit &= model
    if lit.sum() < 40:
        return 0
    # switched off = the same pixel, much darker (its own colour, so nothing smears): only where it was lit, and
    # in proportion to how much brighter than its surroundings it was, so the edges stay soft
    off = im * 0.32
    strength = np.clip((peak - 14) / 36.0, 0, 1) * lit
    alpha = blurf(strength, 0.6)
    rnd = random.Random(name)
    cells = {}
    gy, gx = np.mgrid[0:H, 0:W]
    cell = (gy // CELL) * 1000 + (gx // CELL)
    for cid in np.unique(cell[alpha > 0.02]):
        cells[cid] = rnd.randrange(GROUPS)
    lut = np.vectorize(lambda c: cells.get(c, -1))
    group = lut(cell)
    for k in range(GROUPS):
        a = np.where(group == k, alpha, 0.0)
        rgb = np.where((a > 0.004)[..., None], off.clip(0, 255), 0)   # nothing stored where nothing shows: tiny files
        rgba = np.dstack([rgb, (a * 255).clip(0, 255)]).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(os.path.join(WEB, 'dio-%s-lights-%d.png' % (name, k)), optimize=True)
    return int(lit.sum())


def main():
    os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)   # the scene pack (git-ignored; see scenes/README)
    names = sorted(f[4:-4] for f in os.listdir(WEB) if f.startswith('dio-') and f.endswith('.jpg'))
    for name in names:
        if not ('night' in name or 'aurora' in name):
            continue
        if name in BORROW:   # it shows another scene's clip: those lights are made with that scene
            continue
        if name.startswith('new-year'):   # nobody turns the lights off on New Year's Eve
            continue
        n = make(name)
        print('%-24s %s' % (name, ('%d lit pixels' % n) if n else 'no lights found'))


if __name__ == '__main__':
    sys.exit(main())
