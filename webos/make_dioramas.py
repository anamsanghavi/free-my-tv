"""Local addition: prepares the weather dioramas for the TV.

    python3 webos/make_dioramas.py <folder with the 12 dioramas>

Each becomes a 1920 x 1080 wallpaper in web/ (dio-<name>.jpg): a full-screen close-up of the city and the sky above it
(dio_frame.py). scenes/dioramas.js lists them, and whether the sky behind the clock is light (dark lettering) or dark.
"""
import json
import os
import sys

from PIL import Image, ImageFilter, ImageStat

from dio_frame import W, H, close_up, to_screen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Moons painted into the pictures: centre x and y as fractions of the original's width and height, then the moon's radius
# and how far its glow reaches, as fractions of its width. The home screen draws tonight's real moon instead
# (weatherfx.js), so these are painted out with the sky around them. Add one here for a new night picture.
MOONS = {'clear-night': (0.5767, 0.0671, 0.0115, 0.038), 'winter-clear-night': (0.1802, 0.1016, 0.022, 0.05)}


def without_moon(im, stem, size):
    """Paint the picture's own moon and its glow over with the sky around it (im: the close-up; size: the original's).

    The sky behind is a smooth gradient: fitted to a ring around the glow (stars left out), then blended in softly, so no
    darker disc is left where the glow was."""
    import numpy as np
    if stem not in MOONS:
        return im
    fx, fy, fr, fe = MOONS[stem]
    x, y, s = to_screen(size[0], size[1], fx * size[0], fy * size[1])
    r, edge = fr * size[0] * s, fe * size[0] * s
    a = np.asarray(im, dtype=np.float32)
    gy, gx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    d = np.sqrt((gx - x) ** 2 + (gy - y) ** 2)
    hole = np.clip((r + edge - d) / edge, 0, 1) ** 0.7
    ring = (d > r + edge) & (d < r + edge + 140)
    lum = a.mean(-1)
    ring &= lum < np.percentile(lum[ring], 85)   # not the stars
    u, v = (gx - x) / 300.0, (gy - y) / 300.0
    terms = np.stack([np.ones_like(u), u, v, u * u, v * v, u * v], -1)
    fill = np.stack([terms @ np.linalg.lstsq(terms[ring], a[..., c][ring], rcond=None)[0] for c in range(3)], -1)
    out = a * (1 - hole[..., None]) + fill * hole[..., None]
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


# Where the home screen's words sit (1920 x 1080): the date and weather line, the clock's digits, a notice under it.
# Each gets the lettering that reads on the picture right behind it: 'd' (dark ink) or 'l' (light), and '+' when the
# picture there is busy (sky on one side, a building on the other), which asks for a stronger halo.
TEXT_AREAS = {'date': (540, 52, 1380, 104), 'clock': (640, 130, 1280, 380), 'notice': (520, 420, 1400, 520)}


def shade(h, light, alert):
    """The home screen's shade over the picture (custom.css #wallshade), as (colour, opacity per row)."""
    import numpy as np
    y = np.arange(h, dtype=np.float32) / h
    if alert:   # while a notice shows, the shade reaches down to carry it
        top, mid = (0.7, 0.62) if light else (0.62, 0.5)
        a = np.where(y < 0.46, top + (mid - top) * y / 0.46, np.clip(mid * (0.64 - y) / 0.18, 0, mid))
    elif light:
        a = np.clip(0.6 * (1 - y / 0.42), 0, 1)
    else:
        a = np.clip(0.55 * (1 - y / 0.45), 0, 1)
    return (np.array([255, 252, 246] if light else [10, 12, 22], dtype=np.float32), a)


def ink(im, light):
    """The lettering for each of the home screen's words, from what's right behind them: the picture under its shade."""
    import numpy as np
    pic = np.asarray(im, dtype=np.float32)
    out = {}
    for key, (x0, y0, x1, y1) in TEXT_AREAS.items():
        colour, a = shade(pic.shape[0], light, key == 'notice')
        shown = pic * (1 - a[:, None, None]) + colour * a[:, None, None]
        g = (0.2126 * shown[..., 0] + 0.7152 * shown[..., 1] + 0.0722 * shown[..., 2])[y0:y1, x0:x1]
        lum = float(np.percentile(g, 50))
        out[key] = ('d' if lum > 140 else 'l') + ('+' if float(g.std()) > 30 or 95 < lum < 185 else '')
    return out


# Scenes without a clip that borrow one, only where the two pictures are near-identical (same season, light and sky).
BORROW = {'partly-cloudy-night': 'overcast-night', 'flurries': 'snow'}


def main():
    os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)   # the scene pack (git-ignored; see scenes/README)
    src = os.path.expanduser(sys.argv[1])
    out = {}
    for name in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
            continue
        im = Image.open(os.path.join(src, name)).convert('RGB')
        back = close_up(im)   # full screen, close up, cut from the original at full resolution
        if 'night' in stem or 'aurora' in stem:
            back = without_moon(back, stem, im.size)   # the home screen draws tonight's real moon (weatherfx.js): no second one
        back.save(os.path.join(ROOT, 'scenes', 'dio-%s.jpg' % stem), 'JPEG', quality=84, optimize=True)
        # the sky behind the date and clock decides the shade: cream on a light sky, night blue on a dark one
        r, g, b = ImageStat.Stat(back.crop((300, 0, 1620, 300))).median
        light = (0.2126 * r + 0.7152 * g + 0.0722 * b) > 140
        out[stem] = {'light': light, 'ink': ink(back, light)}
        if os.path.exists(os.path.join(ROOT, 'scenes', 'dio-%s.mp4' % stem)):
            out[stem]['video'] = True   # made by make_dio_video.py
        elif os.path.exists(os.path.join(ROOT, 'scenes', 'dio-%s.mp4' % BORROW.get(stem, '-'))):
            out[stem]['video'] = BORROW[stem]   # no clip of its own: borrows a near-identical scene's
        # lights that follow the clock (make_dio_lights.py), made from whatever the scene shows: its clip or its still
        src_name = out[stem]['video'] if isinstance(out[stem].get('video'), str) else stem
        n = 0
        while os.path.exists(os.path.join(ROOT, 'scenes', 'dio-%s-lights-%d.png' % (src_name, n))):
            n += 1
        if n:
            out[stem]['lights'] = n
        if os.path.exists(os.path.join(ROOT, 'scenes', 'sound-%s.ogg' % src_name)):
            out[stem]['sound'] = src_name   # make_dio_sound.py: the clip's own ambience
        print('%-14s %s' % (stem, 'light' if out[stem]['light'] else 'dark'))
    with open(os.path.join(ROOT, 'scenes', 'dioramas.js'), 'w') as f:
        f.write('window.DIORAMAS = %s;\n' % json.dumps(out, sort_keys=True))


if __name__ == '__main__':
    main()
