import { useEffect, useState } from 'react'

type Props = {
  fetchedAt: number
  nationCount: number
  sourceLabel: string
  apiAge: string
}

/** Isolated 1s clock — avoids re-rendering the WebGL canvas */
export function DataStamp({ fetchedAt, nationCount, sourceLabel, apiAge }: Props) {
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    const update = () =>
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - fetchedAt) / 1000)))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [fetchedAt])

  return (
    <p id="stamp" className="stamp">
      wheniskickoff.com · {nationCount} nations · <strong>{sourceLabel}</strong> · {secondsAgo}s ago
      {apiAge ? ` · API ${apiAge}` : ''}
    </p>
  )
}
