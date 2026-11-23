"""Local addition: prepares your own photos for Free My TV's screensaver and wallpaper, on your Mac only.

    python my_photos.py <folder> [how many]

Picks a random set from the folder (and its subfolders), turns each upright, sizes it for the TV (1920 x 1080) and
saves it without its location and other tags in ~/Pictures/FreeMyTV-screensaver. Most fill the screen; portraits
and panoramas that would lose more than 30% show whole on black. Replaces the photos from the last run.
"""
import os
import random
import sys

from PIL import Image, ImageOps
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

W, H = 1920, 1080
OUT = os.path.expanduser('~/Pictures/FreeMyTV-screensaver')
EXT = ('.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp')


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = os.path.expanduser(sys.argv[1])
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 200
    files = [os.path.join(d, f) for d, _, names in os.walk(src) for f in names
             if f.lower().endswith(EXT) and not f.startswith('._')]
    if not files:
        sys.exit('No photos found in %s' % src)
    random.shuffle(files)
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith('.jpg'):
            os.remove(os.path.join(OUT, f))
    done = 0
    for path in files:
        if done >= count:
            break
        try:
            im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
        except Exception:
            print('\nSkipped %s (could not open it)' % os.path.basename(path))
            continue
        w, h = im.size
        scale = max(W / float(w), H / float(h))
        kept = min(W / (w * scale), H / (h * scale))
        if kept >= 0.7:
            im = ImageOps.fit(im, (W, H), Image.LANCZOS)
        else:
            im.thumbnail((W, H), Image.LANCZOS)
            canvas = Image.new('RGB', (W, H))
            canvas.paste(im, ((W - im.width) // 2, (H - im.height) // 2))
            im = canvas
        done += 1
        im.save(os.path.join(OUT, '%04d.jpg' % done), 'JPEG', quality=78, optimize=True)
        sys.stdout.write('\rPrepared %d of %d' % (done, min(count, len(files))))
        sys.stdout.flush()
    print('\nReady: %d photos in %s' % (done, OUT))


if __name__ == '__main__':
    main()
