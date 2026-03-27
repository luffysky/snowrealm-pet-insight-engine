'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Globe, Lock, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface AlbumPhoto {
  id: string
  url: string
  caption: string | null
  is_public: boolean
  display_order: number
  created_at: string
}

interface UserAlbumProps {
  userId: string
  isOwner: boolean
  initialPhotos: AlbumPhoto[]
}

export function UserAlbum({ userId, isOwner, initialPhotos }: UserAlbumProps) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadPhoto = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const upRes = await fetch('/api/upload/media', { method: 'POST', body: fd })
      const upData = await upRes.json() as { url?: string; error?: string }
      if (!upData.url) throw new Error(upData.error ?? '上傳失敗')

      const res = await fetch('/api/admin/social/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: upData.url, isPublic: true }),
      })
      const data = await res.json() as { photo?: AlbumPhoto }
      if (data.photo) setPhotos(prev => [data.photo!, ...prev])
    } catch (err) {
      console.error('[UserAlbum] 上傳失敗', err)
      alert('上傳失敗，請重試')
    } finally {
      setUploading(false)
    }
  }, [])

  const togglePrivacy = async (photo: AlbumPhoto) => {
    const newPublic = !photo.is_public
    setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_public: newPublic } : p))
    await fetch('/api/admin/social/album', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photo.id, isPublic: newPublic }),
    })
  }

  const deletePhoto = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/admin/social/album?id=${id}`, { method: 'DELETE' })
      setPhotos(prev => prev.filter(p => p.id !== id))
      if (lightbox !== null) setLightbox(null)
    } finally {
      setDeleting(null)
    }
  }

  const visiblePhotos = isOwner ? photos : photos.filter(p => p.is_public)

  if (visiblePhotos.length === 0 && !isOwner) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">相簿</h2>
        {isOwner && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 text-xs transition-colors disabled:opacity-40"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files ?? [])
                files.forEach(f => uploadPhoto(f))
                e.target.value = ''
              }}
            />
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            上傳照片
          </button>
        )}
      </div>

      {visiblePhotos.length === 0 ? (
        <div className="text-center py-10 text-white/20">
          <p className="text-3xl mb-2">🖼️</p>
          <p className="text-sm">還沒有照片，點上傳添加第一張吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {visiblePhotos.map((photo, i) => (
            <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightbox(i)}>
              <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
              {/* privacy badge */}
              {isOwner && !photo.is_public && (
                <div className="absolute top-1.5 left-1.5 p-1 bg-black/60 rounded-lg">
                  <Lock className="w-3 h-3 text-white/70" />
                </div>
              )}
              {/* owner hover actions */}
              {isOwner && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); togglePrivacy(photo) }}
                    className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                    title={photo.is_public ? '設為私人' : '設為公開'}
                  >
                    {photo.is_public ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deletePhoto(photo.id) }}
                    disabled={deleting === photo.id}
                    className="p-1.5 bg-rose-500/40 rounded-lg text-white hover:bg-rose-500/60 transition-colors disabled:opacity-50"
                  >
                    {deleting === photo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && visiblePhotos[lightbox] && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 p-2 text-white/60 hover:text-white" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>

          {lightbox > 0 && (
            <button
              className="absolute left-4 p-2 text-white/60 hover:text-white"
              onClick={e => { e.stopPropagation(); setLightbox(l => l! - 1) }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {lightbox < visiblePhotos.length - 1 && (
            <button
              className="absolute right-4 p-2 text-white/60 hover:text-white"
              onClick={e => { e.stopPropagation(); setLightbox(l => l! + 1) }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <div className="max-w-3xl w-full px-4" onClick={e => e.stopPropagation()}>
            <img
              src={visiblePhotos[lightbox].url}
              alt={visiblePhotos[lightbox].caption ?? ''}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/50 text-sm">{visiblePhotos[lightbox].caption ?? ''}</p>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <button
                      onClick={() => togglePrivacy(visiblePhotos[lightbox])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white/50 hover:text-white text-xs transition-colors"
                    >
                      {visiblePhotos[lightbox].is_public ? <><Globe className="w-3.5 h-3.5" /> 公開</> : <><Lock className="w-3.5 h-3.5" /> 私人</>}
                    </button>
                    <button
                      onClick={() => deletePhoto(visiblePhotos[lightbox].id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 刪除
                    </button>
                  </>
                )}
                <span className="text-white/20 text-xs">{lightbox + 1} / {visiblePhotos.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
