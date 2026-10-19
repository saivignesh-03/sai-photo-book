# Sai’s Photo Book — design blueprint

## Creative direction

A personal photo journal with the warmth of a paper scrapbook and the space of an editorial portfolio. Large serif headlines, quiet sans-serif labels, generous margins, simple photo frames, and occasional colourful details keep the photographs at the centre.

The wording introduces Sai only as a student and mobile photographer. The galleries contain only Sai’s own folder photographs.

## File architecture

```text
sai_PhotoBook/
├── index.html
├── assets/
│   ├── css/               style.css, theme.css, animations.css
│   └── js/                script.js, animations.js
├── photos/               nature/, landscapes/, life/, recent/
├── docs/
│   └── DESIGN_BLUEPRINT.md
├── build_gallery.py      Folder discovery and HEIC previews
├── serve.py              Local preview server
├── photos.js             Generated browser catalog
├── catalog.json          Generated live-update catalog
├── requirements.txt      HEIC conversion dependencies
├── Start Photo Book.command
├── Refresh Galleries.command
├── tests/
├── README.md
├── .vscode/              Interpreter and run tasks
├── .photobook-cache/     Generated JPG previews (hidden in VS Code)
└── saiphotobook.env/      Python environment (hidden in VS Code)
```

CSS loads in order: base → theme → animation. JavaScript loads in order: photos → application → animation. All scripts use `defer` and ordinary relative paths, allowing direct opening from Finder without a server.

## Colour palette

Edit the variables at the top of `assets/css/theme.css`. They override the base defaults.

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#fcf5e9` | Warm cream page background |
| `--ink` | `#233e35` | Forest green text, active buttons, closing panel |
| `--muted` | `#647066` | Secondary text |
| `--line` | `#d8d9c7` | Subtle dividers |
| `--accent`, `--clay` | `#b8462b` | Terracotta headlines and little details |
| `--saffron` | `#efbf55` | Sun, ribbon, call-to-action buttons |
| `--peach` | `#f4d3bd` | Life category and gallery introduction |
| `--lavender` | `#e7e1f2` | About section |
| `--sage` | `#e4edda` | Nature category and latest photographs |
| `--sky` | `#dce9ed` | Landscapes category |
| `--nature` | `#3a6550` | Nature labels |
| `--landscapes` | `#365f78` | Landscapes labels |
| `--life` | `#934b39` | Life labels |

Use light tones for broad surfaces, dark ink for readable text, and saffron/clay for occasional emphasis. Check text contrast if changing the palette.

## Typography and spacing

- Display type: Georgia, falling back to Times New Roman and the system serif. Italics soften selected words.
- Body and labels: Arial, Helvetica, then system sans-serif.
- No remote font installation or subscription is required.
- Main headings scale fluidly with `clamp()`.
- Desktop page margins are about 5–6%; section spacing is about 75–110px.
- Mobile reduces section space to around 65px and keeps small-screen headlines readable.
- Fine uppercase labels establish hierarchy; story text remains regular sentence case.

## Page sequence

| Section | Purpose | Visual treatment |
| --- | --- | --- |
| Header | Brand, collection links, motion control | Cream with a fine divider |
| Hero | Welcome and immediate photography hook | Oversized clay/green headline, sun/orbits, landscape photograph |
| Colour ribbon | Connect the three subjects | Saffron strip with floral marks |
| The way I see it | Explain the personal approach | Centred statement and handwritten-style note |
| A few ways to wander | Let visitors explore | Coloured category pills and sample photo previews |
| Lately, through my lens | Highlight recent selections | Sage panel and six photographs |
| Hey, I’m Sai | Introduce the photographer | Lavender surface with a floral mark and small stamp |
| Keep looking closer | Close the experience | Forest green surface and saffron italic text |
| Footer | Brand, year, back to top | Compact cream row |

## Motion specification

