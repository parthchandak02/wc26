# wc26 v3 — World Cup 2026 SVG Map

## Concept
Clean **SVG choropleth** world map (d3-geo Natural Earth). No WebGL — reliable on mobile Safari. Filter highlights nations; tap for standings.

**Metaphor:** flat editorial map board  
**Stack:** React 19 + d3-geo + d3-zoom + world-atlas 110m (CDN)

## Why v3 replaced R3F
- WebGL extrude was inverted, slow (7MB geo), and failed on mobile
- SVG is instant load, correct projection, pinch/drag zoom via d3-zoom

## Controls
- Drag to pan · pinch/scroll to zoom
- Tap country for detail panel
- Filter auto-frames selection

## Deploy
```bash
npm run build
~/.hermes/bin/ship-creative-daily.sh ~/projects/wc26 dist
```
URL: https://wc26.parthchandak.info
