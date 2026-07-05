import type { FilterId } from './fifaIso'

export type Team = {
  code: string
  name: string
  flag: string
  group: string
  rank: number
  confederation: string
  slug: string
}

export type Match = {
  num: number
  date: string
  time_utc: string
  home: string | null
  away: string | null
  group: string | null
  phase: string
  score_home: number | null
  score_away: number | null
  status: string
  home_name?: string
  away_name?: string
  venue_name?: string
  venue_city?: string
  label?: string
}

export type GroupData = { group: string; teams: string[] }

export type Standing = {
  code: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  position: number
}

export type TournamentState = {
  teams: Record<string, Team>
  groups: GroupData[]
  matches: Match[]
  standings: Record<string, Standing[]>
  source: 'live' | 'cached' | 'fallback'
  updated: string
  fetchedAt: number
  apiGenerated: string | null
  tournamentDay: number
  stageLabel: string
  liveMatchCount: number
  finishedMatchCount: number
}

const CACHE_KEY = 'wc26-cache_v2'
export const POLL_MS = 60_000

const API = {
  groups: 'https://wheniskickoff.com/data/v1/groups.json',
  teams: 'https://wheniskickoff.com/data/v1/teams.json',
  matches: 'https://wheniskickoff.com/data/v1/matches.json',
}

