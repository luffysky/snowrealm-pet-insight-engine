'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox, Sphere, Stars } from '@react-three/drei'
import type { Group } from 'three'

function FloatingWorld() {
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08
  })

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.35} floatIntensity={0.7}>
        <Sphere args={[1.2, 48, 48]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#d8f4ff" transparent opacity={0.95} roughness={0.15} metalness={0.08} />
        </Sphere>
      </Float>

      <Float speed={2.2} rotationIntensity={0.2} floatIntensity={1.1}>
        <RoundedBox args={[1.55, 0.95, 0.14]} radius={0.16} smoothness={4} position={[0, 0.18, 1.08]}>
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.34}
            roughness={0}
            metalness={0.08}
            transmission={0.92}
            thickness={1.2}
          />
        </RoundedBox>
      </Float>

      <Float speed={2.8} rotationIntensity={0.4} floatIntensity={1.3} position={[-1.55, 0.95, 0.2]}>
        <Sphere args={[0.18, 32, 32]}>
          <meshStandardMaterial color="#ffd9ec" emissive="#ffd9ec" emissiveIntensity={0.4} />
        </Sphere>
      </Float>

      <Float speed={3.1} rotationIntensity={0.4} floatIntensity={1.3} position={[1.45, -0.8, 0.3]}>
        <Sphere args={[0.14, 32, 32]}>
          <meshStandardMaterial color="#fff0b8" emissive="#fff0b8" emissiveIntensity={0.36} />
        </Sphere>
      </Float>

      <Float speed={2.5} rotationIntensity={0.25} floatIntensity={1.1} position={[1.05, 1.1, -0.1]}>
        <Sphere args={[0.1, 24, 24]}>
          <meshStandardMaterial color="#c9f6d8" emissive="#c9f6d8" emissiveIntensity={0.32} />
        </Sphere>
      </Float>
    </group>
  )
}

export default function HomeThreeCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 4.6], fov: 42 }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 2, 3]} intensity={1.4} />
      <pointLight position={[-2, -1, 2]} intensity={1.2} color="#ffd7ee" />
      <Stars radius={60} depth={50} count={1500} factor={2.2} saturation={0} fade speed={0.6} />
      <FloatingWorld />
    </Canvas>
  )
}
