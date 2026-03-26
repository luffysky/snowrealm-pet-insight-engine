'use client'

import { useState, useRef } from 'react'
import { Search, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ?? ''

interface UnsplashPhoto {
  id: string
  urls: { small: string; regular: string }
  alt_description: string | null
  user: { name: string }
}

interface ImagePickerProps {
  onSelect: (url: string) => void
  onClose: () => void
  onUpload?: (file: File) => Promise<string>
}

export function ImagePicker({ onSelect, onClose, onUpload }: ImagePickerProps) {
  const [tab, setTab] = useState<'upload' | 'unsplash'>('upload')
  const [query, setQuery] = useState('')
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const searchUnsplash = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=12&client_id=${UNSPLASH_ACCESS_KEY}`
      )
      const data = await res.json() as { results: UnsplashPhoto[] }
      setPhotos(data.results)
    } catch {
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (onUpload) {
      setUploading(true)
      try {
        const url = await onUpload(file)
        onSelect(url)
        onClose()
      } catch { /* error handled by parent */ }
      finally { setUploading(false) }
    }
    e.target.value = ''
  }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white/80">新增圖片</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex border-b border-white/10">
        {(['upload', 'unsplash'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? 'text-amber-300 border-b-2 border-amber-400' : 'text-white/40 hover:text-white/70'}`}
          >
            {t === 'upload' ? '上傳 / 網址' : 'Unsplash'}
          </button>
        ))}
      </div>
      <div className="p-3">
        {tab === 'upload' && (
          <div className="space-y-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-white/15 rounded-xl hover:border-amber-400/30 hover:bg-white/3 transition-colors"
            >
              {uploading ? <Loader2 className="w-6 h-6 text-amber-400 animate-spin" /> : <Upload className="w-6 h-6 text-white/30" />}
              <span className="text-xs text-white/40">{uploading ? '上傳中...' : '點擊或拖曳上傳圖片'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="貼上圖片網址"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/40"
              />
              <button
                onClick={() => { if (urlInput.trim()) { onSelect(urlInput.trim()); onClose() } }}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-sm transition-colors"
              >
                確定
              </button>
            </div>
          </div>
        )}
        {tab === 'unsplash' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUnsplash(query)}
                placeholder="搜尋 Unsplash 圖片..."
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/40"
              />
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                {photos.map(p => (
                  <button key={p.id} onClick={() => { onSelect(p.urls.regular); onClose() }}
                    className="rounded-lg overflow-hidden hover:scale-105 transition-transform aspect-square"
                  >
                    <img src={p.urls.small} alt={p.alt_description ?? ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6">
                <ImageIcon className="w-8 h-8 text-white/20" />
                <p className="text-xs text-white/30">輸入關鍵字搜尋</p>
              </div>
            )}
            {!UNSPLASH_ACCESS_KEY && (
              <p className="text-xs text-amber-400/60 text-center">需設定 NEXT_PUBLIC_UNSPLASH_ACCESS_KEY</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
