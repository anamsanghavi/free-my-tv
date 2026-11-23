"""Local addition: for each diorama, scenes/dio-<name>-mask.png: where the weather effects may draw (everywhere except the
model itself and its own clouds and shadow), so the sun, clouds, rain and snow sit behind the diorama. Made on the
home screen's full-screen close-up (dio_frame.py).

    python3 webos/make_dio_masks.py <folder with the dioramas>
"""
import os
import sys

from PIL import Image, ImageChops, ImageFilter

from dio_frame import W, H, box

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)   # the scene pack (git-ignored; see scenes/README)
    src = os.path.expanduser(sys.argv[1])
    for name in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
            continue
        im = Image.open(os.path.join(src, name)).convert('RGB')
        # the plain studio wall: its own colours, read down the photo's left and right edges and blended across
        strip = lambda x0, x1: im.crop((x0, 0, x1, im.height)).resize((1, 24), Image.BOX)
        edge = im.width // 30
        ends = Image.new('RGB', (2, 24))
        ends.paste(strip(0, edge), (0, 0))
        ends.paste(strip(im.width - edge, im.width), (1, 0))
        wall = ends.resize(im.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(60))
        b = box(*im.size)
        fore = im.crop(b).resize((W, H), Image.LANCZOS)
        back = wall.crop(b).resize((W, H), Image.BILINEAR)
        # the model: where the close-up differs from the plain wall behind it
        diff = ImageChops.difference(fore, back).convert('L')
        sil = diff.point(lambda v: 255 if v > 26 else 0)
        sil = sil.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(11)).filter(ImageFilter.GaussianBlur(18))
        full = sil
        full = full.resize((W // 2, H // 2), Image.BILINEAR)
        out = Image.new('RGBA', full.size, (0, 0, 0, 0))
        out.putalpha(full.point(lambda v: 255 - v))   # the effects show where the model isn't
        out.save(os.path.join(ROOT, 'scenes', 'dio-%s-mask.png' % stem), optimize=True)
        cover = sum(full.histogram()[128:]) * 100 // (full.width * full.height)
        print('%-14s model covers %d%% of the screen' % (stem, cover))


if __name__ == '__main__':
    main()
