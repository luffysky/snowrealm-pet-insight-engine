'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRM, VRMUtils } from '@pixiv/three-vrm'

export type YukirinMood = 'happy' | 'surprised' | 'relaxed' | 'neutral' | 'wink' | 'excited' | 'thinking' | 'sad'

// 效能分級
type QualityTier = 'high' | 'mid' | 'low'

function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'mid'
  const gl = document.createElement('canvas').getContext('webgl2')
  if (!gl) return 'low'
  // 手機裝置降一級
  if (/Mobile|Android/i.test(navigator.userAgent)) return 'mid'
  return 'high'
}

// 柔和三點燈光設置
function setupLights(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0xd0c0f8, 0.8)
  scene.add(ambient)

  const keyLight = new THREE.DirectionalLight(0xf0e8ff, 1.2)
  keyLight.position.set(1, 2, 3)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xffd0d0, 0.6)
  fillLight.position.set(-2, 1, 1)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xd0d0ff, 0.4)
  rimLight.position.set(0, 3, -2)
  scene.add(rimLight)
}

// 玻璃球粒子背景（High 模式：6 顆球 + 200 粒子）
function createGlassSpheres(scene: THREE.Scene, tier: QualityTier) {
  const count = tier === 'high' ? 6 : tier === 'mid' ? 3 : 0
  const group = new THREE.Group()

  for (let i = 0; i < count; i++) {
    const radius = 0.3 + Math.random() * 0.4
    const geo = new THREE.SphereGeometry(radius, 32, 32)
    const mat = tier === 'high'
      ? new THREE.MeshPhysicalMaterial({
          color: 0xd8d0f8,
          metalness: 0,
          roughness: 0,
          transmission: 0.9,
          thickness: 0.5,
          ior: 1.4,
          transparent: true,
          opacity: 0.3,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xd8d0f8,
          transparent: true,
          opacity: 0.15,
          metalness: 0.1,
          roughness: 0.05,
        })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4,
      -2 - Math.random() * 3,
    )
    mesh.userData.floatSpeed = 0.3 + Math.random() * 0.4
    mesh.userData.floatOffset = Math.random() * Math.PI * 2
    group.add(mesh)
  }
  scene.add(group)
  return group
}

function createParticles(scene: THREE.Scene, tier: QualityTier) {
  const count = tier === 'high' ? 200 : tier === 'mid' ? 80 : 0
  if (count === 0) return null

  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8
    positions[i * 3 + 2] = -3 - Math.random() * 4
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    color: 0xe8e0ff,
    size: 0.03,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  scene.add(points)
  return points
}

interface YukirinSceneProps {
  /** 畫布模式：fullBody / upperBody / face */
  cameraMode?: 'fullBody' | 'upperBody' | 'face'
  /** 初始表情 */
  mood?: YukirinMood
  /** 是否顯示背景玻璃球 */
  showBackground?: boolean
  /** 外部注入的 mood 變更（從 AI Guide 觸發） */
  onLoad?: (controls: YukirinControls) => void
  className?: string
}

export interface YukirinControls {
  setMood: (mood: YukirinMood, durationMs?: number) => void
  playAnimation: (name: string) => void
}

const CAMERA_PRESETS = {
  fullBody:   { pos: [0, 0.9, 2.2] as const, target: [0, 0.9, 0] as const },
  upperBody:  { pos: [0, 1.2, 1.4] as const, target: [0, 1.2, 0] as const },
  face:       { pos: [0, 1.5, 0.9] as const, target: [0, 1.5, 0] as const },
}

// 表情對應 VRM Expression 名稱
const MOOD_EXPRESSION: Record<YukirinMood, string> = {
  happy:     'happy',
  surprised: 'surprised',
  relaxed:   'relaxed',
  neutral:   'neutral',
  wink:      'blinkLeft',
  excited:   'happy',
  thinking:  'neutral',
  sad:       'sad',
}

