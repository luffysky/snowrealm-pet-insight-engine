'use client'

import { useState, useRef, lazy, Suspense } from 'react'
import { Palette, Upload, X, Check, Lock } from 'lucide-react'

// Three.js 背景延遲載入（避免 SSR 問題）
const StarsBg  = lazy(() => import('./ThreeBg').then(m => ({ default: m.StarsBg })))
const GeoBg    = lazy(() => import('./ThreeBg').then(m => ({ default: m.GeoBg })))
const NeonWaveBg = lazy(() => import('./ThreeBg').then(m => ({ default: m.NeonWaveBg })))
const SnowBg   = lazy(() => import('./ThreeBg').then(m => ({ default: m.SnowBg })))

// ── 背景定義 ──────────────────────────────────────────────────────────────────

export type BgId =
  | 'default' | 'ocean' | 'sakura' | 'cyber' | 'forest'
  | 'sunset'  | 'night' | 'amber'  | 'candy' | 'stars'
  | 'geo'     | 'wave'  | 'snow'   | 'custom'
  | 'maple'   | 'blizzard' | 'firefly' | 'aurora' | 'petal' | 'rain'

export interface ChatBgDef {
  id: BgId
  name: string
  emoji: string
  swatch: string        // CSS gradient 用在小色票
  price: number         // 0 = 免費；>0 = Z幣
  isThree?: boolean     // 是否用 Three.js
  marketId?: string     // marketplace_items.id（預留，seed 後填入）
}

export const CHAT_BACKGROUNDS: ChatBgDef[] = [
  { id: 'default',  name: '深空',   emoji: '🌌', swatch: 'linear-gradient(135deg,#0f0f19,#0a0a14)', price: 0 },
  { id: 'ocean',    name: '海洋',   emoji: '🌊', swatch: 'linear-gradient(135deg,#0c3a6e,#0a6e8a)', price: 0 },
  { id: 'sakura',   name: '櫻花',   emoji: '🌸', swatch: 'linear-gradient(135deg,#7b2d5c,#c45c8a)', price: 0 },
  { id: 'cyber',    name: '賽博',   emoji: '🔮', swatch: 'linear-gradient(135deg,#0d0621,#1a0a3e)', price: 0 },
  { id: 'forest',   name: '森林',   emoji: '🌲', swatch: 'linear-gradient(135deg,#0a2910,#0d3d15)', price: 0 },
  { id: 'sunset',   name: '日落',   emoji: '🌅', swatch: 'linear-gradient(135deg,#7c1d2e,#c2460a)', price: 0 },
  { id: 'night',    name: '月夜',   emoji: '🌙', swatch: 'linear-gradient(135deg,#050c2e,#0c1a56)', price: 0 },
  { id: 'amber',    name: '琥珀',   emoji: '💛', swatch: 'linear-gradient(135deg,#3d1f00,#7a3d00)', price: 0 },
  { id: 'candy',    name: '糖果',   emoji: '🩷', swatch: 'linear-gradient(135deg,#3d0a5e,#7a1a82)', price: 0 },
  { id: 'maple',    name: '楓葉',   emoji: '🍁', swatch: 'linear-gradient(135deg,#3d1500,#8b2c00)', price: 0 },
  { id: 'blizzard', name: '暴雪',   emoji: '🌨️', swatch: 'linear-gradient(135deg,#0a1628,#1a2a4a)', price: 0 },
  { id: 'firefly',  name: '螢火蟲', emoji: '✨', swatch: 'linear-gradient(135deg,#010d04,#02180a)', price: 0 },
  { id: 'aurora',   name: '極光',   emoji: '🌈', swatch: 'linear-gradient(135deg,#001a1a,#002a20)', price: 0 },
  { id: 'petal',    name: '花瓣雨', emoji: '🌺', swatch: 'linear-gradient(135deg,#2a0a1e,#4a0a2e)', price: 0 },
  { id: 'rain',     name: '細雨',   emoji: '🌧️', swatch: 'linear-gradient(135deg,#0a0e1a,#0c1428)', price: 0 },
  { id: 'stars',    name: '星空',   emoji: '⭐', swatch: 'linear-gradient(135deg,#020b18,#050d25)', price: 0, isThree: true },
  { id: 'geo',      name: '幾何',   emoji: '🔷', swatch: 'linear-gradient(135deg,#0f0a1e,#1a0a2e)', price: 0, isThree: true },
  { id: 'wave',     name: '霓虹波', emoji: '〰️', swatch: 'linear-gradient(135deg,#000d1a,#001a33)', price: 0, isThree: true },
  { id: 'snow',     name: '雪花',   emoji: '❄️', swatch: 'linear-gradient(135deg,#0a1628,#0d2040)', price: 0, isThree: true },
]

