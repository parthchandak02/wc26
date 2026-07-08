/**
 * Emit numeric ISO → alpha-3 lookup for world-atlas country ids.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, '../src/data/numericIso.json')
const ISO_CSV =
  'https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv'

async function main() {
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
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(map))
  console.log(`Wrote ${Object.keys(map).length / 2} ISO mappings → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
