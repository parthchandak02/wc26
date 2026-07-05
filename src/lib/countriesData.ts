import type { CountriesFile } from './mapGeometry'

let cache: CountriesFile | null = null

export async function getCountriesFile(): Promise<CountriesFile> {
  if (cache) return cache
  const res = await fetch('/countries.json')
  if (!res.ok) throw new Error(`countries.json HTTP ${res.status}`)
  const data = (await res.json()) as CountriesFile
  if (!data.countries?.length) throw new Error('countries.json is empty')
  const withIso = data.countries.filter((c) => c.iso).length
  if (withIso < 100) throw new Error(`countries.json missing ISO codes (${withIso} only)`)
  cache = data
  return data
}
