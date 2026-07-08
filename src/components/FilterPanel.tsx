import { FILTER_LABELS, type FilterId } from '../data/fifaIso'

const FILTER_GROUPS: { title: string; ids: FilterId[] }[] = [
  {
    title: 'Tournament stage',
    ids: ['all-nations', 'group-qualifiers', 'group-winners', 'last-32', 'round-of-16', 'quarter-finals', 'semi-finals', 'finalists'],
  },
  {
    title: 'Confederation',
    ids: ['europe', 'south-america', 'africa', 'asia', 'north-america', 'oceania'],
  },
]

export function FilterPanel({
  active,
  onChange,
  counts,
  minimized,
  onToggleMinimize,
}: {
  active: FilterId
  onChange: (id: FilterId) => void
  counts: Record<FilterId, number>
  minimized: boolean
  onToggleMinimize: () => void
}) {
  if (minimized) {
    return (
      <button
        type="button"
        className="filter-pill"
        onClick={onToggleMinimize}
        aria-expanded="false"
        aria-label="Open map filters"
      >
        <span className="filter-pill-label">Filters</span>
        <span className="filter-pill-value">{FILTER_LABELS[active]} · {counts[active] ?? 0}</span>
      </button>
    )
  }

  return (
    <aside className="filter-panel" aria-label="Map filters">
      <header className="filter-header">
        <div>
          <h2>Map filters</h2>
          <p>Highlight nations on the map</p>
        </div>
        <button type="button" className="minimize-btn" onClick={onToggleMinimize} aria-label="Minimize filters">
          ×
        </button>
      </header>
      <div className="filter-body">
        {FILTER_GROUPS.map((g) => (
          <section key={g.title} className="filter-section">
            <h3>{g.title}</h3>
            <ul>
              {g.ids.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className={`filter-chip ${active === id ? 'active' : ''}`}
                    onClick={() => onChange(id)}
                  >
                    <span>{FILTER_LABELS[id]}</span>
                    <span className="count">{counts[id] ?? 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  )
}
