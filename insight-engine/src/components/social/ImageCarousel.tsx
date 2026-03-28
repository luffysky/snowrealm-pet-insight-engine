'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageCarouselProps {
  images: { url: string; alt?: string }[]
  className?: string
  aspectRatio?: 'video' | 'square' | 'auto'
  onImageClick?: (url: string) => void
}

export function ImageCarousel({ images, className = '', aspectRatio = 'auto', onImageClick }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)

  const prev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(c => (c - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrent(c => (c + 1) % images.length)
  }, [images.length])

  if (images.length === 0) return null

  if (images.length === 1) {
    const img = images[0]
    const aspectClass = aspectRatio === 'video' ? 'aspect-video' : aspectRatio === 'square' ? 'aspect-square' : ''
    return (
      <div
        className={`relative overflow-hidden rounded-2xl ${aspectClass} ${className}`}
        onClick={() => onImageClick?.(img.url)}
      >
        <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
      </div>
    )
  }

  const aspectClass = aspectRatio === 'video' ? 'aspect-video' : aspectRatio === 'square' ? 'aspect-square' : 'aspect-[4/3]'

  return (
    <div className={`relative overflow-hidden rounded-2xl select-none ${aspectClass} ${className}`}>
      {/* Images */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)`, width: `${images.length * 100}%` }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className="h-full shrink-0 cursor-zoom-in"
            style={{ width: `${100 / images.length}%` }}
            onClick={() => onImageClick?.(img.url)}
          >
            <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* Prev / Next arrows */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {current < images.length - 1 && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); setCurrent(i) }}
            className={`rounded-full transition-all duration-200 ${
              i === current
                ? 'w-4 h-1.5 bg-white'
                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Counter badge */}
      <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full z-10">
        {current + 1}/{images.length}
      </span>
    </div>
  )
}
