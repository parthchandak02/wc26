import type { FilterId } from '../data/fifaIso'
import numericIso from '../data/numericIso.json'
import { ISO3_TO_FIFA } from '../data/fifaIso'

export const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const numericToIso3 = numericIso as Record<string, string>

export function isoFromGeoId(id: string | number | undefined): string {
  const raw = String(id ?? '')
  return numericToIso3[raw] || numericToIso3[String(parseInt(raw, 10))] || ''
}

export function fifaFromGeoId(id: string | number | undefined): string | undefined {
  const iso = isoFromGeoId(id)
  return iso ? ISO3_TO_FIFA[iso] : undefined
}

export type CountryVisual = 'highlight' | 'dim' | 'neutral' | 'base'

export function visualForFifa(
  fifa: string | undefined,
  highlight: Set<string>,
  dim: Set<string>,
  participants: Set<string>,
): CountryVisual {
  if (!fifa) return 'base'
  if (highlight.has(fifa)) return 'highlight'
  if (dim.has(fifa)) return 'dim'
  if (participants.has(fifa)) return 'neutral'
  return 'base'
}

export const MAP_COLORS: Record<CountryVisual, { fill: string; stroke: string; filter?: string }> = {
  highlight: { fill: '#4dabf7', stroke: '#74c0fc', filter: 'url(#lift)' },
  dim: { fill: '#3d5a80', stroke: '#5c7a9e' },
  neutral: { fill: '#2b3f55', stroke: '#4a6278' },
  base: { fill: '#243447', stroke: '#3a5068' },
}

export function paddingForFocus(count: number, filter: FilterId): number {
  if (filter === 'all-nations' || count >= 40) return 1.05
  if (count <= 2) return 2.4
  if (count <= 6) return 1.8
  if (count <= 16) return 1.45
  return 1.25
}
