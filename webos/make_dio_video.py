"""Local addition: moving dioramas. For each <name>.mp4 next to the still dioramas, makes scenes/dio-<name>.mp4: the clip
cut to the same full-screen close-up as the still (dio_frame.py), with its last second cross-faded into its first so it
loops without a jump. 1920 x 1080, H.264, no sound.

With OpenCV, it's a cinemagraph: only what really moves in the clip (clouds, water, traffic, rain, lightning) comes
from the video; everything that stays put (buildings, trees, streets) is the sharp still. A 720p AI clip enlarged to
full screen is soft and shimmers ("boils"); this keeps the clip's motion and the still's detail, and the still's parts
cost almost nothing to encode.

    python3 webos/make_dio_video.py <folder with the dioramas>
"""
import json
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageFilter

from dio_frame import W, H, box

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


try:
    import cv2
    import numpy as np
except ImportError:   # without OpenCV, the plain clip (cropped and enlarged) as before
    cv2 = None

MOVE_FROM, MOVE_TO = 4.5, 8.0   # how much a spot must change over the clip (0-255 brightness, std) to come from the video


def cinemagraph(clip, crop, still_path, out):
    """Writes the still with the clip's moving parts over it (1920 x 1080, near-lossless) to out. False if it can't."""
    if cv2 is None or not os.path.exists(still_path):
        return False
    x0, y0, x1, y1 = crop
    still = cv2.imread(still_path).astype(np.float32)
    cap = cv2.VideoCapture(clip)
    small = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        small.append(cv2.resize(f[y0:y1, x0:x1], (480, 270), interpolation=cv2.INTER_AREA).astype(np.float32))
    if not small:
        return False
    S = np.stack(small)
    motion = S.mean(-1).std(0)
    ss = cv2.resize(still, (480, 270), interpolation=cv2.INTER_AREA)
    static = motion < MOVE_FROM
    if static.mean() < 0.05:
        static = motion <= np.percentile(motion, 20)
    mean_clip = S.mean(0)
    gain, off = [], []
    for c in range(3):   # the clip's colours matched to the still's where nothing moves, so the seams don't show
        a, b = mean_clip[..., c][static], ss[..., c][static]
        g = float(np.clip(b.std() / max(a.std(), 1e-3), 0.8, 1.25))
        gain.append(g)
        off.append(float(b.mean() - g * a.mean()))
    m = np.clip((motion - MOVE_FROM) / (MOVE_TO - MOVE_FROM), 0, 1).astype(np.float32)
    m = cv2.dilate(m, np.ones((7, 7), np.uint8))   # room for a car or a cloud edge to travel
    m = cv2.GaussianBlur(m, (0, 0), 3)
    M = cv2.resize(m, (W, H), interpolation=cv2.INTER_CUBIC).clip(0, 1)[..., None]
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '%dx%d' % (W, H), '-r', '24',
                          '-i', '-', '-c:v', 'libx264', '-crf', '10', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    cap = cv2.VideoCapture(clip)
    base = still * (1 - M)
    while True:
        ok, f = cap.read()
        if not ok:
            break
        f = cv2.resize(f[y0:y1, x0:x1], (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
        for c in range(3):
            f[..., c] = f[..., c] * gain[c] + off[c]
        p.stdin.write((base + f * M).clip(0, 255).astype(np.uint8).tobytes())
    p.stdin.close()
    p.wait()
    print('   %-12s moving: %d%% of the picture from the video, the rest the still' % ('', round(100 * float((M > 0.5).mean()))))
    return p.returncode == 0


ALIGN = {}
if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dio_align.json')):
    ALIGN = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dio_align.json')))


def main():
    os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)   # the scene pack (git-ignored; see scenes/README)
    src = os.path.expanduser(sys.argv[1])
    tmp = tempfile.mkdtemp()
    listing_path = os.path.join(ROOT, 'scenes', 'dioramas.js')
    text = open(listing_path).read()
    listing = json.loads(text[text.index('{'):text.rindex('}') + 1])
    for name in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(name)
        stem = {'snow-day': 'snow', 'snowy-day': 'snow'}.get(stem, stem)   # clip names that differ from their image
        if ext.lower() not in ('.mp4', '.mov', '.webm', '.m4v') or stem not in listing:
            continue
        still = next((os.path.join(src, stem + e) for e in ('.jpg', '.jpeg', '.png') if os.path.exists(os.path.join(src, stem + e))), None)
        if not still:
            print('no still image for', name); continue
        cw, ch = [int(v) for v in subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries',
            'stream=width,height', '-of', 'csv=p=0', os.path.join(src, name)]).decode().strip().split(',')[:2]]
        x0, y0, x1, y1 = ALIGN.get(os.path.splitext(name)[0]) or box(cw, ch)   # align_dio_clips.py: lined up with the still
        dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                             os.path.join(src, name)]).decode().strip())
        fade = 1.0
        body = dur - fade
        # the cinemagraph (the still where nothing moves), or the plain clip cut to the same close-up
        crop = (x0, y0, x1, y1)
        cg = os.path.join(tmp, stem + '-cg.mp4')
        if cinemagraph(os.path.join(src, name), crop, os.path.join(ROOT, 'scenes', 'dio-%s.jpg' % stem), cg):
            source, fit = cg, 'fps=24'
        else:
            source, fit = os.path.join(src, name), 'fps=24,crop=%d:%d:%d:%d,scale=%d:%d:flags=lanczos' % (x1 - x0, y1 - y0, x0, y0, W, H)
        # the last second cross-faded into the first, so it loops without a jump
        graph = ('[0:v]' + fit + ',format=yuv420p,split[a][b];'
                 '[a]trim=%.3f:%.3f,setpts=PTS-STARTPTS[a1];[b]trim=0:%.3f,setpts=PTS-STARTPTS[b1];'
                 '[a1][b1]xfade=transition=fade:duration=%.3f:offset=%.3f,format=yuv420p[out]') % (
            fade, dur, fade, fade, body - fade)
        out = os.path.join(ROOT, 'scenes', 'dio-%s.mp4' % stem)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', source,
                               '-filter_complex', graph, '-map', '[out]', '-t', '%.3f' % body,
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-profile:v', 'high', '-level', '4.1',
                               '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', out])
        listing[stem]['video'] = True
        print('%-14s %.1f s loop, %d KB' % (stem, body, os.path.getsize(out) // 1024))
    with open(listing_path, 'w') as f:
        f.write('window.DIORAMAS = %s;\n' % json.dumps(listing, sort_keys=True))


if __name__ == '__main__':
    main()
