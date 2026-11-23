"""Local addition: the screensaver's space photos, from gallery pages saved on this Mac (webb/*.html, spitzer/list.html).

    python3 webos/make_space.py

Writes web/spacelist.js: each photo's name and address, for ESA's Webb gallery (esawebb.org, credit ESA/Webb, NASA & CSA)
and NASA's Spitzer gallery (spitzer.caltech.edu, credit NASA/JPL-Caltech). Real observations only: nothing annotated,
labelled, charted or drawn, and nothing tall and narrow. The TV loads the pictures itself.
"""
import glob
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = re.compile(r'annotat|compass|label|spectr|graphic|illustrat|artist|infograph|compar|side.by.side|slider|pull.?out|'
                  r'diagram|light ?curve|transmission|chart|video|montage|collage|scale|crop|zoom|detail|inset|timeline|'
                  r'views\b|images\b|outgassing|stacked|multi-|FRB|red dot|logo|mirror|instrument|telescope alignment|selfie|team|launch|ariane|sunshield|engineer', re.I)


def read(path):
    with open(path, encoding='utf-8', errors='replace') as f:
        return f.read()


def webb():
    out, seen = [], set()
    for path in sorted(glob.glob(os.path.join(ROOT, 'webb', '*-*.html'))):
        for m in re.finditer(r"id: '([^']+)',\s*title: '((?:[^'\\]|\\.)*)',\s*width: (\d+),\s*height: (\d+)", read(path)):
            pid, title, w, h = m.group(1), html.unescape(m.group(2).replace("\\'", "'")), int(m.group(3)), int(m.group(4))
            if pid in seen or SKIP.search(title) or w < 1920 or h < 1200 or h > w * 1.15:
                continue
            seen.add(pid)
            title = re.sub(r'\s*\((NIRCam|MIRI|NIRSpec|NIRISS)[^)]*\)\s*$', '', title).strip()
            # ESA's 1920 x 1200 version: sharp on the TV, and a light file
            out.append({'t': title, 'l': 'ESA/Webb', 's': ['https://cdn.esawebb.org/archives/images/wallpaper5/%s.jpg' % pid]})
    return out


def spitzer():
    out = []
    path = os.path.join(ROOT, 'spitzer', 'list.html')
    if not os.path.exists(path):
        return out
    for block in read(path).split("<div class='element-item ")[1:]:
        classes = block.split("'", 1)[0]
        if 'navigator_param_observation' not in classes or not re.search(r'param_(galaxy|nebula|star)\b', classes):
            continue
        n = re.search(r'/download/AvmImage/(\d+)/binary/', block)
        strong = re.search(r'<strong>\s*(.*?)\s*</strong>', block, re.S)
        h1 = re.search(r'<h1>\s*(.*?)\s*</h1>', block, re.S)
        title = html.unescape(re.sub(r'<[^>]+>', '', (strong or h1).group(1))).strip() if (strong or h1) else ''
        if not n or not title or SKIP.search(title):
            continue
        # its 1600-pixel version; the TV keeps it only if it turns out wide enough
        out.append({'t': title, 'l': 'NASA/Spitzer', 's': ['https://www.spitzer.caltech.edu/download/AvmImage/%s/binary/huge' % n.group(1)]})
    return out


def main():
    a, b = webb(), spitzer()
    with open(os.path.join(ROOT, 'web', 'spacelist.js'), 'w', encoding='utf-8') as f:
        f.write('window.SPACE_LIST = %s;\n' % json.dumps(a + b, ensure_ascii=False))
    print('Webb: %d photos, Spitzer: %d photos' % (len(a), len(b)))
    for x in (a[:6] + b[:4]):
        print('  ', x['l'], '|', x['t'])


if __name__ == '__main__':
    main()