// ── CSS 動態背景元件 ───────────────────────────────────────────────────────────

const CSS_BG_KEYFRAMES = `
@keyframes bgShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes petals{0%{transform:translate(0,0) rotate(0deg);opacity:.8}100%{transform:translate(-40px,120px) rotate(360deg);opacity:0}}
@keyframes cyberGrid{0%,100%{opacity:.4}50%{opacity:.7}}
@keyframes sunsetPulse{0%,100%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(20deg)}}
@keyframes twinkle{0%,100%{opacity:.2}50%{opacity:.9}}
@keyframes bubbleFloat{0%{transform:translateY(0) scale(1);opacity:.6}100%{transform:translateY(-200px) scale(1.1);opacity:0}}
@keyframes mapleLeaf{0%{transform:translate(0,-20px) rotate(0deg);opacity:.9}25%{transform:translate(20px,30vh) rotate(90deg);opacity:.8}50%{transform:translate(-10px,60vh) rotate(180deg);opacity:.7}75%{transform:translate(15px,80vh) rotate(270deg);opacity:.5}100%{transform:translate(-5px,110vh) rotate(360deg);opacity:0}}
@keyframes snowfall{0%{transform:translateY(-10px) translateX(0) rotate(0deg);opacity:.9}25%{transform:translateY(25vh) translateX(8px) rotate(90deg)}50%{transform:translateY(50vh) translateX(-5px) rotate(180deg)}75%{transform:translateY(75vh) translateX(6px) rotate(270deg)}100%{transform:translateY(110vh) translateX(-3px) rotate(360deg);opacity:.3}}
@keyframes fireflyPulse{0%,100%{opacity:0;transform:scale(.5)}40%,60%{opacity:1;transform:scale(1)}}
@keyframes fireflyMove{0%{transform:translate(0,0)}25%{transform:translate(30px,-20px)}50%{transform:translate(-15px,-40px)}75%{transform:translate(20px,-10px)}100%{transform:translate(0,0)}}
@keyframes auroraWave{0%{opacity:.3;transform:skewX(-5deg) scaleY(.9)}50%{opacity:.7;transform:skewX(5deg) scaleY(1.1)}100%{opacity:.3;transform:skewX(-5deg) scaleY(.9)}}
@keyframes petalFall{0%{transform:translate(0,-20px) rotate(0deg) scale(1);opacity:.9}30%{transform:translate(25px,35vh) rotate(120deg) scale(.9)}60%{transform:translate(-10px,65vh) rotate(240deg) scale(.8)}100%{transform:translate(15px,110vh) rotate(380deg) scale(.7);opacity:0}}
@keyframes rainDrop{0%{transform:translateY(-10px);opacity:0}10%{opacity:.6}90%{opacity:.4}100%{transform:translateY(110vh);opacity:0}}
`

function InjectKeyframes() {
  return <style>{CSS_BG_KEYFRAMES}</style>
}

