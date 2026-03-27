'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ── Stars particle field ──────────────────────────────────────────────────────
export function StarsBg() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const w = el.clientWidth || 400
    const h = el.clientHeight || 600

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 1000)
    camera.position.z = 5

    // Stars
    const count = 800
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.8 })
    const stars = new THREE.Points(geo, mat)
    scene.add(stars)

    let rafId: number
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      stars.rotation.y += 0.0003
      stars.rotation.x += 0.0001
      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#020b18 0%,#050d25 100%)' }}
    />
  )
}

// ── Floating geometry ─────────────────────────────────────────────────────────
export function GeoBg() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const w = el.clientWidth || 400
    const h = el.clientHeight || 600

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 1000)
    camera.position.z = 6

    const shapes: { mesh: THREE.Mesh; vx: number; vy: number; rx: number; ry: number }[] = []
    const colors = [0x7c3aed, 0x2563eb, 0x0891b2, 0xdb2777]

    for (let i = 0; i < 14; i++) {
      const geo = i % 3 === 0
        ? new THREE.OctahedronGeometry(0.35)
        : i % 3 === 1
        ? new THREE.TetrahedronGeometry(0.3)
        : new THREE.IcosahedronGeometry(0.25)
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 3)
      scene.add(mesh)
      shapes.push({ mesh, vx: (Math.random() - 0.5) * 0.004, vy: (Math.random() - 0.5) * 0.003, rx: Math.random() * 0.008, ry: Math.random() * 0.006 })
    }

    let rafId: number
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      for (const s of shapes) {
        s.mesh.position.x += s.vx
        s.mesh.position.y += s.vy
        s.mesh.rotation.x += s.rx
        s.mesh.rotation.y += s.ry
        if (Math.abs(s.mesh.position.x) > 4.5) s.vx *= -1
        if (Math.abs(s.mesh.position.y) > 5.5) s.vy *= -1
      }
      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.dispose()
      shapes.forEach(s => { s.mesh.geometry.dispose(); (s.mesh.material as THREE.Material).dispose() })
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#0f0a1e 0%,#1a0a2e 100%)' }}
    />
  )
}

// ── Neon wave mesh ────────────────────────────────────────────────────────────
export function NeonWaveBg() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const w = el.clientWidth || 400
    const h = el.clientHeight || 600

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    camera.position.set(0, 3, 5)
    camera.lookAt(0, 0, 0)

    const COLS = 30, ROWS = 30
    const geo = new THREE.PlaneGeometry(10, 10, COLS - 1, ROWS - 1)
    geo.rotateX(-Math.PI / 2.5)
    const mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.3 })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    let t = 0
    let rafId: number
    const pos = geo.attributes.position as THREE.BufferAttribute
    const baseY = new Float32Array(pos.array.length)
    for (let i = 0; i < pos.count; i++) baseY[i] = pos.getY(i)

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      t += 0.02
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i)
        pos.setY(i, baseY[i] + Math.sin(x * 1.5 + t) * 0.3 + Math.cos(z * 1.2 + t * 0.7) * 0.2)
      }
      pos.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#000d1a 0%,#001a33 100%)' }}
    />
  )
}

// ── Snow particles ─────────────────────────────────────────────────────────────
export function SnowBg() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const w = el.clientWidth || 400
    const h = el.clientHeight || 600

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100)
    camera.position.z = 5

    const count = 600
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      velocities[i] = 0.01 + Math.random() * 0.02
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color: 0xddeeff, size: 0.06, transparent: true, opacity: 0.7 })
    const snow = new THREE.Points(geo, mat)
    scene.add(snow)

    let rafId: number
    const pos = geo.attributes.position as THREE.BufferAttribute
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      for (let i = 0; i < count; i++) {
        let y = pos.getY(i) - velocities[i]
        if (y < -7) y = 7
        pos.setY(i, y)
        pos.setX(i, pos.getX(i) + Math.sin(Date.now() / 2000 + i) * 0.002)
      }
      pos.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#0a1628 0%,#0d2040 50%,#0a1628 100%)' }}
    />
  )
}
