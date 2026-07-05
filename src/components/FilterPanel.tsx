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
  return (
    <aside className={`filter-panel ${minimized ? 'minimized' : ''}`}>
      <header className="filter-header">
        <div>
          <h2>Map filters</h2>
          <p>Highlight nations on the map</p>
        </div>
        <button type="button" className="minimize-btn" onClick={onToggleMinimize} aria-label={minimized ? 'Expand' : 'Minimize'}>
          {minimized ? '◧' : '−'}
        </button>
      </header>
      {!minimized && (
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
      )}
    </aside>
  )
}
