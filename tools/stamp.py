#!/usr/bin/env python3
"""Fingerprint the site so visitors never get stuck on a stale version.

GitHub Pages tells browsers to cache every file for 10 minutes and doesn't let us
change that header. So instead:

1. every local asset URL in index.html gets ?v=<hash of that file's bytes>;
   an unchanged file keeps its URL (cache reused), a changed file gets a new URL;
2. index.html carries a build id (a hash of the page itself), also written to
   version.json. On load, the page fetches version.json uncached; if the ids
   differ, the page is stale and reloads once from the network.

Run after every change, then commit:   python3 tools/stamp.py
"""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "index.html"
BUILD_RE = re.compile(r"var BUILD = '[^']*';")


def short_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:10]


def stamp_asset(match: re.Match) -> str:
    path = match.group(1)
    file = ROOT / path
    return f"{path}?v={short_hash(file.read_bytes())}" if file.is_file() else match.group(0)


html = PAGE.read_text(encoding="utf-8")
html = re.sub(r"((?:assets/[\w.\-]+)|favicon\.svg)(?:\?v=[0-9a-f]+)?", stamp_asset, html)
build = short_hash(BUILD_RE.sub("var BUILD = '';", html).encode("utf-8"))
html = BUILD_RE.sub(f"var BUILD = '{build}';", html)
PAGE.write_text(html, encoding="utf-8")
(ROOT / "version.json").write_text(json.dumps({"build": build}) + "\n", encoding="utf-8")
print(f"build {build}")
