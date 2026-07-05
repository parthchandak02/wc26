# wc26 v3 — World Cup 2026 Flat 3D Map

## Concept
Interactive **flat 3D** world map of all 48 World Cup 2026 nations — extruded countries on a tilted board (not a spinning globe). Floating filter panel highlights nations by tournament stage or confederation. Tap any country for standings.

**Metaphor family:** map (flat choropleth board)
**Narrative Pattern:** Drill-down
**Tier 2 Patterns:** Quiet Zone Detail Panel + Hero Number

## Data Source
- `https://wheniskickoff.com/data/v1/groups.json`
- `https://wheniskickoff.com/data/v1/teams.json`
- `https://wheniskickoff.com/data/v1/matches.json`
- **Poll interval:** 60s (`cache: no-store` on fetch)
- Build-time: world-atlas countries-110m → `public/countries.json` (Natural Earth projection)
- Fallback: localStorage `wc26-cache_v2`, then embedded groups

## Encoding Contract
| Data field | Visual channel | "Bigger/brighter means..." |
|------------|----------------|----------------------------|
| filter membership | extrusion height + emissive fill | nation matches active filter |
| group points | detail panel | more points = better standing |
| live matches | hero KPI | matches in progress now |

## Creative Scene (R3F)
- Primary metaphor: flat extruded map board with selective lift
- drei: OrbitControls (pan/zoom/tilt), ContactShadows
- Build script: `scripts/build-countries.mjs` (d3-geo Natural Earth)
- Camera: oblique top-down; no auto-rotate (stable, readable)

## Performance guardrails
- Stable `onSelectTeam` callback (no WebGL remount on poll)
- `DataStamp` owns 1s clock (canvas not re-rendered every second)
- Memoized filter sets; country geometry baked at build time
- DPR cap 1.75 on mobile

## UX Chrome
- Hero: Day N + stage + live match count
- Stamp: `wheniskickoff.com · N nations · live|cached|fallback · Xs ago`
- #desc: one line at bottom

## Render tier
r3f — deploy Cloudflare Pages only

## Deploy (cf-pages-r3f-deploy skill)
```bash
npm run build
~/.hermes/bin/ship-creative-daily.sh ~/projects/wc26 dist
```
- Slug: wc26
- URL: https://wc26.parthchandak.info
- GitHub Pages: **disabled** (404 on github.io)
