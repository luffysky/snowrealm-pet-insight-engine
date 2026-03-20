'use client'

import { useRef, useEffect } from 'react'
import type { SurveyTheme } from '@/types'

/* ── Particle 型別 ─────────────────────────────── */
interface P {
  x: number; y: number; vx: number; vy: number
  size: number; opacity: number; color: string
  rot: number; rotSpd: number; phase: number
}

type DrawFn = (ctx: CanvasRenderingContext2D, p: P) => void

/* ── 繪製函式 ──────────────────────────────────── */
function drawDot(ctx: CanvasRenderingContext2D, p: P) {
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
}

function drawPetal(ctx: CanvasRenderingContext2D, p: P) {
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.beginPath()
  ctx.moveTo(0, -p.size)
  ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.3, p.size * 0.6, p.size * 0.3, 0, p.size)
  ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.3, -p.size * 0.6, -p.size * 0.3, 0, -p.size)
  ctx.fill()
  ctx.restore()
}

function drawBubble(ctx: CanvasRenderingContext2D, p: P) {
  ctx.globalAlpha = p.opacity * 0.6
  ctx.strokeStyle = p.color
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.stroke()
  // 光點
  ctx.globalAlpha = p.opacity * 0.3
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(p.x - p.size * 0.25, p.y - p.size * 0.25, p.size * 0.25, 0, Math.PI * 2)
  ctx.fill()
}

function drawStar(ctx: CanvasRenderingContext2D, p: P) {
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i
    ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size)
    ctx.lineTo(Math.cos(a + Math.PI / 4) * p.size * 0.35, Math.sin(a + Math.PI / 4) * p.size * 0.35)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawRain(ctx: CanvasRenderingContext2D, p: P) {
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.fillRect(p.x, p.y, 1, p.size * 2.5)
}

function drawFirefly(ctx: CanvasRenderingContext2D, p: P) {
  const glowSize = p.size * 3
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize)
  gradient.addColorStop(0, p.color)
  gradient.addColorStop(1, 'transparent')
  ctx.globalAlpha = p.opacity * 0.35
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
}

function drawInkDot(ctx: CanvasRenderingContext2D, p: P) {
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.beginPath()
  // 不規則墨點
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.scale(1, 0.7)
  ctx.arc(0, 0, p.size, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/* ── 配置 ──────────────────────────────────────── */
interface Cfg {
  count: number
  draw: DrawFn
  colors: string[]
  sizeMin: number; sizeMax: number
  vyMin: number; vyMax: number
  vxMin: number; vxMax: number
  opMin: number; opMax: number
  spawn: 'top' | 'bottom' | 'random'
  oscillate?: boolean  // firefly 式脈動
}

function rand(a: number, b: number) { return a + Math.random() * (b - a) }
function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)] }

