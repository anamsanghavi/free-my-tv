"""Local addition: where the home screen's close-up sits in each diorama (shared by the make_dio_*.py scripts).

The home screen shows the diorama full screen, close up: the city's middle and the sky above it, cut straight from the
original picture (or clip) at full resolution, so nothing is enlarged from a small copy.
"""
from PIL import Image

W, H = 1920, 1080
X0, XW = 0.1685, 0.7368   # the close-up's left edge and width, as fractions of the original's width; it starts at the top


def box(w, h):
    """The close-up's rectangle in a w x h original (16:9, from the top)."""
    x0 = int(round(w * X0))
    cw = int(round(w * XW))
    ch = min(h, int(round(cw * H / float(W))))
    return x0, 0, x0 + cw, ch


def close_up(im):
    """The 1920 x 1080 close-up of an original picture."""
    return im.crop(box(*im.size)).resize((W, H), Image.LANCZOS)


def to_screen(w, h, x, y):
    """A point in a w x h original, on the 1920 x 1080 screen."""
    x0, y0, x1, y1 = box(w, h)
    s = W / float(x1 - x0)
    return (x - x0) * s, (y - y0) * s, s
