/** FIFA 3-letter codes used by wheniskickoff.com → ISO 3166-1 alpha-3 for world-atlas polygons */
export const FIFA_TO_ISO3: Record<string, string> = {
  ARG: 'ARG', AUS: 'AUS', AUT: 'AUT', BEL: 'BEL', BIH: 'BIH', BRA: 'BRA',
  CAN: 'CAN', CIV: 'CIV', CRO: 'HRV', CPV: 'CPV', COD: 'COD', COL: 'COL',
  CZE: 'CZE', CUW: 'CUW', DZA: 'DZA', ECU: 'ECU', EGY: 'EGY', ENG: 'GBR',
  ESP: 'ESP', FRA: 'FRA', GHA: 'GHA', GER: 'DEU', HAI: 'HTI', IRQ: 'IRQ',
  IRN: 'IRN', JOR: 'JOR', JPN: 'JPN', KOR: 'KOR', KSA: 'SAU', MAR: 'MAR',
  MEX: 'MEX', NED: 'NLD', NOR: 'NOR', NZL: 'NZL', PAN: 'PAN', PAR: 'PRY',
  POR: 'PRT', QAT: 'QAT', RSA: 'ZAF', SCO: 'GBR', SEN: 'SEN', SUI: 'CHE',
  SWE: 'SWE', TUN: 'TUN', TUR: 'TUR', URU: 'URY', USA: 'USA', UZB: 'UZB',
}

/** ISO3 → FIFA (first match; GBR defaults to ENG for taps on UK polygon) */
export const ISO3_TO_FIFA: Record<string, string> = {}
for (const [fifa, iso] of Object.entries(FIFA_TO_ISO3)) {
  if (!ISO3_TO_FIFA[iso]) ISO3_TO_FIFA[iso] = fifa
}
ISO3_TO_FIFA['GBR'] = 'ENG'

export type FilterId =
  | 'all-nations'
  | 'group-qualifiers'
  | 'group-winners'
  | 'last-32'
  | 'round-of-16'
  | 'quarter-finals'
  | 'semi-finals'
  | 'finalists'
  | 'europe'
  | 'south-america'
  | 'africa'
  | 'asia'
  | 'north-america'
  | 'oceania'

export const FILTER_LABELS: Record<FilterId, string> = {
  'all-nations': 'All 48 nations',
  'group-qualifiers': 'Group stage qualifiers (top 2)',
  'group-winners': 'Group winners',
  'last-32': 'Round of 32 teams',
  'round-of-16': 'Round of 16',
  'quarter-finals': 'Quarter-finals',
  'semi-finals': 'Semi-finals',
  finalists: 'Finalists',
  europe: 'Europe (UEFA)',
  'south-america': 'South America (CONMEBOL)',
  africa: 'Africa (CAF)',
  asia: 'Asia (AFC)',
  'north-america': 'North America (CONCACAF)',
  oceania: 'Oceania (OFC)',
}

export const CONFEDERATION_MAP: Record<string, FilterId> = {
  UEFA: 'europe',
  CONMEBOL: 'south-america',
  CAF: 'africa',
  AFC: 'asia',
  CONCACAF: 'north-america',
  OFC: 'oceania',
}
