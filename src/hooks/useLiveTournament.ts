import { useCallback, useEffect, useState } from 'react'
import { loadTournament, type TournamentState } from '../lib/tournament'

/** cf-pages-r3f-deploy: poll 30-60s for live tournament data */
export const POLL_MS = 60_000

export function useLiveTournament() {
  const [state, setState] = useState<TournamentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const next = await loadTournament()
      setState(next)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refresh(false)
    const poll = setInterval(() => refresh(true), POLL_MS)
    return () => clearInterval(poll)
  }, [refresh])

  // Update "Xs ago" every second
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const secondsAgo = state
    ? Math.max(0, Math.floor((Date.now() - state.fetchedAt) / 1000))
    : 0

  return { state, loading, refreshing, secondsAgo, refresh, tick }
}
