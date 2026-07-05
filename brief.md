# wc26 v2 — World Cup 2026 Globe Dashboard

## Concept
Interactive 3D world map of all 48 World Cup 2026 nations. Floating filter panel highlights countries by tournament stage (group qualifiers, round of 16, quarter-finals, etc.) or confederation. Tap any country on the globe for standings and stats.

**Narrative Pattern:** Drill-down — world overview → tap country for detail panel.

**Tier 2 Patterns:** Quiet Zone Detail Panel + Hero Number (Day N + stage label)

**Render:** R3F + drei + three-globe, Vite, Cloudflare Pages at wc26.parthchandak.info

## Data Source
- wheniskickoff.com APIs (groups, teams, matches) — same as v1
- world-atlas countries-110m for globe polygons

## Visual Style
- Dark globe atmosphere (Slate editorial chrome on light floating panels)
- Blue highlight for active filter nations
- Dim blue for other WC participants

## Migration
- v1: single-file DOM dashboard on GitHub Pages
- v2: 3D globe on Cloudflare Pages (creative-factory R3F tier)
