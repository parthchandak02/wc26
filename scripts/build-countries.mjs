/**
 * Build-time: project world-atlas countries to flat Natural Earth coords.
 * Output: public/countries.json (cached at deploy, no runtime triangulation).
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'
import { geoNaturalEarth1 } from 'd3-geo'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, '../public/countries.json')
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const WIDTH = 960
const HEIGHT = 520
const PAD = 24

function isoFromProps(p) {
  return String(p.iso_a3 || p.ISO_A3 || p.adm0_a3 || '').toUpperCase()
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
  const world = await fetch(GEO_URL).then((r) => r.json())
  const countries = feature(world, world.objects.countries)
  const projection = geoNaturalEarth1().fitExtent(
    [[PAD, PAD], [WIDTH - PAD, HEIGHT - PAD]],
    countries,
  )

  const items = []
  for (const f of countries.features) {
    const iso = isoFromProps(f.properties || {})
    const name = f.properties?.name || ''
    const polygons = projectRings(f.geometry, projection)
    if (!polygons.length) continue
    items.push({ iso, name, polygons })
  }

  items.sort((a, b) => a.iso.localeCompare(b.iso))
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({ width: WIDTH, height: HEIGHT, countries: items }))
  console.log(`Wrote ${items.length} countries → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
