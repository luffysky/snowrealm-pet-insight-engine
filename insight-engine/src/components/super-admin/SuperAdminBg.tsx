'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type SuperAdminTheme = 'starfield' | 'nebula' | 'matrix' | 'grid' | 'quantum'

// ─── Theme definitions ───
export const SA_THEMES: { key: SuperAdminTheme; label: string; emoji: string; color: string }[] = [
  { key: 'starfield', label: '星際深空', emoji: '🌌', color: '#67e8f9' },
  { key: 'nebula',    label: '星雲風暴', emoji: '🔮', color: '#c084fc' },
  { key: 'matrix',    label: '矩陣終端', emoji: '💚', color: '#4ade80' },
  { key: 'grid',      label: '霓虹網格', emoji: '⚡', color: '#f472b6' },
  { key: 'quantum',   label: '量子漣漪', emoji: '🌊', color: '#38bdf8' },
]

// ─── Starfield (default) ───
function StarField({ theme }: { theme: SuperAdminTheme }) {
  const meshRef = useRef<THREE.Points>(null)

  const [positions, colors] = useMemo(() => {
    const count = theme === 'matrix' ? 2000 : 3000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    const themeColors: Record<SuperAdminTheme, number[][]> = {
      starfield: [[0.4, 0.7, 1], [1, 1, 1], [0.6, 0.8, 1]],
      nebula:    [[0.7, 0.3, 1], [1, 0.4, 0.8], [0.5, 0.3, 0.9]],
      matrix:    [[0.1, 0.8, 0.3], [0.3, 1, 0.5], [0.0, 0.6, 0.2]],
      grid:      [[1, 0.3, 0.6], [0.3, 0.9, 1], [0.8, 0.2, 1]],
      quantum:   [[0.2, 0.7, 1], [0.4, 0.9, 1], [0.1, 0.5, 0.9]],
    }

    const palette = themeColors[theme]

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 200
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200
      const c = palette[Math.floor(Math.random() * palette.length)]
      const brightness = 0.3 + Math.random() * 0.7
      col[i * 3]     = c[0] * brightness
      col[i * 3 + 1] = c[1] * brightness
      col[i * 3 + 2] = c[2] * brightness
    }
    return [pos, col]
  }, [theme])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const speed = theme === 'matrix' ? 0.08 : 0.03
    meshRef.current.rotation.y += delta * speed
    meshRef.current.rotation.x += delta * speed * 0.3
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={theme === 'matrix' ? 0.6 : 0.4}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Nebula cloud (extra layer for nebula theme) ───
function NebulaCloud() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = 800
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 25
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.4
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.2} color="#a855f7" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

// ─── Grid plane (grid theme) ───
function GridPlane() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
  })
  return (
    <gridHelper ref={ref} args={[200, 40, '#f472b6', '#1e1b4b']}>
      <meshBasicMaterial transparent opacity={0.15} />
    </gridHelper>
  )
}

// ─── Quantum wave particles ───
function QuantumWave() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = 1500
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 120
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = (Math.random() - 0.5) * 120
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, Math.sin(x * 0.1 + t) * 3 + Math.cos(z * 0.15 + t * 0.7) * 2)
    }
    pos.needsUpdate = true
    ref.current.rotation.y = t * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.5} color="#38bdf8" transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

function Scene({ theme }: { theme: SuperAdminTheme }) {
  return (
    <>
      <StarField theme={theme} />
      {theme === 'nebula' && <NebulaCloud />}
      {theme === 'grid' && <GridPlane />}
      {theme === 'quantum' && <QuantumWave />}
    </>
  )
}

const BG_COLORS: Record<SuperAdminTheme, string> = {
  starfield: '#03060f',
  nebula:    '#06021a',
  matrix:    '#000d02',
  grid:      '#08020f',
  quantum:   '#01080f',
}

export function SuperAdminBg({ theme }: { theme: SuperAdminTheme }) {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ background: BG_COLORS[theme] }}
    >
      <Canvas
        camera={{ position: [0, 0, 50], fov: 75 }}
        gl={{ antialias: false, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene theme={theme} />
      </Canvas>
    </div>
  )
}
