"""Local addition: ambient sound for the dioramas, from the sound Veo generated with each clip.
For each clip in the dioramas folder, scenes/sound-<name>.ogg: the clip's audio as a seamless loop (its end crossfaded into
its start, as the video is), mono, at one quiet loudness so no scene is louder than another.

    python3 webos/make_dio_sound.py <folder with the dioramas>
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALIAS = {'snow-day': 'snow', 'snowy-day': 'snow'}   # as in make_dio_video.py
FADE = 1.5          # seconds of crossfade at the loop point
LOUD = -30          # integrated loudness (LUFS): background, under conversation
LOUD_STORM = -26    # a storm may be a little louder


def duration(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])
    return float(out.strip())


def has_audio(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', path])
    return bool(out.strip())


def main():
    os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)   # the scene pack (git-ignored; see scenes/README)
    src = os.path.expanduser(sys.argv[1])
    for name in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in ('.mp4', '.mov', '.webm'):
            continue
        path = os.path.join(src, name)
        if not has_audio(path):
            print('%-22s no sound' % stem)
            continue
        stem = ALIAS.get(stem, stem)
        T = duration(path) - 0.05
        F = FADE
        loud = LOUD_STORM if 'storm' in stem else LOUD
        # head, middle, tail; the loop is (tail fading out over head fading in) + middle, so its end runs into its start
        graph = ('[0:a]aformat=channel_layouts=mono,aresample=32000,asplit=3[a][b][c];'
                 '[a]atrim=0:%.3f,asetpts=PTS-STARTPTS,afade=t=in:d=%.3f[head];'
                 '[b]atrim=%.3f:%.3f,asetpts=PTS-STARTPTS[mid];'
                 '[c]atrim=%.3f:%.3f,asetpts=PTS-STARTPTS,afade=t=out:d=%.3f[tail];'
                 '[tail][head]amix=inputs=2:normalize=0[join];'
                 '[join][mid]concat=n=2:v=0:a=1,loudnorm=I=%d:TP=-3:LRA=11[out]') % (F, F, F, T - F, T - F, T, F, loud)
        out = os.path.join(ROOT, 'scenes', 'sound-%s.ogg' % stem)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', path, '-filter_complex', graph, '-map', '[out]',
                               '-ar', '32000', '-ac', '1', '-c:a', 'libvorbis', '-q:a', '3', out])
        print('%-22s %.1f s loop, %d KB' % (stem, T - F, os.path.getsize(out) // 1024))


if __name__ == '__main__':
    sys.exit(main())
