'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Crop as CropIcon, Palette, Sliders, Check, X, Undo2,
  ZoomIn, ZoomOut, Sun, Contrast, Droplet, Maximize,
  Image as ImageIcon,
} from 'lucide-react'

export interface ImageEditorProps {
  imageUrl: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (blob: Blob, previewUrl: string) => void
  aspectRatio?: number
}

interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  blur: number
  sepia: number
  grayscale: number
}

const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0, grayscale: 0 }

const PRESET_FILTERS = [
  { name: '原圖', adj: { ...DEFAULT_ADJ } },
  { name: '鮮豔', adj: { ...DEFAULT_ADJ, saturation: 130, contrast: 110 } },
  { name: '柔和', adj: { ...DEFAULT_ADJ, brightness: 105, saturation: 90, contrast: 95 } },
  { name: '暖色', adj: { ...DEFAULT_ADJ, hue: 15, saturation: 110 } },
  { name: '冷色', adj: { ...DEFAULT_ADJ, hue: -15, saturation: 90 } },
  { name: '復古', adj: { ...DEFAULT_ADJ, sepia: 40, saturation: 80 } },
  { name: '黑白', adj: { ...DEFAULT_ADJ, grayscale: 100 } },
  { name: '戲劇', adj: { ...DEFAULT_ADJ, contrast: 130, saturation: 120, brightness: 95 } },
]

type AspectKey = 'free' | 'full' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
const ASPECT_OPTIONS: { key: AspectKey; label: string; ratio?: number }[] = [
  { key: 'free', label: '自由' },
  { key: 'full', label: '整圖' },
  { key: '1:1', label: '1:1', ratio: 1 },
  { key: '16:9', label: '16:9', ratio: 16 / 9 },
  { key: '9:16', label: '9:16', ratio: 9 / 16 },
  { key: '4:3', label: '4:3', ratio: 4 / 3 },
  { key: '3:4', label: '3:4', ratio: 3 / 4 },
]

function buildFilter(adj: Adjustments): string {
  return [
    `brightness(${adj.brightness}%)`,
    `contrast(${adj.contrast}%)`,
    `saturate(${adj.saturation}%)`,
    `hue-rotate(${adj.hue}deg)`,
    `blur(${adj.blur}px)`,
    `sepia(${adj.sepia}%)`,
    `grayscale(${adj.grayscale}%)`,
  ].join(' ')
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function toRadians(deg: number) { return (deg * Math.PI) / 180 }
function rotatedSize(w: number, h: number, deg: number) {
  const r = toRadians(deg)
  return { w: Math.abs(Math.cos(r) * w) + Math.abs(Math.sin(r) * h), h: Math.abs(Math.sin(r) * w) + Math.abs(Math.cos(r) * h) }
}

async function renderToBlob(imageSrc: string, crop: PixelCrop | undefined, rotation: number, flipH: boolean, flipV: boolean, adj: Adjustments): Promise<Blob> {
  const img = await loadImage(imageSrc)
  const { w: bw, h: bh } = rotatedSize(img.width, img.height, rotation)

  const base = document.createElement('canvas')
  base.width = bw; base.height = bh
  const bctx = base.getContext('2d')!
  bctx.translate(bw / 2, bh / 2)
  bctx.rotate(toRadians(rotation))
  bctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
  bctx.translate(-img.width / 2, -img.height / 2)
  bctx.drawImage(img, 0, 0)

  const src = crop ? (() => {
    const c = document.createElement('canvas')
    c.width = crop.width; c.height = crop.height
    c.getContext('2d')!.drawImage(base, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
    return c
  })() : base

  const out = document.createElement('canvas')
  out.width = src.width; out.height = src.height
  const octx = out.getContext('2d')!
  octx.filter = buildFilter(adj)
  octx.drawImage(src, 0, 0)

  return new Promise((res, rej) => out.toBlob(b => b ? res(b) : rej(new Error('empty')), 'image/jpeg', 0.9))
}

// Native slider component
function RangeSlider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 appearance-none rounded-full bg-white/10 accent-amber-400 cursor-pointer"
    />
  )
}