| Effect | Location | Controls |
| --- | --- | --- |
| Headline entrance | Hero | `title-enter`, 1000ms, in `assets/css/animations.css` |
| Photo-frame reveal | Hero | `frame-enter`, 1100ms |
| Sun drift | Hero decoration | `sun-drift`, 9 seconds × 2, then stops |
| Floral turn | Hero decoration | `star-turn`, 12 seconds × 2, then stops |
| Section reveals | Intro and section headings | IntersectionObserver, threshold 0.08 |
| Photo stagger | Preview, latest, full galleries | `cardStagger: 55`; small groups avoid long waits |
| Gentle image zoom | Photo hover | 800ms transform; no layout shift |
| Slow parallax | Desktop hero | Maximum ±18px; disabled for mobile and coarse pointers |
| Loading sheen | Photo placeholders | Two short passes while an image loads |
| Viewer entrance | Photo dialog | 350ms panel and 300ms backdrop |
| Photo change | Viewer arrows | `photoFade: 320`, Web Animations API |
| Scroll progress | Top edge | Updated through requestAnimationFrame |
| Arrow movement | See more and hero | Short hover transitions |

Change the `SETTINGS` object near the top of `assets/js/animations.js` for reveal thresholds, stagger delay, image fade duration, and parallax distance. Change `--motion-fast`, `--motion-normal`, and `--motion-slow` in `assets/css/animations.css` for common timings. Individual decorative loops have explicit durations in that file.

Animation serves browsing: filters respond immediately, stories remain readable, navigation does not wait for page-exit effects, and there is no loading screen that blocks the site.

## Accessibility and motion preferences

- Native buttons, links, headings, and a labelled native dialog.
- A skip link and visible keyboard focus styles.
- Category buttons expose their selected state; gallery links identify the current page.
- Photo descriptions use each entry’s `alt` text.
- Previous/next arrows work from the keyboard. Escape closes the viewer; focus returns to the photograph that opened it.
- Decorative shapes are hidden from assistive technology.
- Content is visible without the animation script. Reveals are an enhancement.
- The header Pause motion control stores a preference locally when storage is available; the site also works if storage is blocked.
- System Reduce Motion disables decorative motion and smooth scrolling; no manual setting can override it.
- Photo transition animations pause when the document is hidden.

## Responsive layout

| Viewport | Behaviour |
| --- | --- |
| Wider than 1000px | Large hero, three-column galleries, two-column About and photo viewer |
| 701–1000px | Smaller spacing, still three-column photographs |
| 700px or less | Compact header, two-column photos, stacked About and viewer, no parallax |
| 370px or less | Tighter pills, captions, and hero dimensions |

Do not reduce photo buttons so far that they become hard to select. Preserve the full image in the story viewer with `object-fit: contain`; gallery thumbnails intentionally crop with `object-fit: cover`.

## Editing content safely

- Change headings and section wording in `index.html`.
- Drop images into the photo folders. Add descriptions in matching JSON sidecars. `photos.js` is generated; do not edit it.
- Folder photos are automatically marked as real work. The recent folder independently controls Lately when it contains photos.
- The folder determines the collection. A recent-folder sidecar may optionally label its category.
- Use a local path such as `photos/nature/after-rain.jpg` for offline photographs.
- Newer files appear first, based on modification time. This does not claim to be their capture time.
- The hero uses the first personal Landscapes photo, then the first available personal photo as a fallback.
- The hero’s overlay phrase is editorial text in `index.html`; adjust it to match a replacement image.
- Titles and stories are inserted as text, never interpreted as HTML.
- A missing image displays a connection/path message while the story remains accessible.

## Folder workflow and current limits

The custom `serve.py` server rebuilds the catalog from `photos/nature`, `photos/landscapes`, `photos/life`, and `photos/recent`. The frontend checks the catalog every five seconds. The catalog contains only personal folder photos. The recent folder independently feeds Lately when populated; otherwise new collection photos feed it.

HEIC/HEIF images are decoded with Pillow and pillow-heif into cached JPG previews; originals are preserved. The packages are installed in `saiphotobook.env` and recorded in `requirements.txt`. Stories and camera details come from optional JSON sidecars.

Directly opening `index.html` displays the last generated catalog; use the Refresh Galleries launcher after adding pictures in that mode. The generic Python static server does not rebuild catalogs; use the Start Photo Book task or `python serve.py` for automatic discovery.

Browser uploads, contact delivery, and capture-time metadata extraction remain future work. Personal images and cached previews are served locally. Nothing is published automatically.
