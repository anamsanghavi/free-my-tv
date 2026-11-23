"""Local addition: the screensaver's built-in space photos, slimmed. Keeps the photos listed in webos/space_keep.json
(60, picked for sharpness, colour and variety, then by hand), as WebP (quality 80, about 200 KB each instead of 300 KB
as JPEG), and moves the rest, and the JPEG originals, to out/space-photos-removed/. Rewrites
scenes/spacelocal.js to match. Run again after make_local_space.py adds photos (add the new names to the keep list first).

    python3 webos/slim_space.py
"""
import json
import os
import shutil

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'scenes')
AWAY = os.path.join(ROOT, 'out', 'space-photos-removed')   # out/ is git-ignored: delete it when you're happy


def main():
    os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)   # the scene pack (git-ignored; see scenes/README)
    keep = set(json.load(open(os.path.join(ROOT, 'webos', 'space_keep.json'))))
    path = os.path.join(WEB, 'spacelocal.js')
    text = open(path).read()
    items = json.loads(text[text.index('['):text.rindex(']') + 1])
    os.makedirs(AWAY, exist_ok=True)
    out, before, after = [], 0, 0
    for it in items:
        src = it['src']
        stem = os.path.splitext(src)[0]
        jpg = os.path.join(WEB, stem + '.jpg')
        webp = os.path.join(WEB, stem + '.webp')
        if stem + '.jpg' in keep:
            if os.path.exists(jpg):
                before += os.path.getsize(jpg)
                Image.open(jpg).convert('RGB').save(webp, 'WEBP', quality=80, method=6)
                shutil.move(jpg, os.path.join(AWAY, stem + '.jpg'))
            after += os.path.getsize(webp)
            it['src'] = stem + '.webp'
            out.append(it)
        elif os.path.exists(jpg):
            before += os.path.getsize(jpg)
            shutil.move(jpg, os.path.join(AWAY, stem + '.jpg'))
    with open(path, 'w') as f:
        f.write('window.SPACE_LOCAL = %s;\n' % json.dumps(out))
    print('%d photos kept as WebP: %.1f MB (the JPEGs they replace and the %d dropped: %.1f MB, moved to %s)' % (
        len(out), after / 1e6, len(items) - len(out), before / 1e6, AWAY))


if __name__ == '__main__':
    main()
