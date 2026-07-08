import { useEffect, useState } from 'react'

const STORAGE_KEY = 'wc26-map-hint-v3'

function isTouchPrimary(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}

export function MapControlsHelp({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(true)
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
    setTouch(isTouchPrimary())
  }, [])

  if (!visible || dismissed) return null

  const pan = touch ? 'Drag' : 'Drag'
  const zoom = touch ? 'Pinch' : 'Scroll'
  const select = touch ? 'Tap' : 'Click'

  return (
    <div className="map-help" role="note" aria-label="Map controls">
      <p className="map-help-title">Explore the map</p>
      <ul className="map-help-list">
        <li><strong>{pan}</strong> to pan the map</li>
        <li><strong>{zoom}</strong> to zoom in or out</li>
        <li><strong>{select}</strong> a country for standings</li>
        <li>Change a filter to auto-frame nations</li>
      </ul>
      <button
        type="button"
        className="map-help-dismiss"
        onClick={() => {
          setDismissed(true)
          try {
            localStorage.setItem(STORAGE_KEY, '1')
          } catch { /* ignore */ }
        }}
      >
        Got it
      </button>
    </div>
  )
}
