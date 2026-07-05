import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import ThreeGlobe from 'three-globe'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import { FIFA_TO_ISO3, ISO3_TO_FIFA } from '../data/fifaIso'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

type CountryFeature = {
  type: 'Feature'
  properties: { name: string; iso_a3?: string; ISO_A3?: string }
  geometry: Geometry
}

function isoFromFeature(f: CountryFeature): string {
  const p = f.properties
  return (p.iso_a3 || p.ISO_A3 || '').toUpperCase()
}

function GlobeMesh({
  highlightFifa,
  dimFifa,
  onSelectFifa,
}: {
  highlightFifa: Set<string>
  dimFifa: Set<string>
  onSelectFifa: (code: string) => void
}) {
  const globeRef = useRef<ThreeGlobe | null>(null)
  const { scene } = useThree()
  const countriesRef = useRef<CountryFeature[]>([])

  const highlightIso = useMemo(() => {
    const s = new Set<string>()
    highlightFifa.forEach((f) => {
      const iso = FIFA_TO_ISO3[f]
      if (iso) s.add(iso)
    })
    return s
  }, [highlightFifa])

  useEffect(() => {
    const globe = new ThreeGlobe()
    globeRef.current = globe
    globe.globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
    globe.bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
    globe.showAtmosphere(true)
    globe.atmosphereColor('#339af0')
    globe.atmosphereAltitude(0.12)
    scene.add(globe)

    fetch(GEO_URL)
      .then((r) => r.json())
      .then((world) => {
        const countries = feature(world, world.objects.countries) as FeatureCollection
        countriesRef.current = countries.features as CountryFeature[]
        globe.polygonsData(countries.features)
        globe.polygonCapColor((feat: object) => {
          const f = feat as CountryFeature
          const iso = isoFromFeature(f)
          const fifa = ISO3_TO_FIFA[iso]
          if (fifa && highlightFifa.has(fifa)) return 'rgba(51, 154, 240, 0.82)'
          if (fifa && dimFifa.has(fifa)) return 'rgba(51, 154, 240, 0.18)'
          return 'rgba(73, 80, 87, 0.22)'
        })
        globe.polygonSideColor(() => 'rgba(34, 139, 230, 0.35)')
        globe.polygonStrokeColor(() => 'rgba(73, 80, 87, 0.45)')
        globe.polygonAltitude((feat: object) => {
          const f = feat as CountryFeature
          const iso = isoFromFeature(f)
          const fifa = ISO3_TO_FIFA[iso]
          return fifa && highlightFifa.has(fifa) ? 0.06 : 0.01
        })
        globe.onPolygonClick((feat: object) => {
          const f = feat as CountryFeature
          const iso = isoFromFeature(f)
          const fifa = ISO3_TO_FIFA[iso]
          if (fifa) onSelectFifa(fifa)
        })
      })
      .catch(console.error)

    return () => {
      scene.remove(globe)
      globeRef.current = null
    }
  }, [scene, onSelectFifa])

  useEffect(() => {
    const globe = globeRef.current
    if (!globe || !countriesRef.current.length) return
    globe.polygonCapColor((feat: object) => {
      const f = feat as CountryFeature
      const iso = isoFromFeature(f)
      const fifa = ISO3_TO_FIFA[iso]
      if (fifa && highlightFifa.has(fifa)) return 'rgba(51, 154, 240, 0.82)'
      if (fifa && dimFifa.has(fifa)) return 'rgba(51, 154, 240, 0.18)'
      return 'rgba(73, 80, 87, 0.22)'
    })
    globe.polygonAltitude((feat: object) => {
      const f = feat as CountryFeature
      const iso = isoFromFeature(f)
      const fifa = ISO3_TO_FIFA[iso]
      return fifa && highlightFifa.has(fifa) ? 0.06 : 0.01
    })
  }, [highlightFifa, dimFifa, highlightIso])

  return null
}

export function GlobeScene({
  highlightFifa,
  allParticipantFifa,
  onSelectTeam,
}: {
  highlightFifa: Set<string>
  allParticipantFifa: Set<string>
  onSelectTeam: (code: string) => void
}) {
  const dimFifa = useMemo(() => {
    const d = new Set<string>()
    allParticipantFifa.forEach((c) => {
      if (!highlightFifa.has(c)) d.add(c)
    })
    return d
  }, [highlightFifa, allParticipantFifa])

  return (
    <Canvas
      camera={{ position: [0, 0, 280], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1a2838 55%, #0d1b2a 100%)' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[120, 80, 60]} intensity={1.1} />
      <Stars radius={300} depth={60} count={1200} factor={3} saturation={0.2} fade speed={0.4} />
      <GlobeMesh highlightFifa={highlightFifa} dimFifa={dimFifa} onSelectFifa={onSelectTeam} />
      <OrbitControls
        enablePan={false}
        minDistance={160}
        maxDistance={400}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  )
}

export function teamDetailLines(team: Team, standing?: { position: number; points: number; gd: number }) {
  const lines = [
    `${team.flag} ${team.name} (${team.code})`,
    `Group ${team.group} · FIFA rank #${team.rank}`,
    team.confederation,
  ]
  if (standing) {
    lines.push(`Group position: ${standing.position} · ${standing.points} pts · GD ${standing.gd >= 0 ? '+' : ''}${standing.gd}`)
  }
  return lines
}