export function ImageEditor({ imageUrl, open, onOpenChange, onSave, aspectRatio: initRatio }: ImageEditorProps) {
  const initAspectKey = (): AspectKey => {
    if (!initRatio) return 'free'
    if (initRatio === 1) return '1:1'
    if (Math.abs(initRatio - 16 / 9) < 0.01) return '16:9'
    if (Math.abs(initRatio - 9 / 16) < 0.01) return '9:16'
    if (Math.abs(initRatio - 4 / 3) < 0.01) return '4:3'
    if (Math.abs(initRatio - 3 / 4) < 0.01) return '3:4'
    return 'free'
  }

  const [activeTab, setActiveTab] = useState<'crop' | 'filter' | 'adjust'>('crop')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [adj, setAdj] = useState<Adjustments>({ ...DEFAULT_ADJ })
  const [selectedFilter, setSelectedFilter] = useState(0)
  const [aspectKey, setAspectKey] = useState<AspectKey>(initAspectKey)
  const [processing, setProcessing] = useState(false)

  const currentRatio = aspectKey === 'free' || aspectKey === 'full'
    ? undefined
    : ASPECT_OPTIONS.find(o => o.key === aspectKey)?.ratio

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget
    setImgEl(e.currentTarget)
    if (aspectKey === 'full') { setCrop(undefined); setCompletedCrop({ unit: 'px', x: 0, y: 0, width: nw, height: nh }); return }
    if (currentRatio) {
      setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 100 }, currentRatio, nw, nh), nw, nh))
    } else {
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 })
    }
  }, [aspectKey, currentRatio])

  useEffect(() => {
    if (imgEl && open) {
      const e = { currentTarget: imgEl } as React.SyntheticEvent<HTMLImageElement>
      onImageLoad(e)
    }
  }, [aspectKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    setCrop(undefined); setCompletedCrop(undefined)
    setZoom(1); setRotation(0); setFlipH(false); setFlipV(false)
    setAdj({ ...DEFAULT_ADJ }); setSelectedFilter(0)
    setAspectKey(initAspectKey())
    setActiveTab('crop')
  }, [open, imageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setCrop(undefined); setCompletedCrop(undefined)
    setZoom(1); setRotation(0); setFlipH(false); setFlipV(false)
    setAdj({ ...DEFAULT_ADJ }); setSelectedFilter(0)
    setAspectKey(initAspectKey())
    if (imgEl) onImageLoad({ currentTarget: imgEl } as React.SyntheticEvent<HTMLImageElement>)
  }

  const handleSave = async () => {
    if (aspectKey !== 'full' && (!completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0)) {
      alert('請先設定裁切區域'); return
    }
    setProcessing(true)
    try {
      const blob = await renderToBlob(imageUrl, aspectKey === 'full' ? undefined : completedCrop, rotation, flipH, flipV, adj)
      onSave(blob, URL.createObjectURL(blob))
      onOpenChange(false)
    } catch (e) {
      console.error(e); alert('圖片處理失敗，請重試')
    } finally {
      setProcessing(false)
    }
  }

  if (!open) return null

  const previewStyle: React.CSSProperties = {
    filter: buildFilter(adj),
    transform: `${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`.trim() || 'none',
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ maxHeight: 'min(92vh, 700px)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2 text-white/80">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-semibold">編輯圖片</span>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {([
            { key: 'crop', label: '裁切旋轉', icon: CropIcon },
            { key: 'filter', label: '濾鏡', icon: Palette },
            { key: 'adjust', label: '調整', icon: Sliders },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${activeTab === key ? 'text-amber-300 border-b-2 border-amber-400 -mb-px' : 'text-white/40 hover:text-white/70'}`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* CROP TAB */}
          {activeTab === 'crop' && (
            <div className="space-y-4">
              <div className="relative bg-black/60 rounded-xl overflow-auto" style={{ minHeight: 160, maxHeight: 280 }}>
                {aspectKey === 'full' ? (
                  <div className="w-full h-full flex items-center justify-center p-4 min-h-[200px]">
                    <img src={imageUrl} alt="" className="max-w-full max-h-[300px] object-contain"
                      style={{ filter: buildFilter(adj), transform: `${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''} rotate(${rotation}deg)`.trim() || 'none' }}
                    />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2">
                      <span className="bg-black/70 text-white/60 text-xs px-2 py-1 rounded-lg">整張圖片模式</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 w-max mx-auto">
                    <ReactCrop crop={crop} onChange={(_, pct) => setCrop(pct)}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={currentRatio}
                      locked={aspectKey !== 'free'}
                    >
                      <img ref={setImgEl} src={imageUrl} alt="" onLoad={onImageLoad}
                        style={{ maxWidth: 'none', width: 'auto', height: 'auto',
                          transform: `scale(${zoom}) ${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''} rotate(${rotation}deg)`,
                          filter: buildFilter(adj) }}
                      />
                    </ReactCrop>
                  </div>
                )}
              </div>

              {/* Aspect ratio buttons */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                <span className="text-xs text-white/40 self-center mr-1">比例</span>
                {ASPECT_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => setAspectKey(opt.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${aspectKey === opt.key ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-white/5 text-white/50 hover:text-white/80 border border-transparent'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Rotate + flip */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} title="左轉"
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => setRotation(r => (r + 90) % 360)} title="右轉"
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button onClick={() => setFlipH(v => !v)} title="水平翻轉"
                  className={`p-2 rounded-lg text-white/60 hover:text-white transition-colors ${flipH ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 hover:bg-white/10'}`}>
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button onClick={() => setFlipV(v => !v)} title="垂直翻轉"
                  className={`p-2 rounded-lg text-white/60 hover:text-white transition-colors ${flipV ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 hover:bg-white/10'}`}>
                  <FlipVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom */}
              {aspectKey !== 'full' && (
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-white/30 shrink-0" />
                  <RangeSlider value={zoom} min={0.1} max={3} step={0.1} onChange={setZoom} />
                  <ZoomIn className="w-4 h-4 text-white/30 shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* FILTER TAB */}
          {activeTab === 'filter' && (
            <div className="space-y-4">
              <div className="bg-black/60 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 200, maxHeight: 280 }}>
                <img src={imageUrl} alt="" className="max-w-full max-h-[260px] object-contain" style={previewStyle} />
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_FILTERS.map((f, i) => (
                  <button key={f.name} onClick={() => { setSelectedFilter(i); setAdj({ ...f.adj }) }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedFilter === i ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-transparent hover:border-white/20'}`}
                  >
                    <img src={imageUrl} alt={f.name} className="w-full h-full object-cover" style={{ filter: buildFilter(f.adj) }} />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 text-center">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADJUST TAB */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div className="bg-black/60 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: 200, maxHeight: 280 }}>
                <img src={imageUrl} alt="" className="max-w-full max-h-[260px] object-contain" style={previewStyle} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: 'brightness', label: '亮度', icon: Sun, min: 50, max: 150, step: 1, unit: '%' },
                  { key: 'contrast', label: '對比度', icon: Contrast, min: 50, max: 150, step: 1, unit: '%' },
                  { key: 'saturation', label: '飽和度', icon: Droplet, min: 0, max: 200, step: 1, unit: '%' },
                  { key: 'hue', label: '色相', icon: Palette, min: -180, max: 180, step: 1, unit: '°' },
                  { key: 'sepia', label: '復古效果', icon: null, min: 0, max: 100, step: 1, unit: '%' },
                  { key: 'grayscale', label: '黑白效果', icon: null, min: 0, max: 100, step: 1, unit: '%' },
                  { key: 'blur', label: '模糊', icon: Sliders, min: 0, max: 20, step: 0.5, unit: 'px' },
                ] as const).map(({ key, label, icon: Icon, min, max, step, unit }) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-white/60">
                        {Icon && <Icon className="w-3.5 h-3.5" />}{label}
                      </span>
                      <span className="text-xs text-white/40">{adj[key]}{unit}</span>
                    </div>
                    <RangeSlider value={adj[key]} min={min} max={max} step={step}
                      onChange={v => { setAdj(p => ({ ...p, [key]: v })); setSelectedFilter(-1) }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/8 shrink-0">
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
            <Undo2 className="w-4 h-4" /> 重置
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenChange(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
              <X className="w-4 h-4" /> 取消
            </button>
            <button onClick={handleSave} disabled={processing}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-900 transition-colors disabled:opacity-50 shadow-lg"
            >
              <Check className="w-4 h-4" />
              {processing ? '處理中...' : '確定套用'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Use portal to escape any parent transform/overflow that breaks fixed positioning
  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
