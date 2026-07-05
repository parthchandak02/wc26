import { useState } from 'react'
import { GlobeScene } from './components/GlobeScene'
import { FilterPanel } from './components/FilterPanel'
import { FIFA_TO_ISO3, type FilterId } from './data/fifaIso'
import { useLiveTournament } from './hooks/useLiveTournament'
import { getTeamsForFilter, type Team, type TournamentState } from './lib/tournament'
import './App.css'

function buildCounts(state: TournamentState): Record<FilterId, number> {
  const ids: FilterId[] = [
    'all-nations', 'group-qualifiers', 'group-winners', 'last-32', 'round-of-16',
    'quarter-finals', 'semi-finals', 'finalists', 'europe', 'south-america',
    'africa', 'asia', 'north-america', 'oceania',
  ]
  const out = {} as Record<FilterId, number>
  for (const id of ids) out[id] = getTeamsForFilter(id, state).size
  return out
}

function formatApiAge(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const { state, loading, refreshing, secondsAgo } = useLiveTournament()
  const [filter, setFilter] = useState<FilterId>('group-qualifiers')
  const [selected, setSelected] = useState<Team | null>(null)
  const [panelMin, setPanelMin] = useState(false)

  if (loading || !state) {
    return (
      <div className="loading">
        <p>Loading World Cup 2026 data…</p>
      </div>
    )
  }

  const highlight = getTeamsForFilter(filter, state)
  const allNations = new Set(Object.keys(state.teams))
  const nationCount = allNations.size
  const standing = selected
    ? state.standings[state.teams[selected.code]?.group]?.find((s) => s.code === selected.code)
    : undefined

  const sourceLabel = state.source === 'live' ? 'live' : state.source === 'cached' ? 'cached' : 'fallback'
  const apiAge = formatApiAge(state.apiGenerated)

  return (
    <div className="app">
      <header className="hero">
        <h1>Day {state.tournamentDay} of World Cup 2026</h1>
        <p className="stage">{state.stageLabel}</p>
        <p className="hero-kpi" aria-live="polite">
          {state.liveMatchCount > 0
            ? `${state.liveMatchCount} live now`
            : `${state.finishedMatchCount} matches played`}
          {refreshing ? ' · refreshing…' : ''}
        </p>
      </header>

      <FilterPanel
        active={filter}
        onChange={setFilter}
        counts={buildCounts(state)}
        minimized={panelMin}
        onToggleMinimize={() => setPanelMin((v) => !v)}
      />

      <div className="globe-wrap">
        <GlobeScene
          highlightFifa={highlight}
          allParticipantFifa={allNations}
          onSelectTeam={(code) => {
            const t = state.teams[code]
            if (t) setSelected(t)
          }}
        />
      </div>

      {selected && (
        <div className="detail-panel" role="dialog" aria-label="Country details">
          <button type="button" className="detail-close" onClick={() => setSelected(null)} aria-label="Close">
            ×
          </button>
          <h2>{selected.flag} {selected.name}</h2>
          <p className="detail-code">{selected.code} · Group {selected.group}</p>
          <dl>
            <div><dt>Confederation</dt><dd>{selected.confederation}</dd></div>
            <div><dt>FIFA rank</dt><dd>#{selected.rank}</dd></div>
            {standing && (
              <>
                <div><dt>Group standing</dt><dd>{standing.position}{standing.position === 1 ? 'st' : standing.position === 2 ? 'nd' : standing.position === 3 ? 'rd' : 'th'}</dd></div>
                <div><dt>Points</dt><dd>{standing.points}</dd></div>
                <div><dt>Goal diff</dt><dd className={standing.gd >= 0 ? 'gd-pos' : 'gd-neg'}>{standing.gd >= 0 ? '+' : ''}{standing.gd}</dd></div>
                <div><dt>Record</dt><dd>{standing.won}W {standing.drawn}D {standing.lost}L</dd></div>
              </>
            )}
            <div><dt>Map ISO</dt><dd>{FIFA_TO_ISO3[selected.code] ?? '-'}</dd></div>
          </dl>
          <p className="detail-hint">Tap another country on the globe to compare.</p>
        </div>
      )}

      <div className="chrome">
        <p id="stamp" className="stamp">
          wheniskickoff.com · {nationCount} nations · <strong>{sourceLabel}</strong> · {secondsAgo}s ago
          {apiAge ? ` · API ${apiAge}` : ''}
        </p>
        <p id="legend" className="legend">
          <span className="swatch bright" /> Selected filter ({highlight.size})
          <span className="swatch dim" /> Other participants
        </p>
        <p id="desc" className="desc">
          3D World Cup map - filter by stage or region, tap a country for standings. Refreshes every 60s.
        </p>
      </div>
    </div>
  )
}
