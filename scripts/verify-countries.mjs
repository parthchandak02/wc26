#!/usr/bin/env node
/** Post-build sanity check for countries.json */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const file = join(dirname(fileURLToPath(import.meta.url)), '../public/countries.json')
const data = JSON.parse(readFileSync(file, 'utf8'))
const withIso = data.countries.filter((c) => c.iso && c.polygons?.length).length
const fifaMap = new Set(['BRA', 'USA', 'MEX', 'ARG', 'FRA', 'DEU', 'GBR', 'ESP'])
const isoHits = data.countries.filter((c) =>
  ['BRA', 'USA', 'MEX', 'ARG', 'FRA', 'DEU', 'GBR', 'ESP'].includes(c.iso),
).map((c) => c.iso)

console.log(`countries: ${data.countries.length}, with ISO+geometry: ${withIso}`)
if (withIso < 150) {
  console.error('FAIL: too few countries with ISO codes')
  process.exit(1)
}
if (isoHits.length < 6) {
  console.error('FAIL: missing key WC nations in geometry', isoHits)
  process.exit(1)
}
console.log('OK: key nations present:', isoHits.join(', '))
