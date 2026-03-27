'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? 'wZFuRFTOarVmK5csuetJgRaxqQcRV7iS'
const GIFS_PER_PAGE = 12

interface GifResult {
  id: string
  images: {
    fixed_height_small: { url: string; width: string; height: string }
    original: { url: string }
  }
  title: string
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void
  onClose: () => void
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifResult[]>([])
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchGifs = async (q: string, off: number) => {
    setLoading(true)
    try {
      const endpoint = q.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${GIFS_PER_PAGE}&offset=${off}&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${GIFS_PER_PAGE}&offset=${off}&rating=g`
      const res = await fetch(endpoint)
      const data = await res.json() as { data: GifResult[]; pagination: { total_count: number } }
      setGifs(data.data)
      setHasMore((off + GIFS_PER_PAGE) < data.pagination.total_count)
    } catch {
      setGifs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGifs('', 0) }, [])

  const handleSearch = (q: string) => {
    setQuery(q)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => { setOffset(0); fetchGifs(q, 0) }, 400)
  }

  const prev = () => { const o = Math.max(0, offset - GIFS_PER_PAGE); setOffset(o); fetchGifs(query, o) }
  const next = () => { const o = offset + GIFS_PER_PAGE; setOffset(o); fetchGifs(query, o) }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white/80">GIF</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="搜尋 GIF..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/40"
          />
        </div>
      </div>
      <div className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {gifs.map(gif => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.original.url)}
                className="rounded-lg overflow-hidden hover:scale-105 transition-transform aspect-square"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        {!loading && gifs.length === 0 && (
          <p className="text-center text-white/30 text-sm py-4">找不到 GIF</p>
        )}
      </div>
      <div className="flex items-center justify-between px-3 pb-3">
        <button onClick={prev} disabled={offset === 0} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors">
          <ChevronLeft className="w-4 h-4" /> 上一頁
        </button>
        <span className="text-xs text-white/20">{Math.floor(offset/GIFS_PER_PAGE)+1}</span>
        <button onClick={next} disabled={!hasMore} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors">
          下一頁 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
