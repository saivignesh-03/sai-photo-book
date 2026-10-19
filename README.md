# Sai’s Photo Book

## Start your website

Use **Terminal → Run Task → Start Photo Book** in VS Code, or double-click **Start Photo Book.command**.

From the VS Code terminal you can also run:

```sh
source saiphotobook.env/bin/activate
python serve.py
```

Open the local URL printed by the server, normally http://127.0.0.1:8000/. If that port is busy, the launcher selects another free port and prints its URL. Keep the server running; Control+C stops it.

Use `serve.py` for automatic folder updates. Python’s generic `python -m http.server` only serves existing files and does not scan your photo folders.

## Add photos — no photo-list editing needed

Drop your photographs into:

- `photos/nature/`
- `photos/landscapes/`
- `photos/life/`
- `photos/recent/` for the dedicated “Lately, through my lens” selection

The open website checks for changes every five seconds while active. New collection photos also appear in Lately when the recent folder is empty. Once you add photos to `recent`, that folder becomes the independent source for Lately. Adding there does not change collection counts.

Only your folder photos appear. Newer files appear first, based on file modification time; this is not described as the time the picture was taken. The first personal Landscapes photo is used in the hero.

JPG, JPEG, PNG, WebP, AVIF, GIF, HEIC, and HEIF are recognised. HEIC and HEIF originals stay untouched; Pillow and pillow-heif generate JPG previews under `.photobook-cache/previews/`. The installed dependencies are listed in `requirements.txt`. The Mac launcher installs them if a recreated environment needs them.

## Add a title, story, and camera

Details are optional. Put a JSON file beside the photo with the same base filename. For `my-view.heic`, add `my-view.json`:

```json
{
  "title": "My view of the city",
  "story": "What made me stop and take this picture.",
  "camera": "Your phone model",
  "alt": "A city skyline beside the water",
  "recent": true
}
```

For a photo in `recent/`, you may add `"category": "landscapes"`, `"nature"`, or `"life"` as a label. It still belongs only to the recent-folder selection. Invalid details are ignored with a note in the server window; the picture can still appear.

## Direct-file preview and manual refresh

The generated `photos.js` also supports opening `index.html` directly. To include folder changes in that mode, run **Refresh Galleries.command** and reload the page. For automatic updates, use the custom server.

Do not edit generated `photos.js` or `catalog.json`; the next refresh replaces them. Edit photo JSON sidecars instead.

## Design files

- `index.html` — page sections and wording
- `assets/css/style.css` — base layout and mobile rules
- `assets/css/theme.css` — colour palette and decoration
- `assets/css/animations.css` and `assets/js/animations.js` — animation appearance and behaviour
- `assets/js/script.js` — filters, viewer, and automatic catalog refresh
- `docs/DESIGN_BLUEPRINT.md` — full visual specification
- `build_gallery.py` — photo discovery and HEIC conversion
- `serve.py` — local server with catalog refresh
- `.vscode/tasks.json` — start and refresh tasks

## Environment

Project: `/Users/saivigneshchintala/projects/sai_PhotoBook`

Virtual environment: `saiphotobook.env`

To recreate it after moving the project, rename the old environment folder, run `python3 -m venv --prompt saiphotobook.env saiphotobook.env`, then `saiphotobook.env/bin/python -m pip install -r requirements.txt`.

Run checks with `saiphotobook.env/bin/python -m unittest discover -s tests -v`.

This project remains local. Contact delivery and capture-time IDs are future work. A normal website cannot guarantee that visitors cannot save or screenshot visible images.

## Folder organisation

Styling is in `assets/css/`, browser behaviour in `assets/js/`, and the design blueprint in `docs/`. Keep your original photographs in `photos/`. The virtual environment and generated catalogs/previews are hidden in VS Code’s Explorer to keep the project tidy; they remain on disk and are still used by the site.