const FALLBACK_GROUPS: GroupData[] = [
  { group: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { group: 'B', teams: ['CAN', 'QAT', 'SUI', 'BIH'] },
  { group: 'C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { group: 'D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { group: 'E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
  { group: 'F', teams: ['NED', 'JPN', 'TUN', 'SWE'] },
  { group: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { group: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { group: 'I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
  { group: 'J', teams: ['ARG', 'DZA', 'AUT', 'JOR'] },
  { group: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { group: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
]

function computeStandings(teamCodes: string[], matches: Match[]): Standing[] {
  const stats: Record<string, Standing> = {}
  for (const code of teamCodes) {
    stats[code] = { code, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, position: 0 }
  }
  const groupMatches = matches.filter(
    (m) => m.phase === 'group' && m.status === 'FINISHED' && m.home && m.away && teamCodes.includes(m.home) && teamCodes.includes(m.away),
  )
  for (const m of groupMatches) {
    const h = m.home!
    const a = m.away!
    const sh = m.score_home ?? 0
    const sa = m.score_away ?? 0
    stats[h].played++
    stats[a].played++
    stats[h].gf += sh
    stats[h].ga += sa
    stats[a].gf += sa
    stats[a].ga += sh
    if (sh > sa) {
      stats[h].won++
      stats[a].lost++
      stats[h].points += 3
    } else if (sh < sa) {
      stats[a].won++
      stats[h].lost++
      stats[a].points += 3
    } else {
      stats[h].drawn++
      stats[a].drawn++
      stats[h].points++
      stats[a].points++
    }
  }
  const rows = Object.values(stats).map((s) => ({ ...s, gd: s.gf - s.ga }))
  rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
  rows.forEach((r, i) => { r.position = i + 1 })
  return rows
}

function teamsFromKnockout(matches: Match[], phase: string): Set<string> {
  const codes = new Set<string>()
  for (const m of matches) {
    if (m.phase !== phase) continue
    if (m.home) codes.add(m.home)
    if (m.away) codes.add(m.away)
  }
  return codes
}

function winnersFromKnockout(matches: Match[], phase: string): Set<string> {
  const codes = new Set<string>()
  for (const m of matches) {
    if (m.phase !== phase || m.status !== 'FINISHED') continue
    if (!m.home || !m.away) continue
    const sh = m.score_home ?? 0
    const sa = m.score_away ?? 0
    if (sh > sa) codes.add(m.home)
    else if (sa > sh) codes.add(m.away)
  }
  return codes
}

export function getTeamsForFilter(filter: FilterId, state: TournamentState): Set<string> {
  const all = new Set(Object.keys(state.teams))
  const standings = state.standings

  switch (filter) {
    case 'all-nations':
      return all
    case 'group-qualifiers': {
      const q = new Set<string>()
      for (const rows of Object.values(standings)) {
        rows.filter((r) => r.position <= 2).forEach((r) => q.add(r.code))
      }
      return q
    }
    case 'group-winners': {
      const w = new Set<string>()
      for (const rows of Object.values(standings)) {
        const top = rows.find((r) => r.position === 1)
        if (top) w.add(top.code)
      }
      return w
    }
    case 'last-32':
      return teamsFromKnockout(state.matches, 'last-32').size
        ? teamsFromKnockout(state.matches, 'last-32')
        : getTeamsForFilter('group-qualifiers', state)
    case 'round-of-16':
      return teamsFromKnockout(state.matches, 'round-of-16').size
        ? teamsFromKnockout(state.matches, 'round-of-16')
        : winnersFromKnockout(state.matches, 'last-32')
    case 'quarter-finals':
      return teamsFromKnockout(state.matches, 'quarter-finals').size
        ? teamsFromKnockout(state.matches, 'quarter-finals')
        : winnersFromKnockout(state.matches, 'round-of-16')
    case 'semi-finals':
      return teamsFromKnockout(state.matches, 'semi-finals').size
        ? teamsFromKnockout(state.matches, 'semi-finals')
        : winnersFromKnockout(state.matches, 'quarter-finals')
    case 'finalists': {
      const f = teamsFromKnockout(state.matches, 'final')
      if (f.size) return f
      return winnersFromKnockout(state.matches, 'semi-finals')
    }
    case 'europe':
    case 'south-america':
    case 'africa':
    case 'asia':
    case 'north-america':
    case 'oceania': {
      const conf = {
        europe: 'UEFA',
        'south-america': 'CONMEBOL',
        africa: 'CAF',
        asia: 'AFC',
        'north-america': 'CONCACAF',
        oceania: 'OFC',
      }[filter]
      return new Set(Object.values(state.teams).filter((t) => t.confederation === conf).map((t) => t.code))
    }
    default:
      return all
  }
}

function inferStage(matches: Match[]): string {
  const phases = ['final', 'semi-finals', 'quarter-finals', 'round-of-16', 'last-32', 'group']
  for (const p of phases) {
    const ms = matches.filter((m) => m.phase === p)
    if (p === 'group') {
      const unfinished = ms.some((m) => m.status !== 'FINISHED')
      if (unfinished || ms.length) return 'GROUP STAGE'
      continue
    }
    const live = ms.some((m) => m.status === 'LIVE' || (m.status !== 'FINISHED' && m.home && m.away))
    const upcoming = ms.some((m) => m.status === 'UPCOMING' || (!m.home && !m.away))
    if (live || upcoming || ms.some((m) => m.status === 'FINISHED')) {
      return p.replace(/-/g, ' ').toUpperCase()
    }
  }
  return 'GROUP STAGE'
}

function tournamentDay(matches: Match[]): number {
  const start = new Date('2026-06-11T00:00:00Z')
  const today = new Date()
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1
  const finished = matches.filter((m) => m.status === 'FINISHED').length
  return Math.max(1, Math.min(32, diff > 0 ? diff : finished > 0 ? Math.ceil(finished / 3) : 1))
}

export async function loadTournament(): Promise<TournamentState> {
  const fetchedAt = Date.now()
  let groups = FALLBACK_GROUPS
  let teams: Record<string, Team> = {}
  let matches: Match[] = []
  let source: TournamentState['source'] = 'fallback'
  let updated = new Date().toISOString()
  let apiGenerated: string | null = null

  try {
    const [gRes, tRes, mRes] = await Promise.all([
      fetch(API.groups, { cache: 'no-store', headers: { Accept: 'application/json' } }),
      fetch(API.teams, { cache: 'no-store', headers: { Accept: 'application/json' } }),
      fetch(API.matches, { cache: 'no-store', headers: { Accept: 'application/json' } }),
    ])
    if (!gRes.ok || !tRes.ok || !mRes.ok) throw new Error('api')
    const gJson = await gRes.json()
    const tJson = await tRes.json()
    const mJson = await mRes.json()
    groups = gJson.data ?? FALLBACK_GROUPS
    const map: Record<string, Team> = {}
    for (const t of tJson.data ?? []) map[t.code] = t
    teams = map
    matches = mJson.data ?? []
    apiGenerated = mJson.meta?.generated ?? gJson.meta?.generated ?? null
    updated = apiGenerated ?? new Date().toISOString()
    source = 'live'
    persistCache(gJson, tJson, mJson)
  } catch {
    try {
      const cached = localStorage.getItem(CACHE_KEY) ?? localStorage.getItem('wc26-cache')
      if (cached) {
        const c = JSON.parse(cached)
        groups = c.groups?.data ?? c.data ?? FALLBACK_GROUPS
        const rawTeams = c.teams?.data ?? []
        const map: Record<string, Team> = {}
        for (const t of rawTeams) map[t.code] = t
        teams = map
        matches = c.matches?.data ?? []
        apiGenerated = c.matches?.meta?.generated ?? null
        updated = apiGenerated ?? new Date(c.saved ?? Date.now()).toISOString()
        source = 'cached'
      }
    } catch { /* keep fallback */ }
  }

  const standings: Record<string, Standing[]> = {}
  for (const g of groups) {
    standings[g.group] = computeStandings(g.teams, matches)
  }

  const liveMatchCount = matches.filter((m) => m.status === 'LIVE').length
  const finishedMatchCount = matches.filter((m) => m.status === 'FINISHED').length

  return {
    teams,
    groups,
    matches,
    standings,
    source,
    updated,
    fetchedAt,
    apiGenerated,
    tournamentDay: tournamentDay(matches),
    stageLabel: inferStage(matches),
    liveMatchCount,
    finishedMatchCount,
  }
}

export function persistCache(groups: unknown, teams: unknown, matches: unknown) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ groups, teams, matches, saved: Date.now() }),
    )
  } catch { /* ignore */ }
}