const CFG: Record<SurveyTheme, Cfg> = {
  default: {
    count: 12, draw: drawDot,
    colors: ['rgba(255,255,255,0.25)', 'rgba(180,180,255,0.2)'],
    sizeMin: 1, sizeMax: 2, vyMin: -0.2, vyMax: -0.05, vxMin: -0.08, vxMax: 0.08,
    opMin: 0.08, opMax: 0.25, spawn: 'bottom',
  },
  game: {
    count: 16, draw: drawStar,
    colors: ['rgba(255,200,50,0.55)', 'rgba(255,180,80,0.45)', 'rgba(255,220,100,0.35)'],
    sizeMin: 2, sizeMax: 4, vyMin: -0.3, vyMax: -0.08, vxMin: -0.12, vxMax: 0.12,
    opMin: 0.2, opMax: 0.5, spawn: 'bottom',
  },
  cyber: {
    count: 22, draw: drawRain,
    colors: ['rgba(0,200,255,0.35)', 'rgba(128,0,255,0.25)', 'rgba(0,255,200,0.25)'],
    sizeMin: 2, sizeMax: 8, vyMin: 1.5, vyMax: 4, vxMin: 0, vxMax: 0,
    opMin: 0.1, opMax: 0.35, spawn: 'top',
  },
  ancient: {
    count: 10, draw: drawInkDot,
    colors: ['rgba(180,130,60,0.25)', 'rgba(120,80,30,0.2)'],
    sizeMin: 2, sizeMax: 5, vyMin: -0.08, vyMax: 0.08, vxMin: -0.06, vxMax: 0.06,
    opMin: 0.08, opMax: 0.2, spawn: 'random',
  },
  sakura: {
    count: 20, draw: drawPetal,
    colors: ['rgba(255,180,200,0.55)', 'rgba(255,150,180,0.45)', 'rgba(255,200,215,0.4)'],
    sizeMin: 3, sizeMax: 7, vyMin: 0.3, vyMax: 0.9, vxMin: -0.3, vxMax: 0.5,
    opMin: 0.25, opMax: 0.55, spawn: 'top',
  },
  ocean: {
    count: 16, draw: drawBubble,
    colors: ['rgba(0,200,255,0.4)', 'rgba(0,255,200,0.3)', 'rgba(100,200,255,0.35)'],
    sizeMin: 2, sizeMax: 7, vyMin: -0.6, vyMax: -0.15, vxMin: -0.08, vxMax: 0.08,
    opMin: 0.2, opMax: 0.5, spawn: 'bottom',
  },
  forest: {
    count: 14, draw: drawFirefly,
    colors: ['rgba(180,255,100,0.6)', 'rgba(150,255,80,0.5)', 'rgba(200,255,120,0.5)'],
    sizeMin: 1.5, sizeMax: 3, vyMin: -0.12, vyMax: 0.12, vxMin: -0.1, vxMax: 0.1,
    opMin: 0.15, opMax: 0.65, spawn: 'random', oscillate: true,
  },
  candy: {
    count: 14, draw: drawDot,
    colors: ['rgba(255,100,200,0.35)', 'rgba(100,200,255,0.35)', 'rgba(255,200,100,0.35)', 'rgba(100,255,200,0.3)', 'rgba(200,100,255,0.35)'],
    sizeMin: 2, sizeMax: 5, vyMin: -0.25, vyMax: -0.08, vxMin: -0.12, vxMax: 0.12,
    opMin: 0.15, opMax: 0.4, spawn: 'bottom',
  },
  noir: {
    count: 6, draw: drawDot,
    colors: ['rgba(255,255,255,0.1)'],
    sizeMin: 0.5, sizeMax: 1.5, vyMin: -0.06, vyMax: 0.06, vxMin: -0.04, vxMax: 0.04,
    opMin: 0.03, opMax: 0.1, spawn: 'random',
  },
}

/* ── 初始化單一粒子 ──────────────────────────────── */
function initP(p: P, w: number, h: number, cfg: Cfg, randomY = false) {
  p.size = rand(cfg.sizeMin, cfg.sizeMax)
  p.color = pick(cfg.colors)
  p.vx = rand(cfg.vxMin, cfg.vxMax)
  p.vy = rand(cfg.vyMin, cfg.vyMax)
  p.opacity = rand(cfg.opMin, cfg.opMax)
  p.rot = Math.random() * Math.PI * 2
  p.rotSpd = (Math.random() - 0.5) * 0.02
  p.phase = Math.random() * Math.PI * 2
  p.x = Math.random() * w

  if (randomY) {
    p.y = Math.random() * h
  } else if (cfg.spawn === 'top') {
    p.y = -rand(10, 40)
  } else if (cfg.spawn === 'bottom') {
    p.y = h + rand(10, 40)
  } else {
    p.y = Math.random() * h
  }
}

/* ── Canvas 元件 ─────────────────────────────────── */
export function ParticleCanvas({ theme }: { theme: SurveyTheme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cfg = CFG[theme]
    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    // 建立粒子池
    const pool: P[] = Array.from({ length: cfg.count }, () => {
      const p: P = { x: 0, y: 0, vx: 0, vy: 0, size: 0, opacity: 0, color: '', rot: 0, rotSpd: 0, phase: 0 }
      initP(p, w, h, cfg, true)
      return p
    })

    let raf: number

    function animate() {
      ctx!.clearRect(0, 0, w, h)
      for (const p of pool) {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.rotSpd
        p.phase += 0.02

        // 螢火蟲脈動
        if (cfg.oscillate) {
          p.opacity = cfg.opMin + (cfg.opMax - cfg.opMin) * ((Math.sin(p.phase) + 1) / 2)
        }

        // 出界重生
        const margin = 50
        if (p.y > h + margin || p.y < -margin || p.x < -margin || p.x > w + margin) {
          initP(p, w, h, cfg, false)
        }

        cfg.draw(ctx!, p)
      }
      ctx!.globalAlpha = 1
      raf = requestAnimationFrame(animate)
    }

    animate()

    const onResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}
