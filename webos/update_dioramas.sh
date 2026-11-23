#!/bin/sh
# Local addition: after adding or changing pictures or clips in the dioramas folder, run this, then install as usual.
#   sh webos/update_dioramas.sh ~/Desktop/dioramas
# A picture named after a scene (christmas-night.jpg, aurora-winter.jpg, time-machine.jpg ...) is picked up by name.
set -e
DIR="${1:-$HOME/Desktop/dioramas}"
cd "$(dirname "$0")/.."
python3 webos/make_dioramas.py "$DIR"      # the stills: full-screen close-ups cut from the originals (dio_frame.py)
python3 webos/make_dio_masks.py "$DIR"     # where the weather effects may draw
# a clip whose camera drifts, or that brings back a painted moon:  python3 webos/stabilise_dio_clip.py "$DIR" <name>
python3 webos/align_dio_clips.py "$DIR" 2>/dev/null || echo "(clips not re-aligned: needs opencv-python; the last alignment is kept)"
python3 webos/make_dio_video.py "$DIR"     # the moving versions, from any clips, lined up with their stills
python3 webos/make_dio_sound.py "$DIR"     # and their sound, as seamless quiet loops
python3 webos/make_dio_lights.py           # night windows that go dark late at night
python3 webos/make_dioramas.py "$DIR"      # once more, now that it knows the clips and lights
python3 webos/build.py
