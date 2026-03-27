'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  thumbnail?: string | null
  className?: string
}

export function VideoPlayer({ src, thumbnail, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  // Lazy load: only load video when it enters the viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoaded(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Pause when out of view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting && videoRef.current) {
          videoRef.current.pause()
          setPlaying(false)
        }
      },
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleTimeUpdate() {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  function handleLoadedMetadata() {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
  }

  async function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      await v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
    setProgress(pct * 100)
  }

  function handleEnded() {
    setPlaying(false)
    setProgress(0)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const currentTime = duration ? (progress / 100) * duration : 0

  return (
    <div ref={containerRef} className={`relative bg-black rounded-xl overflow-hidden group ${className}`}>
      {/* Thumbnail overlay before load */}
      {!loaded && thumbnail && (
        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
      )}

      {loaded && (
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          muted={muted}
          playsInline
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          poster={thumbnail ?? undefined}
        />
      )}

      {/* Play button overlay (center) */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-14 h-14 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </button>
      )}

      {/* Controls bar */}
      {loaded && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          {/* Seek bar */}
          <div
            className="h-1 bg-white/20 rounded-full mb-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white rounded-full pointer-events-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white hover:text-white/70 transition-colors">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-white/50 text-xs font-mono">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
            <div className="flex-1" />
            <button onClick={toggleMute} className="text-white hover:text-white/70 transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
