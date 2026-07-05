# wc26 v2 — World Cup 2026 Globe Dashboard

## Concept
Interactive 3D world map of all 48 World Cup 2026 nations. Floating filter panel highlights countries by tournament stage or confederation. Tap any country for standings.

**Metaphor family:** map
**Narrative Pattern:** Drill-down
**Tier 2 Patterns:** Quiet Zone Detail Panel + Hero Number

## Data Source
- `https://wheniskickoff.com/data/v1/groups.json`
- `https://wheniskickoff.com/data/v1/teams.json`
- `https://wheniskickoff.com/data/v1/matches.json`
- **Poll interval:** 60s (`cache: no-store` on fetch)
- world-atlas countries-110m for globe polygons
- Fallback: localStorage `wc26-cache_v2`, then embedded groups

## Encoding Contract
| Data field | Visual channel | "Bigger/brighter means..." |
|------------|----------------|----------------------------|
| filter membership | polygon cap color + altitude | nation matches active filter |
| group points | detail panel | more points = better standing |
| live matches | hero KPI | matches in progress now |

## Creative Scene (R3F)
- Primary metaphor: globe map with nation highlights
- drei: OrbitControls, Stars
- three-globe: country polygons, tap to select
- Default camera: full globe, auto-rotate

## UX Chrome
- Hero: Day N + stage + live match count
- Stamp: `wheniskickoff.com · N nations · live|cached|fallback · Xs ago`
- #desc: one line at bottom
- Reduced motion: disable globe auto-rotate (future)

## Render tier
r3f — deploy Cloudflare Pages

## Deploy (cf-pages-r3f-deploy skill)
```bash
npm run build
~/.hermes/bin/ship-creative-daily.sh ~/projects/wc26 dist
```
(requires CLOUDFLARE_* and GITHUB_TOKEN in Hermes env)
- Slug: wc26
- URL: https://wc26.parthchandak.info
- Never GitHub Pages
