# The scene pack

This folder holds the pictures the app is built with. It isn't in git (too big); `python3 webos/get_scenes.py` fills
it from this fork's GitHub releases, and `python3 webos/build.py` puts everything here into the app.

What's in it:

| Files | What they are | Made by |
|---|---|---|
| `dio-<scene>.jpg` | each weather scene's picture, full-screen close-up | `webos/make_dioramas.py` |
| `dio-<scene>-mask.png` | where the weather effects may draw | `webos/make_dio_masks.py` |
| `dio-<scene>.mp4` | the moving version (a cinemagraph) | `webos/make_dio_video.py` |
| `dio-<scene>-lights-<n>.png` | night windows switching off late at night | `webos/make_dio_lights.py` |
| `sound-<scene>.ogg` | the scene's quiet ambient sound | `webos/make_dio_sound.py` |
| `dioramas.js` | the list of scenes | `webos/make_dioramas.py` |
| `sp-*.webp`, `spacelocal.js` | the screensaver's built-in space photos | `webos/make_local_space.py`, `webos/slim_space.py` |

## Your own city

1. Generate a picture for each weather scene (same camera, same model city, 16:9, about 2752 x 1536), named after
   the scene: `clear-day.jpg`, `clear-night.jpg`, `overcast.jpg`, `rain.jpg`, `snow.jpg`, `fog.jpg`, `dusk.jpg` ...
   (`dioName()` in `web/custom.js` lists every name the app knows; a scene you skip shows `clear-day` or `clear-night` instead).
   Optional: a short video for any of them, named the same (`overcast.mp4`).
2. Put them in one folder and run `sh webos/update_dioramas.sh <that folder>`: it makes everything above and builds.
3. To share your city, zip this folder's files and attach the zip to a GitHub release;
   `python3 webos/get_scenes.py <its URL>` fetches it.
