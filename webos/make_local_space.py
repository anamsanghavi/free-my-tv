"""Local addition: your own downloaded space photos, built into the app for the screensaver (they work offline).

    python3 webos/make_local_space.py <folder> [first] [last]

Each wide-enough photo becomes a 1920 x 1080 file in web/ (sp-<n>.jpg), named in scenes/spacelocal.js from its file name.
Skipped: spectra, charts, annotated or side-by-side versions, tall portraits, and anything under about full HD.
"""
import json
import os
import re
import sys

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
W, H = 1920, 1080
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = re.compile(r'spectr|annotat|compass|label|graphic|illustrat|artist|side-by-side|location-of|close-up|closeup|zoom|'
                  r'pull-?out|inset|chart|diagram|light-?curve|timeline|detailed-information|transients|crop|scale', re.I)


def title(name):
    t = re.sub(r'_\d+_o$', '', os.path.splitext(name)[0]).replace('--', ' + ').replace('-', ' ')
    t = re.sub(r'\b(nircam|miri|nirspec|niriss)\b', lambda m: {'nircam': 'NIRCam', 'miri': 'MIRI', 'nirspec': 'NIRSpec', 'niriss': 'NIRISS'}[m.group(1)], t)
    t = re.sub(r'\b(ngc|ic|arp|macs|spt|m)\s?(\d)', lambda m: m.group(1).upper() + ' ' + m.group(2), t)
    t = re.sub(r'\bnasas\b', 'NASA’s', t).replace('nasa', 'NASA')
    return (t[:1].upper() + t[1:])[:80]


def main():
    os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)   # the scene pack (git-ignored; see scenes/README)
    src = os.path.expanduser(sys.argv[1])
    names = sorted(n for n in os.listdir(src) if n.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff')))
    first, last = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (0, len(names))
    listing = os.path.join(ROOT, 'webos', 'spacelocal.json')
    done = json.load(open(listing)) if os.path.exists(listing) else {}
    prefix = os.environ.get('SP_PREFIX', '')
    label = os.environ.get('SP_LABEL', 'NASA/Webb')
    seen = set(v['t'] if isinstance(v, dict) else v for v in done.values())
    for i in range(first, min(last, len(names))):
        name = names[i]
        if SKIP.search(name):
            print('skip (name)  ', name[:70]); continue
        try:
            im = Image.open(os.path.join(src, name))
            w, h = im.size
            if w < 1600 or h < 900 or h > w * 1.2:
                print('skip (shape) ', name[:70], im.size); continue
            if im.format == 'JPEG':
                im.draft('RGB', (W * 2, H * 2))
            im = ImageOps.fit(im.convert('RGB'), (W, H), Image.LANCZOS)
        except Exception as e:
            print('skip (error) ', name[:70], str(e)[:40]); continue
        if title(name) in seen:
            print('skip (same)  ', name[:70]); continue
        seen.add(title(name))
        out = 'sp%s-%03d.jpg' % (prefix, i)
        im.save(os.path.join(ROOT, 'scenes', out), 'JPEG', quality=82, optimize=True)
        done[out] = {'t': title(name), 'l': label}
        print('ok           ', out, done[out]['t'])
    json.dump(done, open(listing, 'w'), ensure_ascii=False, indent=0)
    with open(os.path.join(ROOT, 'scenes', 'spacelocal.js'), 'w', encoding='utf-8') as f:
        f.write('window.SPACE_LOCAL = %s;\n' % json.dumps([{'t': done[k]['t'] if isinstance(done[k], dict) else done[k], 'l': done[k]['l'] if isinstance(done[k], dict) else 'NASA/Webb', 'src': k} for k in sorted(done)], ensure_ascii=False))
    print(len(done), 'photos so far')


if __name__ == '__main__':
    main()
