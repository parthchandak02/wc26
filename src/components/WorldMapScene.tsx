import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls, type OrbitControls as OrbitControlsImpl } from '@react-three/drei'
import * as THREE from 'three'
import { ISO3_TO_FIFA } from '../data/fifaIso'
import { getCountriesFile } from '../lib/countriesData'
import {
  applyVisual,
  buildCountryGroup,
  centerMap,
  liftForVisual,
  visualForCountry,
} from '../lib/mapGeometry'

const CAMERA = { position: [0, 140, 160] as const, fov: 42, near: 1, far: 900 }
const GL = { antialias: true, alpha: false, powerPreference: 'high-performance' as const }
const CANVAS_BG = '#0a1628'
const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.75) : 1

type CountryEntry = {
  iso: string
  fifa?: string
  group: THREE.Group
  materials: THREE.MeshStandardMaterial[]
}

function fitCameraToMap(
  root: THREE.Group,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControlsImpl | null,
) {
  const box = new THREE.Box3().setFromObject(root)
  if (box.isEmpty()) return
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.z, size.y)
  camera.position.set(center.x, center.y + maxDim * 0.85, center.z + maxDim * 0.95)
  camera.lookAt(center)
  camera.updateProjectionMatrix()
  if (controls) {
    controls.target.copy(center)
    controls.update()
  }
}

function MapContent({
  highlightFifa,
  dimFifa,
  allParticipantFifa,
  onSelectFifa,
  onReady,
  onError,
}: {
  highlightFifa: Set<string>
  dimFifa: Set<string>
  allParticipantFifa: Set<string>
  onSelectFifa: (code: string) => void
  onReady: () => void
  onError: (msg: string) => void
}) {
  const rootRef = useRef<THREE.Group>(null)
  const countriesRef = useRef<CountryEntry[]>([])
  const onSelectRef = useRef(onSelectFifa)
  onSelectRef.current = onSelectFifa
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl } = useThree()

  useEffect(() => {
    let cancelled = false
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let removePointer: (() => void) | undefined

    getCountriesFile()
      .then((data) => {
        if (cancelled || !rootRef.current) return
        const root = rootRef.current
        const entries: CountryEntry[] = []

        for (const c of data.countries) {
          if (!c.iso || !c.polygons?.length) continue
          const fifa = ISO3_TO_FIFA[c.iso]
          const materials: THREE.MeshStandardMaterial[] = []
          const group = buildCountryGroup(c.polygons, new THREE.MeshStandardMaterial())
          if (!group.children.length) continue
          group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              materials.push(obj.material as THREE.MeshStandardMaterial)
            }
          })
          group.userData = { iso: c.iso, fifa, name: c.name }
          entries.push({ iso: c.iso, fifa, group, materials })
          root.add(group)
        }

        if (!entries.length) throw new Error('No country meshes built')

        centerMap(root, data.width, data.height)
        countriesRef.current = entries
        requestAnimationFrame(() => {
          fitCameraToMap(root, camera as THREE.PerspectiveCamera, controlsRef.current)
        })
        onReady()

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
      .catch((err: Error) => {
        console.error(err)
        onError(err.message || 'Map failed to load')
      })

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
  }, [camera, gl, onReady, onError])

  const highlightKey = useMemo(() => [...highlightFifa].sort().join(','), [highlightFifa])
  const dimKey = useMemo(() => [...dimFifa].sort().join(','), [dimFifa])
  const participantKey = useMemo(() => [...allParticipantFifa].sort().join(','), [allParticipantFifa])

  useEffect(() => {
    const highlight = new Set(highlightKey.split(',').filter(Boolean))
    const dim = new Set(dimKey.split(',').filter(Boolean))
    const participants = new Set(participantKey.split(',').filter(Boolean))

    for (const entry of countriesRef.current) {
      const visual = visualForCountry(entry.iso, entry.fifa, highlight, dim, participants)
      entry.group.position.z = liftForVisual(visual)
      for (const mat of entry.materials) applyVisual(mat, visual)
    }
  }, [highlightKey, dimKey, participantKey])

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[1100, 620]} />
        <meshStandardMaterial color="#0d1828" metalness={0.15} roughness={0.88} />
      </mesh>
      <group ref={rootRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        panSpeed={0.6}
        minDistance={90}
        maxDistance={320}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
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
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const dimFifa = useMemo(() => {
    const d = new Set<string>()
    allParticipantFifa.forEach((c) => {
      if (!highlightFifa.has(c)) d.add(c)
    })
    return d
  }, [highlightFifa, allParticipantFifa])

  const onSelect = useCallback((code: string) => onSelectTeam(code), [onSelectTeam])
  const onReady = useCallback(() => setMapReady(true), [])
  const onError = useCallback((msg: string) => setMapError(msg), [])

  return (
    <div className="map-canvas-wrap">
      {!mapReady && !mapError && <div className="map-loading">Loading map…</div>}
      {mapError && <div className="map-error">{mapError}</div>}
      <Canvas
        camera={CAMERA}
        gl={GL}
        dpr={DPR}
        shadows
        style={{ background: `linear-gradient(180deg, ${CANVAS_BG} 0%, #121f2e 55%, #0d1b2a 100%)` }}
      >
        <color attach="background" args={[CANVAS_BG]} />
        <fog attach="fog" args={[CANVAS_BG, 280, 600]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[60, 160, 90]} intensity={1.25} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-80, 60, 50]} intensity={0.35} color="#74c0fc" />
        <hemisphereLight args={['#3d5a80', '#0a1628', 0.35]} />
        <Suspense fallback={null}>
          <MapContent
            highlightFifa={highlightFifa}
            dimFifa={dimFifa}
            allParticipantFifa={allParticipantFifa}
            onSelectFifa={onSelect}
            onReady={onReady}
            onError={onError}
          />
        </Suspense>
        <ContactShadows position={[0, -0.55, 0]} opacity={0.4} scale={300} blur={2.5} far={140} />
      </Canvas>
    </div>
  )
}
