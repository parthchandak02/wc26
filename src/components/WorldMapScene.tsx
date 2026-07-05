import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ISO3_TO_FIFA } from '../data/fifaIso'
import {
  applyVisual,
  buildCountryGroup,
  centerMap,
  liftForVisual,
  visualForCountry,
  type CountriesFile,
  type CountryVisual,
} from '../lib/mapGeometry'

const CAMERA = { position: [0, 95, 118] as const, fov: 38, near: 1, far: 800 }
const GL = { antialias: true, alpha: false, powerPreference: 'high-performance' as const }
const CANVAS_BG = '#0a1628'
const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.75) : 1

type CountryEntry = {
  iso: string
  fifa?: string
  group: THREE.Group
  materials: THREE.MeshStandardMaterial[]
}

function MapContent({
  highlightFifa,
  dimFifa,
  allParticipantFifa,
  onSelectFifa,
}: {
  highlightFifa: Set<string>
  dimFifa: Set<string>
  allParticipantFifa: Set<string>
  onSelectFifa: (code: string) => void
}) {
  const rootRef = useRef<THREE.Group>(null)
  const countriesRef = useRef<CountryEntry[]>([])
  const onSelectRef = useRef(onSelectFifa)
  onSelectRef.current = onSelectFifa
  const { camera, gl, scene } = useThree()

  useEffect(() => {
    let cancelled = false
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    let removePointer: (() => void) | undefined

    fetch('/countries.json')
      .then((r) => r.json())
      .then((data: CountriesFile) => {
        if (cancelled || !rootRef.current) return
        const root = rootRef.current
        const entries: CountryEntry[] = []

        for (const c of data.countries) {
          const fifa = ISO3_TO_FIFA[c.iso]
          const materials: THREE.MeshStandardMaterial[] = []
          const baseMat = new THREE.MeshStandardMaterial({ transparent: false })
          const group = buildCountryGroup(c.polygons, baseMat)
          group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              materials.push(obj.material as THREE.MeshStandardMaterial)
            }
          })
          group.userData = { iso: c.iso, fifa, name: c.name }
          entries.push({ iso: c.iso, fifa, group, materials })
          root.add(group)
        }

        centerMap(root, data.width, data.height)
        countriesRef.current = entries

        const onPointer = (ev: PointerEvent) => {
          const rect = gl.domElement.getBoundingClientRect()
          pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
          pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
          raycaster.setFromCamera(pointer, camera)
          const hits = raycaster.intersectObjects(root.children, true)
          for (const hit of hits) {
            let node: THREE.Object3D | null = hit.object
            while (node && !node.userData?.fifa && node.parent) node = node.parent
            const fifa = node?.userData?.fifa as string | undefined
            if (fifa) {
              onSelectRef.current(fifa)
              break
            }
          }
        }

        gl.domElement.addEventListener('pointerdown', onPointer)
        removePointer = () => gl.domElement.removeEventListener('pointerdown', onPointer)
      })
      .catch(console.error)

    return () => {
      cancelled = true
      removePointer?.()
      countriesRef.current.forEach(({ group, materials }) => {
        group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) obj.geometry.dispose()
        })
        materials.forEach((m) => m.dispose())
        rootRef.current?.remove(group)
      })
      countriesRef.current = []
    }
  }, [camera, gl, scene])

  const highlightKey = useMemo(() => [...highlightFifa].sort().join(','), [highlightFifa])
  const dimKey = useMemo(() => [...dimFifa].sort().join(','), [dimFifa])
  const participantKey = useMemo(() => [...allParticipantFifa].sort().join(','), [allParticipantFifa])

  useEffect(() => {
    const highlight = new Set(highlightKey.split(',').filter(Boolean))
    const dim = new Set(dimKey.split(',').filter(Boolean))
    const participants = new Set(participantKey.split(',').filter(Boolean))

    for (const entry of countriesRef.current) {
      const visual = visualForCountry(entry.iso, entry.fifa, highlight, dim, participants)
      const lift = liftForVisual(visual)
      entry.group.position.z = lift
      for (const mat of entry.materials) applyVisual(mat, visual)
    }
  }, [highlightKey, dimKey, participantKey])

  return (
    <group ref={rootRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[1200, 700]} />
        <meshStandardMaterial color="#060e18" metalness={0.2} roughness={0.9} />
      </mesh>
    </group>
  )
}

export function WorldMapScene({
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

  const onSelect = useCallback((code: string) => onSelectTeam(code), [onSelectTeam])

  return (
    <Canvas
      camera={CAMERA}
      gl={GL}
      dpr={DPR}
      shadows
      style={{ background: `linear-gradient(180deg, ${CANVAS_BG} 0%, #121f2e 55%, #0d1b2a 100%)` }}
    >
      <color attach="background" args={[CANVAS_BG]} />
      <fog attach="fog" args={[CANVAS_BG, 180, 420]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[40, 120, 80]} intensity={1.15} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-60, 40, 40]} intensity={0.25} color="#74c0fc" />
      <Suspense fallback={null}>
        <MapContent
          highlightFifa={highlightFifa}
          dimFifa={dimFifa}
          allParticipantFifa={allParticipantFifa}
          onSelectFifa={onSelect}
        />
      </Suspense>
      <ContactShadows position={[0, -0.4, 0]} opacity={0.35} scale={280} blur={2.5} far={120} />
      <OrbitControls
        enablePan
        panSpeed={0.6}
        minDistance={70}
        maxDistance={220}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
