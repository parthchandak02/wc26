/**
 * Save a snapshot of the wheniskickoff.com World Cup API into public/data/.
 * The API sends no CORS headers, so browsers can't read it directly; the app
 * serves this same-origin copy instead. Run `npm run snapshot` to refresh it.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dir, '../public/data')
const BASE = 'https://wheniskickoff.com/data/v1/'
const FILES = ['groups', 'teams', 'matches']

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  for (const name of FILES) {
    const res = await fetch(`${BASE}${name}.json`)
    if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`)
    const json = await res.json()
    if (!Array.isArray(json.data)) throw new Error(`${name}.json: no data array`)
    writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(json))
    console.log(`Wrote ${json.data.length} ${name} (generated ${json.meta?.generated ?? '?'})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
