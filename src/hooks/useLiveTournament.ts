import { useCallback, useEffect, useState } from 'react'
import { loadTournament, type TournamentState } from '../lib/tournament'

/** cf-pages-r3f-deploy: poll 30-60s for live tournament data */
export const POLL_MS = 60_000

export function useLiveTournament() {
  const [state, setState] = useState<TournamentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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

  return { state, loading, refreshing, refresh }
}
