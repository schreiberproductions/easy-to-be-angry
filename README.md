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

assets/css/site.css      All shared styling, @font-face declarations included
assets/fonts/            DM Sans (variable) + Caveat (variable)
assets/js/site.js        Nav, scroll reveal, carousel, charts, tabs, accordion
assets/img/              Section artwork and favicons

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

**Internal links are relative**, so the site works both at the root of a
domain and from a subpath such as `user.github.io/repo/`. Pages one level down
reach shared assets with `../`. If you add a page at a new depth, its paths
have to match that depth.

`404.html` is the exception: its links are root-absolute, because GitHub Pages
serves it for any missing path and a relative link would resolve against
whatever that path happened to be. It is therefore only styled correctly once
the site is at a domain root.

**Assets are cache-busted by hand.** `site.css?v=NN` and `site.js?v=NN` appear
in all five HTML files. When you change one of those two files, bump its number
in all five, or you will be looking at a stale copy. The two numbers count
independently — they are not meant to match.

The `@font-face` rules are kept inside `site.css` on purpose. An `@import`
cannot begin downloading until the importing stylesheet has arrived and been
parsed, which left the font files two round trips behind the HTML.

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

Two steps, in this order:

1. Copy `deploy/CNAME` (kept outside this repository) into the repository root
   and push it. It holds `anger.kayleenschreiber.com`. It is deliberately not
   committed yet: with a CNAME present, Pages redirects the `github.io` URL to
   the custom domain, which would break the preview before DNS exists.
2. Point the `anger` CNAME at GitHub Pages in Squarespace's DNS — it currently
   points at `domain.vev.page`.