export default function YukirinScene({
  cameraMode = 'fullBody',
  mood = 'happy',
  showBackground = true,
  onLoad,
  className = '',
}: YukirinSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const vrmRef = useRef<VRM | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const currentMoodRef = useRef<YukirinMood>(mood)
  const blinkTimerRef = useRef(0)
  const blinkIntervalRef = useRef(3 + Math.random() * 4) // 3-7 秒
  const mouseRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const clickCooldownRef = useRef(false)

  // 點擊互動：隨機切換表情
  const CLICK_REACTIONS: YukirinMood[] = ['surprised', 'wink', 'excited', 'happy', 'relaxed']
  const clickReactionIdxRef = useRef(0)

  // 平滑過渡表情
  const transitionExpression = useCallback((vrm: VRM, target: YukirinMood, durationMs = 300) => {
    const targetExpr = MOOD_EXPRESSION[target]
    const steps = Math.ceil(durationMs / 16)
    let step = 0

    // 先淡出當前表情
    const currentExpr = MOOD_EXPRESSION[currentMoodRef.current]
    if (currentExpr !== targetExpr) {
      vrm.expressionManager?.setValue(currentExpr, 0)
    }

    const tick = () => {
      step++
      const t = step / steps
      vrm.expressionManager?.setValue(targetExpr, Math.min(t * 0.85, 0.85))
      if (step < steps) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    currentMoodRef.current = target
  }, [])

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    const tier = detectTier()
    if (tier === 'low') return // low tier 由父層顯示 PNG fallback

    // ── Scene 設置 ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const { width, height } = container.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    const preset = CAMERA_PRESETS[cameraMode]
    camera.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
    camera.lookAt(preset.target[0], preset.target[1], preset.target[2])
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    setupLights(scene)

    let sphereGroup: THREE.Group | null = null
    let particles: THREE.Points | null = null
    if (showBackground) {
      sphereGroup = createGlassSpheres(scene, tier)
      particles = createParticles(scene, tier)
    }

    // ── VRM 載入 ───────────────────────────────────────────────────────────
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    loader.loadAsync('/models/Yukirin.vrm').then((gltf) => {
      const vrm: VRM = gltf.userData.vrm
      VRMUtils.removeUnnecessaryJoints(vrm.scene)
      // VRM 模型預設面向 -Z（與 Three.js 相機方向一致），不需旋轉
      vrm.scene.rotation.y = 0

      // 自動縮放：把模型高度撐到約 1.6m 單位
      const box = new THREE.Box3().setFromObject(vrm.scene)
      const modelHeight = box.max.y - box.min.y
      if (modelHeight > 0) {
        const targetHeight = 1.65
        const scale = targetHeight / modelHeight
        vrm.scene.scale.setScalar(scale)
        // 把腳底對齊 y=0
        box.setFromObject(vrm.scene)
        vrm.scene.position.y = -box.min.y
      }

      scene.add(vrm.scene)
      vrmRef.current = vrm

      // 初始表情
      transitionExpression(vrm, mood)

      // 暴露外部控制 API
      if (onLoad) {
        onLoad({
          setMood: (m, dur) => transitionExpression(vrm, m, dur),
          playAnimation: (_name) => { /* Mixamo 動畫在下一版本加入 */ },
        })
      }
    }).catch((err) => {
      console.error('[YukirinScene] VRM 載入失敗', err)
    })

    // ── 滑鼠視差 ───────────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── 點擊互動 ───────────────────────────────────────────────────────────
    const onClick = (e: MouseEvent) => {
      const vrm = vrmRef.current
      if (!vrm || clickCooldownRef.current) return

      const rect = container.getBoundingClientRect()
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast hit test
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
      const intersects = raycaster.intersectObjects(vrm.scene.children, true)

      if (intersects.length > 0) {
        clickCooldownRef.current = true
        // 輪流播放互動表情
        const reactions = CLICK_REACTIONS
        const idx = clickReactionIdxRef.current % reactions.length
        const reaction = reactions[idx]
        clickReactionIdxRef.current++

        transitionExpression(vrm, reaction, 200)
        // 搖頭 / 點頭動畫
        const headBone = vrm.humanoid.getNormalizedBoneNode('head')
        if (headBone) {
          let t = 0
          const headAnim = () => {
            t += 0.12
            if (t < Math.PI * 2) {
              headBone.rotation.y = Math.sin(t * 2) * 0.18
              requestAnimationFrame(headAnim)
            } else {
              headBone.rotation.y = 0
            }
          }
          requestAnimationFrame(headAnim)
        }
        // 2 秒後恢復 happy
        setTimeout(() => {
          transitionExpression(vrm, 'happy', 400)
          clickCooldownRef.current = false
        }, 2000)
      }
    }
    container.addEventListener('click', onClick)

    // ── 陀螺儀（行動裝置） ─────────────────────────────────────────────────
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma != null && e.beta != null) {
        mouseRef.current = {
          x: e.gamma / 45,
          y: e.beta / 45,
        }
      }
    }
    window.addEventListener('deviceorientation', onDeviceOrientation)

    // ── 動畫主迴圈 ─────────────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const delta = clockRef.current.getDelta()
      const elapsed = clockRef.current.elapsedTime

      const vrm = vrmRef.current

      // 眼睛跟隨滑鼠（用 lookAt position 而非 target 物件）
      if (vrm?.lookAt) {
        const targetX = mouseRef.current.x * 0.3
        const targetY = mouseRef.current.y * 0.2
        vrm.lookAt.getLookAtWorldPosition(new THREE.Vector3(targetX, targetY + 1.4, 3))
      }

      // 自動眨眼
      if (vrm?.expressionManager) {
        blinkTimerRef.current += delta
        if (blinkTimerRef.current >= blinkIntervalRef.current) {
          // 眨眼序列
          vrm.expressionManager.setValue('blinkLeft', 1)
          vrm.expressionManager.setValue('blinkRight', 1)
          setTimeout(() => {
            vrm.expressionManager?.setValue('blinkLeft', 0)
            vrm.expressionManager?.setValue('blinkRight', 0)
          }, 120)
          blinkTimerRef.current = 0
          blinkIntervalRef.current = 3 + Math.random() * 4
        }
      }

      // Idle 呼吸動畫
      if (vrm?.humanoid) {
        const chestBone = vrm.humanoid.getNormalizedBoneNode('chest')
        if (chestBone) {
          chestBone.rotation.x = Math.sin(elapsed * 0.8) * 0.015
        }
        const hipsBone = vrm.humanoid.getNormalizedBoneNode('hips')
        if (hipsBone) {
          hipsBone.rotation.z = Math.sin(elapsed * 0.5) * 0.008
        }
      }

      // SpringBone 物理更新
      vrm?.update(delta)

      // 玻璃球漂浮
      if (sphereGroup) {
        sphereGroup.children.forEach((child) => {
          const mesh = child as THREE.Mesh
          mesh.position.y += Math.sin(elapsed * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 0.002
          mesh.rotation.y += delta * 0.1
        })
      }

      // 粒子緩慢旋轉
      if (particles) {
        particles.rotation.y += delta * 0.02
      }

      // 背景玻璃球視差（跟隨滑鼠）
      if (sphereGroup) {
        sphereGroup.rotation.x = THREE.MathUtils.lerp(
          sphereGroup.rotation.x, mouseRef.current.y * 0.05, 0.05
        )
        sphereGroup.rotation.y = THREE.MathUtils.lerp(
          sphereGroup.rotation.y, mouseRef.current.x * 0.05, 0.05
        )
      }

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      const { width, height } = container.getBoundingClientRect()
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('deviceorientation', onDeviceOrientation)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('click', onClick)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [cameraMode, mood, showBackground, onLoad, transitionExpression])

  return (
    <div
      ref={mountRef}
      className={`w-full h-full cursor-pointer ${className}`}
      aria-hidden="true"
    />
  )
}
