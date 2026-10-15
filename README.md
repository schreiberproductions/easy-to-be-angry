# Easy to Be Angry

Hand-built static site for `anger.kayleenschreiber.com`, replacing a Vev build
of the same content. Four pages, no framework, no build step — what is in the
repository is what gets served.

By Kourtney Kovanis and Kayleen Schreiber.

## Structure

```
index.html               Learn
reflect/index.html       Reflect
try/index.html           Try
resources/index.html     Explore more (resources)
404.html                 Not-found page, built from the same shell

assets/css/site.css      All shared styling
assets/css/fonts.css     Self-hosted @font-face declarations
assets/fonts/            DM Sans (variable) + Caveat (variable)
assets/js/site.js        Nav, scroll reveal, carousel, charts, tabs, accordion
assets/img/              Section artwork and favicons

CNAME                    The custom domain. Pages will not answer without it.
.nojekyll                Serve the files as they are; don't run Jekyll.
```

## Local preview

```
python3 ../devserver.py 8777 .
```

Then open <http://localhost:8777/>. The server sends no-cache headers so edits
show on reload, and it prints a second address you can open on a phone on the
same network.

## Things worth knowing before changing anything

**All internal links are absolute** (`/assets/…`, `/reflect/`). The site
therefore only works when served from the root of a domain — it will break if
served from a subpath such as `user.github.io/repo/`.

**Assets are cache-busted by hand.** `site.css?v=NN` and `site.js?v=NN` appear
in all five HTML files. Bump every one of them together or you will be looking
at a stale stylesheet.

**Nothing depends on JavaScript to be readable.** `site.js` only ever *adds*
behaviour: the scroll reveal, the tab strips, the accordions. With it disabled
every page still shows all of its content. The reveal uses a scroll-position
sweep rather than IntersectionObserver so a section jumped to via an anchor
can never be left stranded at opacity 0.

**Section anchor IDs from the Vev site are preserved** (e.g.
`/try/#eueGSrS8UWR`) so existing deep links and bookmarks keep working.

**Two charts are drawn from real data, in SVG, not embedded.** The trigger
bubbles on Learn and the time-of-day columns on Reflect were Flourish embeds;
both are now inline SVG with their own tooltips. If either is ever regenerated,
note that `.bub__label--out` styles labels too long to sit inside their circle.

**Two third-party embeds remain** and are outside our control: the cartoon on
Try (Instagram) and the dopamine talk (YouTube). Both will break if the source
is taken down.

## Content

Text, quotations and scripture references were migrated from the Vev site and
checked against a full archive of it, sentence by sentence. The archive lives
outside this repository.

The New Yorker cartoon is embedded from the artist's own Instagram post rather
than copied, so it stays attributed and under her control.

## Deploying

GitHub Pages, served from the repository root, so `/reflect/index.html`
resolves at `/reflect/` and the URLs match the original site.

To move the live domain over, point the `anger` CNAME at GitHub Pages in
Squarespace's DNS — it currently points at `domain.vev.page`.
