import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom'
import { feature } from 'topojson-client'
import type { FilterId } from '../data/fifaIso'
import {
  GEO_URL,
  fifaFromGeoId,
  MAP_COLORS,
  paddingForFocus,
  visualForFifa,
} from '../lib/mapSvg'

const MAP_W = 800
const MAP_H = 440

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, { name?: string }> & { id?: string | number }

function fitTransform(
  features: GeoFeature[],
  filter: FilterId,
  highlight: Set<string>,
  project: ReturnType<typeof geoNaturalEarth1>,
): ZoomTransform {
  const matched =
    filter === 'all-nations' || highlight.size === 0 || highlight.size >= 40
      ? features
      : features.filter((f) => {
          const code = fifaFromGeoId(f.id)
          return code && highlight.has(code)
        })

  if (!matched.length) return zoomIdentity

  // Bounds in projected (screen) space, so the fit respects both the map's width and its
  // height and isn't thrown off by countries that cross the antimeridian.
  const [[x0, y0], [x1, y1]] = geoPath(project).bounds({
    type: 'FeatureCollection',
    features: matched,
  })
  const pad = paddingForFocus(highlight.size, filter)
  const dx = Math.max(x1 - x0, 1)
  const dy = Math.max(y1 - y0, 1)
  const scale = Math.max(0.85, Math.min(6.5, Math.min((0.86 * MAP_W) / dx, (0.86 * MAP_H) / dy) / pad))
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return zoomIdentity.translate(MAP_W / 2, MAP_H / 2).scale(scale).translate(-cx, -cy)
}

export function WorldMapScene({
  activeFilter,
  highlightFifa,
  allParticipantFifa,
  onSelectTeam,
}: {
  activeFilter: FilterId
  highlightFifa: Set<string>
  allParticipantFifa: Set<string>
  onSelectTeam: (code: string) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<ReturnType<typeof zoom<SVGSVGElement, unknown>> | null>(null)
  const featuresRef = useRef<GeoFeature[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const projection = useMemo(
    () => geoNaturalEarth1().fitSize([MAP_W, MAP_H], { type: 'Sphere' } as GeoJSON.Geometry),
    [],
  )
  const pathGen = useMemo(() => geoPath(projection), [projection])

  const dimFifa = useMemo(() => {
    const d = new Set<string>()
    allParticipantFifa.forEach((c) => {
      if (!highlightFifa.has(c)) d.add(c)
    })
    return d
  }, [highlightFifa, allParticipantFifa])

  const highlightKey = useMemo(() => [...highlightFifa].sort().join(','), [highlightFifa])

  const applyFrame = useCallback(
    (filter: FilterId, highlight: Set<string>) => {
      const svg = svgRef.current
      const z = zoomRef.current
      if (!svg || !z || !featuresRef.current.length) return
      const t = fitTransform(featuresRef.current, filter, highlight, projection)
      select(svg).transition().duration(500).call(z.transform, t)
    },
    [projection],
  )

  useEffect(() => {
    let cancelled = false
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((world) => {
        if (cancelled) return
        const countries = feature(world, world.objects.countries) as GeoJSON.FeatureCollection
        featuresRef.current = countries.features as GeoFeature[]
        projection.fitSize([MAP_W, MAP_H], countries)
        setReady(true)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Map failed'))
    return () => {
      cancelled = true
    }
  }, [projection])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !ready) return

    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.75, 7])
      .on('zoom', (event) => {
        if (gRef.current) {
          gRef.current.setAttribute('transform', event.transform.toString())
        }
      })

    zoomRef.current = z
    select(svg).call(z)

    const highlight = new Set(highlightKey.split(',').filter(Boolean))
    const t = fitTransform(featuresRef.current, activeFilter, highlight, projection)
    select(svg).call(z.transform, t)

    return () => {
      select(svg).on('.zoom', null)
    }
  }, [ready, projection])

  useEffect(() => {
    if (!ready) return
    const highlight = new Set(highlightKey.split(',').filter(Boolean))
    applyFrame(activeFilter, highlight)
  }, [activeFilter, highlightKey, applyFrame, ready])

  if (error) {
    return (
      <div className="map-canvas-wrap map-svg-wrap">
        <div className="map-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="map-canvas-wrap map-svg-wrap">
      {!ready && <div className="map-loading">Loading map…</div>}
      <svg
        ref={svgRef}
        className="world-map"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        role="img"
        aria-label="World Cup 2026 nations map"
      >
        <defs>
          <filter id="lift" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#228be6" floodOpacity="0.5" />
          </filter>
        </defs>
        <rect width={MAP_W} height={MAP_H} fill="transparent" />
        <g ref={gRef}>
          {ready &&
            featuresRef.current.map((f) => {
              const fifa = fifaFromGeoId(f.id)
              const visual = visualForFifa(fifa, highlightFifa, dimFifa, allParticipantFifa)
              const colors = MAP_COLORS[visual]
              const d = pathGen(f)
              if (!d) return null
              return (
                <path
                  key={String(f.id)}
                  d={d}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={visual === 'highlight' ? 0.7 : 0.4}
                  filter={colors.filter}
                  style={{ cursor: fifa ? 'pointer' : 'default' }}
                  onClick={() => fifa && onSelectTeam(fifa)}
                />
              )
            })}
        </g>
      </svg>
    </div>
  )
}
