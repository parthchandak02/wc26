/**
 * Build-time: project geo-countries to flat Natural Earth coords with ISO3 codes.
 * Output: public/countries.json
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoNaturalEarth1 } from 'd3-geo'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, '../public/countries.json')
const GEO_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
const WIDTH = 960
const HEIGHT = 520
const PAD = 24

function isoFromProps(p) {
  const iso = String(p['ISO3166-1-Alpha-3'] || p.ISO_A3 || p.iso_a3 || '').toUpperCase()
  if (!iso || iso === '-99' || iso === 'UNK') return ''
  return iso
}

function ringArea(ring) {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return a
}

function projectRings(geometry, projection) {
  const polys = []
  if (geometry.type === 'Polygon') {
    polys.push(geometry.coordinates)
  } else if (geometry.type === 'MultiPolygon') {
    for (const p of geometry.coordinates) polys.push(p)
  }
  const out = []
  for (const poly of polys) {
    const rings = poly.map((ring) =>
      ring.map(([lng, lat]) => {
        const pt = projection([lng, lat])
        return pt ? [Math.round(pt[0] * 10) / 10, Math.round(pt[1] * 10) / 10] : [0, 0]
      }),
    )
    const outer = rings[0]
    if (!outer || outer.length < 4) continue
    if (ringArea(outer) > 0) rings[0] = [...outer].reverse()
    out.push(rings)
  }
  return out
}

async function main() {
  const geo = await fetch(GEO_URL).then((r) => {
    if (!r.ok) throw new Error(`geo-countries fetch failed: ${r.status}`)
    return r.json()
  })

  const projection = geoNaturalEarth1().fitExtent(
    [[PAD, PAD], [WIDTH - PAD, HEIGHT - PAD]],
    geo,
  )

  const items = []
  for (const f of geo.features) {
    const iso = isoFromProps(f.properties || {})
    if (!iso) continue
    const name = f.properties?.name || f.properties?.ADMIN || ''
    const polygons = projectRings(f.geometry, projection)
    if (!polygons.length) continue
    items.push({ iso, name, polygons })
  }

  items.sort((a, b) => a.iso.localeCompare(b.iso))
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({ width: WIDTH, height: HEIGHT, countries: items }))

  const withPoly = items.filter((c) => c.polygons.length > 0).length
  console.log(`Wrote ${items.length} countries (${withPoly} with geometry) → ${OUT}`)
  if (items.length < 150) {
    console.error('ERROR: expected ~200+ countries with ISO codes')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
