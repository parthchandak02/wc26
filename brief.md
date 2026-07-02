# wc26 — Creative Brief

## Concept
A live World Cup 2026 standings dashboard. Shows all 12 group tables, today's matches, and the knockout bracket — updated from the wheniskickoff.com API each time you load. One page replaces checking three sites.

**Narrative Pattern:** Drill-down — see all groups at overview, tap a group to see its match results.

**Tier 2 Patterns (pick 2):** Quiet Zone Detail Panel + Hero Number

**Three Dials:**
- DESIGN_VARIANCE: 3 (Orderly — standings need clear structure)
- MOTION_INTENSITY: 2 (Gentle — subtle transitions, no chaos)
- VISUAL_DENSITY: 6 (Moderate — 12 groups, each with 4 teams + matches visible on expand)

## Data Source
- API: `https://wheniskickoff.com/data/v1/groups.json` (groups + team codes)
- API: `https://wheniskickoff.com/data/v1/teams.json` (48 teams with names, flags, rankings)
- API: `https://wheniskickoff.com/data/v1/matches.json` (all 104 matches with scores, status, stage)
- No API key required. CORS enabled for all origins.
- Fallback: embed a static copy of the group data and first 30 matches so the page always has content.

## Visual Style
- **Preset:** Light — Slate (Editorial Minimal)
- **Palette:**
  ```js
  const PALETTE = {
    bg: '#f8f9fa',
    surface: '#e9ecef',
    accent1: '#495057',   // dark grey — primary strokes
    accent2: '#6c757d',   // mid grey — secondary
    accent3: '#339af0',   // blue — single color pop (highlights)
    highlight: '#228be6', // deeper blue
    green: '#2b8a3e',     // win indicator
    red: '#e03131',       // loss indicator
    amber: '#f08c00',     // draw indicator
    text: 'rgba(0,0,0,0.8)',
    textMuted: 'rgba(0,0,0,0.45)',
  };
  ```
- Palette declared as JS const at top of script
- Coherence tokens: strokeWeightScale, alphaHierarchy, shapeLanguage (geometric — stands for data precision)
- Exactly one chromatic accent color: blue (#339af0). Everything else is greyscale.
- Background: #f8f9fa (off-white, clean). No gradients, no textures.

## Encoding Contract
| Data Field | Visual Channel | Range | Inverse Function | "Bigger means..." | Legend? |
|---|---|---|---|---|---|
| team.points | position in group table | 1st-4th | positionToPoints(idx) | more points | yes (table header) |
| team.goalDiff | color tint on GD cell | negative=red, zero=grey, positive=green | - | better goal difference | no |
| match.score_home | number in home cell | 0-15+ | - | more goals | no |
| match.score_away | number in away cell | 0-15+ | - | more goals | no |
| match.status | background color | FINISHED=solid, LIVE=pulse animation, UPCOMING=muted | - | match has happened | yes (legend dot) |
| group.leader | blue accent stripe | leader row gets thin left blue border | - | top of group | yes |

## Communication Requirements
**Tier 1 (mandatory):**
1. Persistent Data Stamp — "wheniskickoff.com · updated [date] · groups data"
2. Data Process Honesty — "live" when API succeeded, "cached" label if using embedded fallback
3. One-to-One Sensory Mapping — points → position in table (most intuitive rank metaphor), goals → number, status → color

**Tier 2 (pick 2):**
4. **Hero Number** — "Day N of World Cup 2026" at 48px in the top-center
5. **Quiet Zone Detail Panel** — tap a group row to expand and see all match results for that group with scores

**Coherence:**
6. Generative-art axes: strokeWeightScale {hair:0.5, fine:1, medium:2, heavy:4}, alphaHierarchy {bg:0.08, field:0.25, active:0.7, label:0.45}, shapeLanguage=geometric, glowBudget=none (no glow needed for data dashboard)
7. Motion tokens: --motion-fast:160ms, --motion-base:240ms, --motion-slow:360ms, --ease-out-expo
8. AI Slop Score < 30 — no Inter/Roboto/Open Sans, no purple gradient, off-white layered bg, at least subtle expand/collapse animation

## Interaction
- **Tap a group card** → expands to show match results for that group (4-6 matches with scores)
- **Tap expanded group** → collapses back to compact standings
- **Auto-highlight** today's matches with a subtle blue left border
- **First visit:** hint text "Tap a group to see matches" fades after 3s

## Canvas Code Requirements (MANDATORY)
1. Single HTML file, no external dependencies, no CDN libraries
2. Config object `C` at top with all tunable values
3. DPR-aware canvas setup
4. Canvas CSS: position:fixed fullscreen
5. Touch guard pattern
6. First frame never blank — render standings from embedded fallback immediately, then fetch API
7. Realistic fallback data embedded in the JS
8. Short description text (`#desc` div, bottom center, muted opacity, system-ui font)
9. Full-viewport, mobile-responsive
10. Works offline after first load
11. `.nojekyll` file at project root

## Layout (DOM-based, not Canvas — this is a data dashboard)

This project uses **DOM elements** (not Canvas 2D) because it's a data dashboard with text tables, not generative art. The canvas will only be used for decorative elements like subtle background lines or a bracket visualization.

**Page layout:**
```
┌──────────────────────────────────────────────┐
│            Day N of World Cup 2026            │  ← Hero Number (fixed top)
│            [tournament stage label]           │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────┐  ┌───────────────┐ │
│  │ Group A               │  │ Group B        │ │  ← Grid of 12 group cards
│  │ 1. MEX  6 pts  +2    │  │ 1. CAN  4 pts  │ │
│  │ 2. KOR  3 pts  +1    │  │ 2. QAT  2 pts  │ │
│  │ 3. RSA  1 pt   -1    │  │ 3. SUI  2 pts  │ │
│  │ 4. CZE  0 pts  -2    │  │ 4. BIH  1 pt   │ │
│  └──────────────────────┘  └───────────────┘ │
│  (tap to expand → shows match results)        │
│                                              │
│  ┌───── Data Stamp ───────────────────────┐  │
│  │ wheniskickoff.com · updated Jun 27 · live │  │  ← bottom-left
│  └──────────────────────────────────────────┘  │
│  ┌──── Legend ───────────────────────────┐    │
│  │ ● finished  ● live  ● upcoming       │    │  ← bottom-center
│  └───────────────────────────────────────┘    │
│  ┌ Desc ───────────────────────────────┐      │
│  │ World Cup 2026 standings at a glance│       │  ← below legend
│  └─────────────────────────────────────┘      │
└──────────────────────────────────────────────┘
```

**Important:** 
- Group cards arranged in a responsive grid (4 columns wide on desktop, 2 on tablet, 1 on mobile)
- Each card shows: group letter, team row (position, flag emoji, team name 3-letter code, points, goal difference)
- Leader row has thin blue left border
- Today's date's matches get a subtle "LIVE" badge
- Expanded view shows match results: date, home vs away, score, venue
- Compact mode fits all 12 groups on one page (scrollable)
