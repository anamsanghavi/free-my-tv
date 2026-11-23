"""Fetches the scene pack into scenes/: the weather dioramas (pictures, videos, night lights, sounds) and the
screensaver's space photos. They're too big for git, so they live on this fork's GitHub releases as one zip.

    python3 webos/get_scenes.py            # the pack this version of the app was made with
    python3 webos/get_scenes.py <url>      # another pack (a zip with the same files, e.g. your own city's)

Then python3 webos/build.py builds with it. To make your own pack, see scenes/README.md.
"""
import io
import os
import shutil
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = 'https://github.com/anamsanghavi/free-my-tv/releases/download/scenes-1/scenes-1.zip'


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else PACK
    print('Downloading the scene pack (about 60 MB) from', url)
    with urllib.request.urlopen(url, timeout=120) as r:
        data = r.read()
    z = zipfile.ZipFile(io.BytesIO(data))
    names = [n for n in z.namelist() if not n.endswith('/') and '..' not in n and not n.startswith('/')]
    dest = os.path.join(ROOT, 'scenes')
    keep = os.path.join(dest, 'README.md')
    readme = open(keep, 'rb').read() if os.path.exists(keep) else None
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    os.makedirs(dest)
    for n in names:
        with open(os.path.join(dest, os.path.basename(n)), 'wb') as f:
            f.write(z.read(n))
    if readme:
        with open(keep, 'wb') as f:
            f.write(readme)
    print('%d files in scenes/. Now: python3 webos/build.py' % len(names))


if __name__ == '__main__':
    main()
