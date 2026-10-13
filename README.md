# Easy to Be Angry — static site

Hand-built HTML/CSS replacement for the Vev site at `anger.kayleenschreiber.com`,
rebuilt to be genuinely responsive. Deployed via GitHub Pages.

## Structure

```
resources/index.html     Resources page
assets/css/site.css      All shared styling (tokens, nav, sections, footer)
assets/css/fonts.css     Self-hosted @font-face declarations
assets/fonts/            DM Sans (variable) + Lato 700/900 — 68 KB total
assets/js/site.js        Mobile nav + scroll reveal (progressive enhancement)
assets/img/              Favicons
```

Pages still to build: `/` (Learn), `/reflect/`, `/try/`.

## Local preview

```
python3 -m http.server 8777
```

Then open <http://localhost:8777/resources/>.

## Design notes

Type sizes are fluid `clamp()` values tuned so each one lands on the original
Vev size at a 1200px viewport, then scales down sensibly rather than shrinking
linearly the way Vev's viewport scaling did.

The hero gradient is pure CSS. The original shipped it as a 1.5 MB JPEG.

Content is visible by default; `assets/js/site.js` only *adds* the fade-in
animation. If the JS fails, nothing disappears — this was the main bug in the
Vev version, where whole sections rendered blank on mobile. The reveal uses a
scroll position sweep rather than IntersectionObserver so that content jumped
past via an anchor link can never get stranded invisible.

Section anchor IDs from the Vev site are preserved in the nav dropdowns
(e.g. `/try/#eueGSrS8UWR`) so existing deep links and bookmarks keep working.

## Deploying

GitHub Pages serves this from the repository root. `/resources/index.html`
resolves at `/resources/`, so URLs match the original site exactly.

To move the live domain over, point the `anger` CNAME at GitHub Pages in
Squarespace's DNS settings — it currently points to `domain.vev.page`.
