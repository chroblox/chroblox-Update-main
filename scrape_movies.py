#!/usr/bin/env python3
"""
scrape_movies.py — Build movies.json for Chroblox v1.5

Pulls popular + top-rated movies from TMDB, attaches an embed URL from
each of several streaming providers (so when one rots, the others still
work), and dumps a clean JSON file shaped like games.json.

USAGE
    python3 scrape_movies.py
    python3 scrape_movies.py --pages 50         # 50 pages of popular = 1000 movies
    python3 scrape_movies.py --out movies.json  # explicit output path

Drop the resulting movies.json into chroblox-Update/public/ and the
view-movies page picks it up via fetch('/movies.json').

If you get a 403 (CloudFront / geo-block):
  - Run from your EC2 box instead of locally
  - Or enable Cloudflare WARP / VPN to a US/EU exit
  - Or set TMDB_API_KEY env var and run elsewhere
"""

import json
import os
import sys
import time
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# ── CONFIG ──────────────────────────────────────────────────────────────────

TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "83468cc24c1b513594914c00c3f29987")
TMDB_BASE    = "https://api.themoviedb.org/3"
POSTER_BASE  = "https://image.tmdb.org/t/p/w500"

# Embed providers, ordered by perceived reliability.
# The first becomes `url`, the rest go into `fallbacks` so the player
# UI can rotate to a different one if the primary embed dies.
# All take a TMDB id — the most universal currency in this corner of the web.
EMBED_PROVIDERS = [
    ("VidSrc",       "https://vidsrc.xyz/embed/movie?tmdb={id}"),
    ("EmbedSU",      "https://embed.su/embed/movie/{id}"),
    ("VidLink",      "https://vidlink.pro/movie/{id}"),
    ("111Movies",    "https://111movies.com/movie/{id}"),
    ("AutoEmbed",    "https://autoembed.co/movie/tmdb/{id}"),
    ("VidSrc.RIP",   "https://vidsrc.rip/embed/movie/{id}"),
    ("VidSrc.SU",    "https://vidsrc.su/embed/movie/{id}"),
    ("2Embed",       "https://www.2embed.cc/embed/{id}"),
    ("SmashyStream", "https://embed.smashystream.com/playere.php?tmdb={id}"),
    ("VidEasy",      "https://player.videasy.net/movie/{id}"),
    ("VidFast",      "https://vidfast.pro/movie/{id}"),
]

USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# ── HTTP ────────────────────────────────────────────────────────────────────

def tmdb_get(path, page=None, retry=3):
    """GET https://api.themoviedb.org/3{path}?api_key=...&page=N"""
    sep = "&" if "?" in path else "?"
    url = f"{TMDB_BASE}{path}{sep}api_key={TMDB_API_KEY}"
    if page is not None:
        url += f"&page={page}"

    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    last_err = None
    for attempt in range(retry):
        try:
            with urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode("utf-8"))
        except HTTPError as e:
            last_err = e
            if e.code == 429:  # rate limited
                wait = 2 + attempt * 2
                print(f"  rate-limited, sleeping {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            if e.code == 403:
                body = e.read().decode("utf-8", errors="replace")[:200]
                raise SystemExit(
                    f"\n403 from TMDB. Body: {body!r}\n"
                    "  → If 'Host not in allowlist': you're on a sandboxed network; run elsewhere.\n"
                    "  → If geo-blocked: try Cloudflare WARP, ProtonVPN, or run from EC2.\n"
                )
            raise
        except URLError as e:
            last_err = e
            time.sleep(1 + attempt)
    raise SystemExit(f"Network failure after {retry} retries: {last_err}")

# ── MAIN ────────────────────────────────────────────────────────────────────

def build_entry(m):
    """Turn a TMDB movie object into our flat schema."""
    tmdb_id = m["id"]
    poster  = m.get("poster_path")
    release = m.get("release_date") or ""
    year    = int(release[:4]) if len(release) >= 4 and release[:4].isdigit() else None

    urls = [tpl.format(id=tmdb_id) for _, tpl in EMBED_PROVIDERS]
    return {
        "name":      m.get("title") or m.get("original_title") or "Untitled",
        "year":      year,
        "rating":    round(m.get("vote_average") or 0.0, 1),
        "tmdb_id":   tmdb_id,
        "img":       (POSTER_BASE + poster) if poster else "",
        "overview":  m.get("overview", ""),
        "url":       urls[0],
        "fallbacks": urls[1:],
    }

def fetch_list(endpoint, pages, label):
    """Pull N pages from /movie/{endpoint} and return raw movie dicts."""
    print(f"\n→ Pulling {pages} pages of {label} ({endpoint})", file=sys.stderr)
    out = []
    for p in range(1, pages + 1):
        data = tmdb_get(f"/movie/{endpoint}", page=p)
        out.extend(data.get("results", []))
        sys.stderr.write(f"\r  page {p}/{pages}  ({len(out)} movies so far)   ")
        sys.stderr.flush()
        # Be polite — TMDB allows ~50 req/sec but no need to hammer
        time.sleep(0.05)
    sys.stderr.write("\n")
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages",     type=int, default=50, help="Pages of /popular to pull (default 50 = 1000 movies)")
    ap.add_argument("--top-pages", type=int, default=25, help="Pages of /top_rated to pull (default 25 = 500 extra)")
    ap.add_argument("--min-votes", type=int, default=100, help="Filter out movies with fewer votes (cuts low-quality)")
    ap.add_argument("--out",       default="movies.json")
    args = ap.parse_args()

    if not TMDB_API_KEY or len(TMDB_API_KEY) < 30:
        raise SystemExit("Set TMDB_API_KEY env var or paste your key in scrape_movies.py")

    raw = []
    raw += fetch_list("popular",   args.pages,     "popular")
    raw += fetch_list("top_rated", args.top_pages, "top-rated")

    # Dedupe by tmdb id, keep the first occurrence (popularity-ordered)
    seen = set()
    unique = []
    for m in raw:
        if m["id"] in seen:
            continue
        seen.add(m["id"])
        unique.append(m)

    # Quality filter: must have poster, plausible vote count
    filtered = [m for m in unique
                if m.get("poster_path")
                and (m.get("vote_count") or 0) >= args.min_votes
                and not m.get("adult")]

    # Sort: highest popularity first
    filtered.sort(key=lambda m: m.get("popularity") or 0, reverse=True)

    out = [build_entry(m) for m in filtered]

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Wrote {len(out)} movies → {args.out}", file=sys.stderr)
    print(f"  Total unique fetched: {len(unique)}", file=sys.stderr)
    print(f"  Filtered out (no poster / low votes / adult): {len(unique) - len(out)}", file=sys.stderr)
    print(f"  File size: {os.path.getsize(args.out) / 1024:.1f} KB", file=sys.stderr)
    if out:
        sample = out[0]
        print(f"\nSample entry:", file=sys.stderr)
        print(f"  {sample['name']} ({sample['year']}) — rating {sample['rating']}", file=sys.stderr)
        print(f"  primary: {sample['url']}", file=sys.stderr)
        print(f"  poster:  {sample['img']}", file=sys.stderr)
        print(f"  fallbacks: {len(sample['fallbacks'])}", file=sys.stderr)

if __name__ == "__main__":
    main()