function CssBgLayer({ id }: { id: BgId }) {
  if (id === 'default') return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(15,15,25,0.92) 0%,rgba(10,10,20,0.95) 100%)' }} />
  )
  if (id === 'ocean') return (
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg,#071d3a 0%,#0a3a6e 50%,#071d3a 100%)',
      backgroundSize: '200% 200%',
      animation: 'bgShift 8s ease infinite',
    }} />
  )
  if (id === 'sakura') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#2d0a1e 0%,#5c1a3a 50%,#2d0a1e 100%)' }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="absolute text-lg select-none pointer-events-none" style={{
          left: `${5 + i * 5}%`,
          top: '-20px',
          animation: `petals ${2.5 + i * 0.35}s linear ${i * 0.5}s infinite`,
          fontSize: `${8 + (i % 4) * 4}px`,
        }}>🌸</div>
      ))}
    </div>
  )
  if (id === 'cyber') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#050210' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(120,40,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(120,40,255,0.15) 1px,transparent 1px)',
        backgroundSize: '32px 32px',
        animation: 'cyberGrid 4s ease infinite',
      }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%,rgba(80,0,200,0.3) 0%,transparent 70%)' }} />
    </div>
  )
  if (id === 'forest') return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#050e07 0%,#0a2410 50%,#050e07 100%)' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 70%,rgba(20,80,20,0.4) 0%,transparent 60%)' }} />
    </div>
  )
  if (id === 'sunset') return (
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg,#1a0510 0%,#7c1a1a 35%,#c2460a 65%,#4a0d20 100%)',
      animation: 'sunsetPulse 6s ease infinite',
    }} />
  )
  if (id === 'night') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#020714 0%,#050c2e 60%,#020714 100%)' }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{
          width: `${1 + (i % 3)}px`,
          height: `${1 + (i % 3)}px`,
          left: `${(i * 31 + 7) % 95}%`,
          top: `${(i * 17 + 5) % 70}%`,
          animation: `twinkle ${2 + (i % 3)}s ease ${i * 0.3}s infinite`,
        }} />
      ))}
    </div>
  )
  if (id === 'amber') return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#1a0900 0%,#3d1f00 50%,#1a0900 100%)' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%,rgba(200,100,0,0.25) 0%,transparent 60%)' }} />
    </div>
  )
  if (id === 'candy') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#1a0530 0%,#3d0a5e 50%,#1a0530 100%)' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          width: `${20 + i * 10}px`,
          height: `${20 + i * 10}px`,
          left: `${10 + i * 11}%`,
          bottom: `-${20 + i * 5}px`,
          background: `radial-gradient(circle,rgba(${i % 2 ? '200,60,200' : '140,40,220'},0.35),transparent)`,
          animation: `bubbleFloat ${4 + i * 0.8}s ease ${i * 0.7}s infinite`,
        }} />
      ))}
    </div>
  )
  if (id === 'maple') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#1a0800 0%,#3d1200 40%,#200a00 100%)' }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="absolute select-none pointer-events-none" style={{
          left: `${(i * 6.2 + 3) % 96}%`,
          top: '-40px',
          fontSize: `${12 + (i % 4) * 5}px`,
          animation: `mapleLeaf ${4 + i * 0.45}s linear ${i * 0.55}s infinite`,
          filter: `hue-rotate(${(i % 3) * 15}deg)`,
        }}>🍁</div>
      ))}
    </div>
  )
  if (id === 'blizzard') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#050d1e 0%,#0a1830 50%,#050d1e 100%)' }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute select-none pointer-events-none text-[#3d3155]" style={{
          left: `${(i * 197 + 13) % 100}%`,
          top: '-10px',
          fontSize: `${6 + (i % 4) * 3}px`,
          animation: `snowfall ${2 + (i % 5) * 0.6}s linear ${(i * 0.18) % 3}s infinite`,
          filter: 'blur(0.3px)',
        }}>❄</div>
      ))}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%,rgba(100,150,220,0.08) 0%,transparent 70%)' }} />
    </div>
  )
  if (id === 'firefly') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#010904 0%,#021408 50%,#010904 100%)' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          width: `${3 + (i % 3) * 2}px`,
          height: `${3 + (i % 3) * 2}px`,
          left: `${(i * 23 + 7) % 90}%`,
          top: `${(i * 17 + 15) % 80}%`,
          background: `radial-gradient(circle, rgba(${i % 2 ? '100,255,100' : '180,255,80'},0.9), rgba(50,200,50,0))`,
          boxShadow: `0 0 ${6 + i % 4}px rgba(${i % 2 ? '80,220,80' : '150,240,60'},0.8)`,
          animation: `fireflyPulse ${1.5 + (i % 4) * 0.8}s ease ${i * 0.4}s infinite, fireflyMove ${5 + (i % 5) * 2}s ease ${i * 0.3}s infinite`,
        }} />
      ))}
    </div>
  )
  if (id === 'aurora') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#000d0d 0%,#001a15 50%,#000d0d 100%)' }}>
      {[
        { color: 'rgba(0,220,150,0.22)', delay: '0s', dur: '7s', top: '10%', skew: '-8deg' },
        { color: 'rgba(0,180,255,0.18)', delay: '1.5s', dur: '9s', top: '22%', skew: '4deg' },
        { color: 'rgba(100,50,255,0.15)', delay: '3s', dur: '8s', top: '35%', skew: '-3deg' },
        { color: 'rgba(0,255,180,0.12)', delay: '0.8s', dur: '11s', top: '48%', skew: '7deg' },
      ].map((band, i) => (
        <div key={i} className="absolute w-full pointer-events-none" style={{
          top: band.top,
          height: '120px',
          background: `linear-gradient(180deg, transparent, ${band.color}, transparent)`,
          filter: 'blur(20px)',
          transform: `skewX(${band.skew})`,
          animation: `auroraWave ${band.dur} ease ${band.delay} infinite`,
        }} />
      ))}
    </div>
  )
  if (id === 'petal') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#1a0510 0%,#3d0a25 50%,#1a0510 100%)' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute select-none pointer-events-none" style={{
          left: `${(i * 5 + 2) % 96}%`,
          top: '-30px',
          fontSize: `${10 + (i % 4) * 4}px`,
          animation: `petalFall ${3.5 + i * 0.4}s linear ${i * 0.45}s infinite`,
          opacity: 0.8,
        }}>{i % 3 === 0 ? '🌸' : i % 3 === 1 ? '🌺' : '🌹'}</div>
      ))}
    </div>
  )
  if (id === 'rain') return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#050810 0%,#080e1e 50%,#050810 100%)' }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          left: `${(i * 253 + 7) % 100}%`,
          top: '-10px',
          width: '1px',
          height: `${10 + (i % 4) * 5}px`,
          background: `linear-gradient(180deg, transparent, rgba(140,180,255,${0.3 + (i % 3) * 0.2}), transparent)`,
          animation: `rainDrop ${0.5 + (i % 4) * 0.25}s linear ${(i * 0.07) % 1}s infinite`,
        }} />
      ))}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%,rgba(40,60,120,0.15) 0%,transparent 60%)' }} />
    </div>
  )
  return null
}

