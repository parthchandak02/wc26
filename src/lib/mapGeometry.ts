import * as THREE from 'three'

export type CountryData = {
  iso: string
  name: string
  polygons: number[][][][]
}

export type CountriesFile = {
  width: number
  height: number
  countries: CountryData[]
}

const EXTRUDE = { depth: 1.8, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.08, bevelSegments: 1 }

function ringsToShape(rings: number[][]): THREE.Shape {
  const outer = rings[0]
  const shape = new THREE.Shape()
  shape.moveTo(outer[0][0], outer[0][1])
  for (let i = 1; i < outer.length; i++) shape.lineTo(outer[i][0], outer[i][1])
  shape.closePath()
  for (let h = 1; h < rings.length; h++) {
    const hole = new THREE.Path()
    const ring = rings[h]
    hole.moveTo(ring[0][0], ring[0][1])
    for (let i = 1; i < ring.length; i++) hole.lineTo(ring[i][0], ring[i][1])
    hole.closePath()
    shape.holes.push(hole)
  }
  return shape
}

export function buildCountryGroup(polygons: number[][][][], material: THREE.Material): THREE.Group {
  const group = new THREE.Group()
  for (const rings of polygons) {
    try {
      const shape = ringsToShape(rings)
      const geom = new THREE.ExtrudeGeometry(shape, EXTRUDE)
      geom.computeVertexNormals()
      const mesh = new THREE.Mesh(geom, material.clone())
      group.add(mesh)
    } catch {
      /* skip degenerate polygons */
    }
  }
  return group
}

export function centerMap(group: THREE.Group, width: number, height: number): void {
  group.position.set(-width / 2, height / 2, 0)
  group.rotation.x = -Math.PI / 2
}

export type CountryVisual = 'highlight' | 'dim' | 'neutral' | 'base'

const PALETTE: Record<CountryVisual, { color: string; emissive: string; emissiveIntensity: number; metalness: number; roughness: number }> = {
  highlight: { color: '#4dabf7', emissive: '#228be6', emissiveIntensity: 0.55, metalness: 0.2, roughness: 0.32 },
  dim: { color: '#3d5a80', emissive: '#2c4a6b', emissiveIntensity: 0.22, metalness: 0.12, roughness: 0.48 },
  neutral: { color: '#2b3f55', emissive: '#1e3048', emissiveIntensity: 0.15, metalness: 0.1, roughness: 0.55 },
  base: { color: '#243447', emissive: '#1a2838', emissiveIntensity: 0.08, metalness: 0.08, roughness: 0.62 },
}

export function applyVisual(mat: THREE.MeshStandardMaterial, visual: CountryVisual): void {
  const p = PALETTE[visual]
  mat.color.set(p.color)
  mat.emissive.set(p.emissive)
  mat.emissiveIntensity = p.emissiveIntensity
  mat.metalness = p.metalness
  mat.roughness = p.roughness
}

export function visualForCountry(
  iso: string,
  fifa: string | undefined,
  highlight: Set<string>,
  dim: Set<string>,
  participants: Set<string>,
): CountryVisual {
  if (fifa && highlight.has(fifa)) return 'highlight'
  if (fifa && dim.has(fifa)) return 'dim'
  if (fifa && participants.has(fifa)) return 'neutral'
  if (iso) return 'base'
  return 'base'
}

export function liftForVisual(v: CountryVisual): number {
  if (v === 'highlight') return 2.8
  if (v === 'dim') return 1.2
  if (v === 'neutral') return 0.6
  return 0.2
}
