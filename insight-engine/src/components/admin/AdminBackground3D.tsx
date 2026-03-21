'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** 粒子系統：跟隨 CSS 變數顏色 */
function Particles({ count = 200, color = '#06b6d4' }: { count?: number; color?: string }) {
  const meshRef = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return arr
  }, [count])

  const sizes = useMemo(() => {
    const arr = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      arr[i] = Math.random() * 0.5 + 0.1
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** 浮動幾何體 */
function FloatingShape({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const speed = useMemo(() => Math.random() * 0.3 + 0.1, [])
  const rotationAxis = useMemo(() => new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  ).normalize(), [])

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += rotationAxis.x * 0.005
    meshRef.current.rotation.y += rotationAxis.y * 0.005
    meshRef.current.position.y += Math.sin(state.clock.elapsedTime * speed) * 0.002
  })

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.15}
        wireframe
      />
    </mesh>
  )
}

/** 3D 背景元件 — 用於 admin layout */
export default function AdminBackground3D() {
  // 從 CSS 變數讀取主題色
  const accentColor = useMemo(() => {
    if (typeof window === 'undefined') return '#06b6d4'
    const style = getComputedStyle(document.documentElement)
    return style.getPropertyValue('--t-accent-raw')?.trim() || '#06b6d4'
  }, [])

  const shapes = useMemo(() => {
    const arr: [number, number, number][] = []
    for (let i = 0; i < 8; i++) {
      arr.push([
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
      ])
    }
    return arr
  }, [])

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <Particles count={150} color={accentColor} />
        {shapes.map((pos, i) => (
          <FloatingShape key={i} position={pos} color={accentColor} />
        ))}
      </Canvas>
    </div>
  )
}
