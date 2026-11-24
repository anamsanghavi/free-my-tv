#!/usr/bin/env python3
"""Writes web/vendor/indianstations.js from a JSON list of [name, url, language, genre] rows.

The rows come from onlineradiofm.in's station pages (each page's `var FILE` stream address,
its title, Language and Genre), collected in a browser since the site needs one. Only
streams the site itself plays publicly; most are relays others run, so any can go quiet.

    python3 tools/indian_stations.py rows.json
"""
import json
import os
import sys

OUT = os.path.join(os.path.dirname(__file__), '..', 'web', 'vendor', 'indianstations.js')


def main(path):
    rows = json.load(open(path, encoding='utf-8'))
    seen, keep = set(), []
    for r in rows:
        name, url = (r[0] or '').strip(), (r[1] or '').strip()
        if not name or not url.startswith(('http://', 'https://')) or url in seen:
            continue
        seen.add(url)
        keep.append([name, url, (r[2] or '').strip(), (r[3] or '').strip()])
    keep.sort(key=lambda r: r[0].lower())
    body = json.dumps(keep, ensure_ascii=False, separators=(',', ':'))
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// onlineradiofm.in\'s Indian stations: [name, stream, language, genre]. '
                'Made by tools/indian_stations.py.\nwindow.INDIAN_STATIONS = ' + body + ';\n')
    print('Wrote %d stations to %s' % (len(keep), os.path.normpath(OUT)))


if __name__ == '__main__':
    main(sys.argv[1])
