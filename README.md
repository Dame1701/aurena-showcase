# Aurena landing page

Static single-page site. To host on GitHub Pages:

1. Commit these files to your repo root (keep the structure intact):
   - `index.html`
   - `support.js`
   - `img/` (all screenshots + icon)
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Pick your branch and **/ (root)**, then save.
4. Live at `https://<you>.github.io/<repo>/` within a minute or two.

Notes
- `index.html` references the images in `img/` directly, so the page payload is small.
- React is loaded from a CDN (unpkg) at runtime, so the page needs an internet connection to render — fine for any normal hosted site.
- To swap a screenshot, replace the matching file in `img/` (keep the same filename).
