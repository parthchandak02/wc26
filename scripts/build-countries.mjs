/**
 * Build compact country polygons (110m) + ISO3 codes for fast mobile load.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'
import { geoNaturalEarth1 } from 'd3-geo'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, '../public/countries.json')
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const ISO_CSV =
  'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv'
const WIDTH = 960
const HEIGHT = 520
const PAD = 20
const MAX_RING_PTS = 72

async function loadNumericToIso3() {
  const text = await fetch(ISO_CSV).then((r) => r.text())
  const map = {}
  for (const line of text.split('\n').slice(1)) {
    if (!line.trim()) continue
    const parts = line.split(',')
    const iso3 = (parts[2] || '').trim().toUpperCase()
    const raw = (parts[3] || '').trim()
    if (!iso3 || iso3.length !== 3 || !raw) continue
    const num = String(parseInt(raw, 10))
    const padded = num.padStart(3, '0')
    map[num] = iso3
    map[padded] = iso3
  }
  return map
}

function decimateRing(ring) {
  if (ring.length <= MAX_RING_PTS) return ring
  const step = Math.ceil(ring.length / MAX_RING_PTS)
  const out = []
  for (let i = 0; i < ring.length; i += step) out.push(ring[i])
  const last = ring[ring.length - 1]
  const tail = out[out.length - 1]
  if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) out.push(last)
  return out
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
  if (geometry.type === 'Polygon') polys.push(geometry.coordinates)
  else if (geometry.type === 'MultiPolygon') {
    for (const p of geometry.coordinates) polys.push(p)
  }
  const out = []
  for (const poly of polys) {
    const rings = poly.map((ring) => {
      const projected = ring.map(([lng, lat]) => {
        const pt = projection([lng, lat])
        return pt ? [Math.round(pt[0]), Math.round(pt[1])] : [0, 0]
      })
      return decimateRing(projected)
    })
    const outer = rings[0]
    if (!outer || outer.length < 4) continue
    if (ringArea(outer) > 0) rings[0] = [...outer].reverse()
    out.push(rings)
  }
  return out
}

async function main() {
  const [world, numericToIso] = await Promise.all([
    fetch(GEO_URL).then((r) => r.json()),
    loadNumericToIso3(),
  ])

  const countries = feature(world, world.objects.countries)
  const projection = geoNaturalEarth1().fitExtent(
    [[PAD, PAD], [WIDTH - PAD, HEIGHT - PAD]],
    countries,
  )

  const items = []
  for (const f of countries.features) {
    const id = String(f.id ?? f.properties?.id ?? '')
    const iso = numericToIso[id] || numericToIso[String(parseInt(id, 10))] || ''
    if (!iso) continue
    const name = f.properties?.name || ''
    const polygons = projectRings(f.geometry, projection)
    if (!polygons.length) continue
    items.push({ iso, name, polygons })
  }

  items.sort((a, b) => a.iso.localeCompare(b.iso))
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({ width: WIDTH, height: HEIGHT, countries: items }))

  const bytes = JSON.stringify({ width: WIDTH, height: HEIGHT, countries: items }).length
  console.log(`Wrote ${items.length} countries → ${OUT} (${(bytes / 1024).toFixed(0)} KB)`)
  if (items.length < 150) {
    console.error('ERROR: too few countries')
    process.exit(1)
  }
  if (bytes > 900_000) {
    console.error('WARN: countries.json still large', bytes)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