// ── 背景渲染主元件 ─────────────────────────────────────────────────────────────

export function ChatBgLayer({ bgId, customUrl }: { bgId: BgId; customUrl?: string }) {
  if (bgId === 'custom' && customUrl) {
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${customUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    )
  }

  const def = CHAT_BACKGROUNDS.find(b => b.id === bgId)
  if (!def) return null

  if (def.isThree) {
    return (
      <Suspense fallback={<div className="absolute inset-0 bg-white/50" />}>
        {bgId === 'stars' && <StarsBg />}
        {bgId === 'geo'   && <GeoBg />}
        {bgId === 'wave'  && <NeonWaveBg />}
        {bgId === 'snow'  && <SnowBg />}
      </Suspense>
    )
  }

  return (
    <>
      <InjectKeyframes />
      <CssBgLayer id={bgId} />
    </>
  )
}

// ── 背景選擇器 ─────────────────────────────────────────────────────────────────

interface BgPickerProps {
  current: BgId
  customUrl?: string
  owned: Set<BgId>
  zcoinBalance: number
  onSelect: (id: BgId) => void
  onUpload: (file: File) => Promise<void>
  onPurchase: (def: ChatBgDef) => Promise<void>
}

export function BgPicker({
  current,
  customUrl,
  owned,
  zcoinBalance,
  onSelect,
  onUpload,
  onPurchase,
}: BgPickerProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [purchasing, setPurchasing] = useState<BgId | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handlePurchase = async (def: ChatBgDef) => {
    setPurchasing(def.id)
    try {
      await onPurchase(def)
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="更換背景"
        className="p-2 rounded-xl text-[#b5a8d0] hover:text-[#8a7ca8] hover:bg-white/6 transition-colors"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white/50/98 backdrop-blur-2xl border border-white/12 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <p className="text-xs font-semibold text-[#3d3155]/70">聊天背景</p>
              <button onClick={() => setOpen(false)} className="text-[#8a7ca8] hover:text-[#3d3155] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 max-h-[480px] overflow-y-auto">
              {/* 自訂上傳 */}
              <div className="mb-3">
                <p className="text-[10px] text-[#8a7ca8] font-medium mb-2 px-1">自訂圖片</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-white/30 hover:bg-[#b8a9e8]/10 transition-colors text-xs text-[#b5a8d0] hover:text-[#3d3155]"
                >
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? '上傳中...' : '從相簿選取'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {current === 'custom' && customUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg shrink-0 ring-2 ring-violet-500"
                      style={{ backgroundImage: `url(${customUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                    <span className="text-[10px] text-[#b5a8d0] flex-1 truncate">自訂背景</span>
                    <Check className="w-3 h-3 text-violet-400" />
                  </div>
                )}
              </div>

              {/* 內建背景 */}
              <p className="text-[10px] text-[#8a7ca8] font-medium mb-2 px-1">內建背景 <span className="text-emerald-400">全部免費</span></p>
              <div className="grid grid-cols-4 gap-2">
                {CHAT_BACKGROUNDS.map(def => {
                  const isOwned = true  // All backgrounds are now free
                  const isActive = current === def.id
                  const isBuying = purchasing === def.id

                  return (
                    <div key={def.id} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => { onSelect(def.id); setOpen(false) }}
                        disabled={isBuying}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden transition-all ${
                          isActive ? 'ring-2 ring-violet-400 scale-105' : 'hover:scale-105 hover:ring-1 hover:ring-white/30'
                        }`}
                      >
                        <div className="w-full h-full" style={{ background: def.swatch }} />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Check className="w-4 h-4 text-[#3d3155]" />
                          </div>
                        )}
                        {def.isThree && (
                          <div className="absolute top-1 right-1 text-[8px] bg-black/40 rounded px-0.5">3D</div>
                        )}
                      </button>
                      <span className="text-[9px] text-[#8a7ca8] truncate w-14 text-center leading-tight">
                        {def.emoji} {def.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
