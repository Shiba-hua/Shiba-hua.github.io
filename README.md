# Luo Wenjiang / Shiba-hua

Personal research homepage: https://shiba-hua.github.io/

- `index.html` — the page (light and dark themes)
- `assets/history.js` — source of the header animation; `history.min.js` is the minified copy the page loads
- `assets/*.woff2` — OFL fonts (Noto Serif SC, Noto Sans SC, Source Serif 4, LXGW WenKai), subset to the characters on the page
- `tools/stamp.py` — run after every change: fingerprints asset URLs and writes `version.json`,
  so returning visitors get the new version instead of a cached one
