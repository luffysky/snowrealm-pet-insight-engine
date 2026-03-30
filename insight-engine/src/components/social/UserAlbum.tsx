'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, Globe, Lock, X, Loader2, ChevronLeft, ChevronRight,
  Pencil, FolderOpen, Check, GripVertical, Camera, BookImage, FolderInput, MoreHorizontal,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AlbumPhoto {
  id: string
  url: string
  caption: string | null
  is_public: boolean
  display_order: number
  album_id: string | null
  created_at: string
}

interface Album {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  photoCount: number
  coverUrl: string | null
  createdAt: string
}

interface UserAlbumProps {
  userId: string
  isOwner: boolean
  initialPhotos?: { id: string; url: string }[]
}

// ─── Album Name Modal ─────────────────────────────────────────────────────────

function AlbumNameModal({
  initial,
  onConfirm,
  onClose,
}: {
  initial?: Album | null
  onConfirm: (name: string, description: string, isPublic: boolean) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [desc, setDesc] = useState(initial?.description ?? '')
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true)

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">{initial ? '編輯相簿' : '建立相簿'}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/40 block mb-1">相簿名稱</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim(), desc.trim(), isPublic)}
              placeholder="例：2026 旅遊"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/40"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1">描述（選填）</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="相簿描述..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/40"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-white/60">公開相簿</span>
            <button
              onClick={() => setIsPublic(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-amber-500' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-white/40 hover:text-white/60 transition-colors">取消</button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim(), desc.trim(), isPublic)}
            disabled={!name.trim()}
            className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm rounded-xl transition-colors disabled:opacity-40"
          >
            {initial ? '儲存' : '建立'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Move to Album Modal ──────────────────────────────────────────────────────

function MoveToAlbumModal({
  albums,
  onSelect,
  onClose,
}: {
  albums: Album[]
  onSelect: (albumId: string | null) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-sm font-semibold text-white/70">移動到相簿</p>
          <p className="text-xs text-white/30 mt-0.5">選擇目標相簿</p>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
          <button
            onClick={() => onSelect(null)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/60 hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4 text-white/25" />
            </div>
            未分類照片
          </button>
          {albums.map(album => (
            <button
              key={album.id}
              onClick={() => onSelect(album.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/70 hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0">
                {album.coverUrl
                  ? <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><FolderOpen className="w-4 h-4 text-white/20" /></div>
                }
              </div>
              <span className="truncate">{album.name}</span>
              <span className="ml-auto text-white/25 text-xs shrink-0">{album.photoCount}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-white/8">
          <button onClick={onClose} className="w-full px-4 py-3.5 text-sm text-white/30 hover:text-white/60 transition-colors">取消</button>
        </div>
      </div>
    </div>
  )
}

// ─── Photo Detail Modal ───────────────────────────────────────────────────────

function PhotoDetailModal({
  photo,
  isOwner,
  onClose,
  onUpdate,
  onDelete,
}: {
  photo: AlbumPhoto
  isOwner: boolean
  onClose: () => void
  onUpdate: (id: string, patch: Partial<AlbumPhoto>) => void
  onDelete: (id: string) => void
}) {
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [isPublic, setIsPublic] = useState(photo.is_public)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/social/album', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photo.id, caption, isPublic }),
    })
    if (res.ok) {
      onUpdate(photo.id, { caption: caption || null, is_public: isPublic })
      onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> 返回
        </button>
        {isOwner && (
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-xl text-xs hover:bg-amber-500/30 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            儲存
          </button>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center px-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <img src={photo.url} alt={photo.caption ?? ''} className="max-w-full max-h-[55vh] object-contain rounded-2xl" />
      </div>
      {isOwner && (
        <div className="shrink-0 px-4 py-4 space-y-3 bg-slate-950/80 border-t border-white/8" onClick={e => e.stopPropagation()}>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">說明文字</label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="新增說明..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/40"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-white/40" />}
              <span className="text-sm text-white/60">{isPublic ? '公開照片' : '私人照片'}</span>
            </div>
            <button
              onClick={() => setIsPublic(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button
            onClick={() => onDelete(photo.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-xl text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> 刪除這張照片
          </button>
          <p className="text-[11px] text-white/20 text-center">
            {new Date(photo.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}
      {!isOwner && photo.caption && (
        <div className="shrink-0 px-4 py-3 bg-slate-950/80 border-t border-white/8" onClick={e => e.stopPropagation()}>
          <p className="text-sm text-white/60">{photo.caption}</p>
        </div>
      )}
    </div>
  )
}

// ─── Album Detail ─────────────────────────────────────────────────────────────

function AlbumDetail({
  album,
  userId,
  isOwner,
  albums,
  onBack,
  onAlbumUpdated,
}: {
  album: Album
  userId: string
  isOwner: boolean
  albums: Album[]
  onBack: () => void
  onAlbumUpdated: (id: string, patch: Partial<Album>) => void
}) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [detailPhoto, setDetailPhoto] = useState<AlbumPhoto | null>(null)
  const [editAlbum, setEditAlbum] = useState(false)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [dragSrc, setDragSrc] = useState<string | null>(null)
  const [moveModal, setMoveModal] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // album.id === 'all' is the virtual "全部照片" entry — fetch without albumId filter
    const albumParam = album.id !== 'all' ? `&albumId=${album.id}` : ''
    fetch(`/api/admin/social/album?userId=${userId}${albumParam}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.photos) setPhotos(d.photos) })
      .finally(() => setLoading(false))
  }, [userId, album.id])

  const uploadPhotos = useCallback(async (files: File[]) => {
    setUploading(true)
    const newPhotos: AlbumPhoto[] = []
    for (const file of files) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await fetch('/api/upload/media', { method: 'POST', body: fd })
        const upData = await upRes.json() as { url?: string }
        if (!upData.url) continue

        const res = await fetch('/api/admin/social/album', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: upData.url, isPublic: album.isPublic, ...(album.id !== 'all' && { albumId: album.id }) }),
        })
        const data = await res.json() as { photo?: AlbumPhoto }
        if (data.photo) newPhotos.push(data.photo)
      } catch { /* ignore individual failures */ }
    }
    setPhotos(prev => [...newPhotos, ...prev])
    setUploading(false)
  }, [album.id, album.isPublic])

  const deleteSelected = async () => {
    if (!selected.size || !confirm(`確定刪除 ${selected.size} 張照片？`)) return
    const ids = Array.from(selected)
    await fetch(`/api/admin/social/album?ids=${ids.join(',')}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => !selected.has(p.id)))
    setSelected(new Set())
    setSelectionMode(false)
  }

  const moveToAlbum = async (targetAlbumId: string | null) => {
    const ids = Array.from(selected)
    await fetch('/api/admin/social/album', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, albumId: targetAlbumId }),
    })
    if (album.id !== 'all') {
      // In a specific album view, moved-away photos leave this view
      setPhotos(prev => prev.filter(p => !selected.has(p.id)))
    }
    // In 'all' view, photos stay visible — they're just re-categorised
    setSelected(new Set())
    setSelectionMode(false)
    setMoveModal(false)
  }

  const setPrivacySelected = async (isPublic: boolean) => {
    if (!selected.size) return
    const ids = Array.from(selected)
    await fetch('/api/admin/social/album', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, isPublic }),
    })
    setPhotos(prev => prev.map(p => selected.has(p.id) ? { ...p, is_public: isPublic } : p))
    setSelected(new Set())
    setSelectionMode(false)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // (long press removed — use ··· button instead)

  // Drag reorder
  const handleDragStart = (id: string) => { setDragSrc(id) }
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOver(id)
  }
  const handleDrop = async (targetId: string) => {
    if (!dragSrc || dragSrc === targetId) {
      setDragOver(null); setDragSrc(null); return
    }
    const reordered = [...photos]
    const srcIdx = reordered.findIndex(p => p.id === dragSrc)
    const tgtIdx = reordered.findIndex(p => p.id === targetId)
    const [moved] = reordered.splice(srcIdx, 1)
    reordered.splice(tgtIdx, 0, moved)
    const withOrder = reordered.map((p, i) => ({ ...p, display_order: i }))
    setPhotos(withOrder)
    setDragOver(null); setDragSrc(null)
    await fetch('/api/admin/social/album', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reorder: withOrder.map(p => ({ id: p.id, displayOrder: p.display_order })) }),
    })
  }

  const handleSaveAlbum = async (name: string, description: string, isPublic: boolean) => {
    const res = await fetch('/api/admin/social/albums', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: album.id, name, description, isPublic }),
    })
    if (res.ok) {
      onAlbumUpdated(album.id, { name, description, isPublic })
    }
    setEditAlbum(false)
  }

  const updatePhoto = (id: string, patch: Partial<AlbumPhoto>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  const deletePhoto = async (id: string) => {
    if (!confirm('確定刪除這張照片？')) return
    await fetch(`/api/admin/social/album?id=${id}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== id))
    setDetailPhoto(null)
    if (lightboxIdx !== null) setLightboxIdx(null)
  }

  const visiblePhotos = isOwner ? photos : photos.filter(p => p.is_public)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[#6b5fa8] hover:text-[#3d3155] transition-colors p-1 -ml-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#3d3155] truncate">{album.name}</h2>
            {!album.isPublic && <Lock className="w-3 h-3 text-[#8a7ca8]/60 shrink-0" />}
          </div>
          <p className="text-xs text-[#8a7ca8]">{visiblePhotos.length} 張照片</p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <button onClick={() => { setSelectionMode(false); setSelected(new Set()) }} className="text-xs text-[#8a7ca8] hover:text-[#3d3155] px-3 py-1.5 border border-[#b8a9e8]/30 rounded-xl transition-colors">
                取消
              </button>
            ) : (
              <>
                {album.id !== 'all' && (
                  <button onClick={() => setEditAlbum(true)} className="p-1.5 text-[#8a7ca8] hover:text-[#3d3155] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectionMode(true)}
                  className="text-xs text-[#8a7ca8] hover:text-[#3d3155] px-3 py-1.5 border border-[#b8a9e8]/30 rounded-xl transition-colors"
                >
                  選取
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#e8e0ff]/50 border border-[#b8a9e8]/30 rounded-xl text-[#6b5fa8] hover:text-[#3d3155] text-xs transition-colors disabled:opacity-40"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files ?? [])
                      if (files.length) uploadPhotos(files)
                      e.target.value = ''
                    }}
                  />
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  新增
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></div>
      ) : visiblePhotos.length === 0 ? (
        <div className="text-center py-12 text-[#8a7ca8]/60">
          <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">還沒有照片</p>
          {isOwner && <p className="text-xs mt-1">點上方「新增」按鈕加入照片</p>}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {visiblePhotos.map((photo, i) => (
            <div
              key={photo.id}
              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer select-none
                ${dragOver === photo.id ? 'ring-2 ring-amber-400' : ''}
                ${dragSrc === photo.id ? 'opacity-40' : ''}
              `}
              draggable={isOwner && !selectionMode}
              onDragStart={() => handleDragStart(photo.id)}
              onDragOver={e => handleDragOver(e, photo.id)}
              onDrop={() => handleDrop(photo.id)}
              onDragEnd={() => { setDragOver(null); setDragSrc(null) }}
              onClick={() => {
                if (selectionMode) {
                  toggleSelect(photo.id)
                } else {
                  setLightboxIdx(i)
                }
              }}
            >
              <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" draggable={false} />

              {/* Selection checkbox */}
              {selectionMode && (
                <div className={`absolute inset-0 flex items-center justify-center
                  ${selected.has(photo.id) ? 'bg-amber-500/30' : 'bg-black/30'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${selected.has(photo.id) ? 'bg-amber-500 border-amber-400' : 'border-white/60 bg-black/40'}`}
                  >
                    {selected.has(photo.id) && <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />}
                  </div>
                </div>
              )}

              {/* Privacy badge */}
              {isOwner && !selectionMode && !photo.is_public && (
                <div className="absolute top-1 left-1 p-1 bg-black/60 rounded-md">
                  <Lock className="w-2.5 h-2.5 text-white/70" />
                </div>
              )}

              {/* Detail button (owner only, not in selection mode) */}
              {isOwner && !selectionMode && (
                <button
                  onClick={e => { e.stopPropagation(); setDetailPhoto(photo) }}
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-md bg-black/60 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selection action bar */}
      {selectionMode && selected.size > 0 && (
        <div className="fixed bottom-[calc(var(--bnav-h,76px)+0.5rem)] left-4 right-4 z-50 max-w-sm mx-auto">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-white/12 rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-xs text-white/50 text-center mb-2.5">已選 {selected.size} 張</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrivacySelected(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/15 text-emerald-400 rounded-xl text-xs hover:bg-emerald-500/25 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> 公開
              </button>
              <button
                onClick={() => setPrivacySelected(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 text-white/50 rounded-xl text-xs hover:bg-white/10 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" /> 私人
              </button>
              <button
                onClick={() => setMoveModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/15 text-blue-400 rounded-xl text-xs hover:bg-blue-500/25 transition-colors"
              >
                <FolderInput className="w-3.5 h-3.5" /> 移動
              </button>
              <button
                onClick={deleteSelected}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500/15 text-rose-400 rounded-xl text-xs hover:bg-rose-500/25 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> 刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {moveModal && (
        <MoveToAlbumModal
          albums={albums}
          onSelect={moveToAlbum}
          onClose={() => setMoveModal(false)}
        />
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && visiblePhotos[lightboxIdx] && (
        <div className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 p-2 text-white/60 hover:text-white" onClick={() => setLightboxIdx(null)}>
            <X className="w-6 h-6" />
          </button>
          {lightboxIdx > 0 && (
            <button className="absolute left-3 p-2 text-white/60 hover:text-white z-10"
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! - 1) }}>
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {lightboxIdx < visiblePhotos.length - 1 && (
            <button className="absolute right-3 p-2 text-white/60 hover:text-white z-10"
              onClick={e => { e.stopPropagation(); setLightboxIdx(i => i! + 1) }}>
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          <div className="max-w-3xl w-full px-4" onClick={e => e.stopPropagation()}>
            <img src={visiblePhotos[lightboxIdx].url} alt="" className="w-full max-h-[75vh] object-contain rounded-2xl" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/40 text-sm truncate">{visiblePhotos[lightboxIdx].caption ?? ''}</p>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    onClick={() => { setDetailPhoto(visiblePhotos[lightboxIdx!]); setLightboxIdx(null) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/60 hover:text-white rounded-xl text-xs transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> 詳細設定
                  </button>
                )}
                <span className="text-white/20 text-xs shrink-0">{lightboxIdx + 1} / {visiblePhotos.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo detail modal */}
      {detailPhoto && (
        <PhotoDetailModal
          photo={detailPhoto}
          isOwner={isOwner}
          onClose={() => setDetailPhoto(null)}
          onUpdate={updatePhoto}
          onDelete={deletePhoto}
        />
      )}

      {/* Edit album modal */}
      {editAlbum && (
        <AlbumNameModal
          initial={album}
          onConfirm={handleSaveAlbum}
          onClose={() => setEditAlbum(false)}
        />
      )}
    </div>
  )
}

// ─── Album List ───────────────────────────────────────────────────────────────

const ALL_PHOTOS_ALBUM: Album = {
  id: 'all', name: '所有照片', description: null,
  isPublic: true, photoCount: 0, coverUrl: null, createdAt: '',
}

export function UserAlbum({ userId, isOwner }: UserAlbumProps) {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  // Default to all-photos view so users see their photos immediately
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(ALL_PHOTOS_ALBUM)
  const [totalPhotoCount, setTotalPhotoCount] = useState(0)
  const [createModal, setCreateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Album | null>(null)
  const [longPressAlbum, setLongPressAlbum] = useState<Album | null>(null)
  const lpRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/social/albums?userId=${userId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/admin/social/album?userId=${userId}`).then(r => r.ok ? r.json() : null),
    ]).then(([albumsData, photosData]) => {
      if (albumsData?.albums) setAlbums(albumsData.albums)
      if (photosData?.photos) setTotalPhotoCount(photosData.photos.length)
    }).finally(() => setLoading(false))
  }, [userId])

  const createAlbum = async (name: string, description: string, isPublic: boolean) => {
    const res = await fetch('/api/admin/social/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, isPublic }),
    })
    const data = await res.json() as { album?: Album }
    if (data.album) setAlbums(prev => [data.album!, ...prev])
    setCreateModal(false)
  }

  const deleteAlbum = async (album: Album) => {
    await fetch(`/api/admin/social/albums?id=${album.id}`, { method: 'DELETE' })
    setAlbums(prev => prev.filter(a => a.id !== album.id))
    setDeleteConfirm(null)
    setLongPressAlbum(null)
  }

  const updateAlbum = (id: string, patch: Partial<Album>) => {
    setAlbums(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
    if (activeAlbum?.id === id) setActiveAlbum(prev => prev ? { ...prev, ...patch } : prev)
  }

  if (activeAlbum) {
    return (
      <AlbumDetail
        album={activeAlbum}
        userId={userId}
        isOwner={isOwner}
        albums={albums}
        onBack={() => setActiveAlbum(null)}
        onAlbumUpdated={updateAlbum}
      />
    )
  }

  if (!loading && albums.length === 0 && totalPhotoCount === 0 && !isOwner) return null

  // Non-owner with only unassigned photos: skip the album list, go straight to all-photos
  // (activeAlbum is already ALL_PHOTOS_ALBUM by default — this just handles the edge case
  //  where we want the loading state to not flash the album grid)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#8a7ca8] uppercase tracking-wider">相簿</h2>
        {isOwner && (
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e8e0ff]/50 border border-[#b8a9e8]/30 text-[#6b5fa8] hover:text-[#3d3155] hover:bg-[#d8ceff]/50 text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> 建立相簿
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-white/20 animate-spin" /></div>
      ) : albums.length === 0 && totalPhotoCount === 0 ? (
        <div className="text-center py-10 text-[#8a7ca8]/60">
          <BookImage className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">還沒有照片</p>
          {isOwner && <p className="text-xs mt-1">返回「所有照片」上傳你的第一張照片</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* 全部照片入口 */}
          {totalPhotoCount > 0 && (
            <div
              className="relative cursor-pointer"
              onClick={() => setActiveAlbum({ ...ALL_PHOTOS_ALBUM, photoCount: totalPhotoCount })}
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#e8e0ff]/40 border border-[#b8a9e8]/20 flex items-center justify-center">
                <Camera className="w-8 h-8 text-[#b8a9e8]/60" />
              </div>
              <div className="mt-1.5 px-0.5">
                <p className="text-sm text-[#3d3155] font-medium truncate">所有照片</p>
                <p className="text-xs text-[#8a7ca8]">{totalPhotoCount} 張</p>
              </div>
            </div>
          )}
          {albums.map(album => (
            <div
              key={album.id}
              className="relative cursor-pointer"
              onPointerDown={() => {
                if (!isOwner) return
                lpRef.current = setTimeout(() => setLongPressAlbum(album), 600)
              }}
              onPointerUp={() => { if (lpRef.current) clearTimeout(lpRef.current) }}
              onPointerCancel={() => { if (lpRef.current) clearTimeout(lpRef.current) }}
              onPointerMove={() => { if (lpRef.current) clearTimeout(lpRef.current) }}
              onClick={() => {
                if (lpRef.current) clearTimeout(lpRef.current)
                setActiveAlbum(album)
              }}
            >
              {/* Cover */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#e8e0ff]/40 border border-[#b8a9e8]/20">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="w-8 h-8 text-[#b8a9e8]/60" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="mt-1.5 px-0.5">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-[#3d3155] font-medium truncate">{album.name}</p>
                  {!album.isPublic && <Lock className="w-3 h-3 text-[#8a7ca8]/60 shrink-0" />}
                </div>
                <p className="text-xs text-[#8a7ca8]">{album.photoCount} 張</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Long-press album menu */}
      {longPressAlbum && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={() => setLongPressAlbum(null)}>
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-sm font-semibold text-white/70">{longPressAlbum.name}</p>
            </div>
            <div className="divide-y divide-white/5">
              <button
                onClick={() => { setActiveAlbum(longPressAlbum); setLongPressAlbum(null) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/70 hover:bg-white/5 transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-white/40" /> 開啟相簿
              </button>
              <button
                onClick={() => setDeleteConfirm(longPressAlbum)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4" /> 刪除相簿
              </button>
              <button
                onClick={() => setLongPressAlbum(null)}
                className="w-full px-4 py-3.5 text-sm text-white/30 hover:text-white/60 transition-colors text-center"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete album confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[250] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl text-center space-y-3"
            onClick={e => e.stopPropagation()}>
            <p className="text-base font-semibold text-white">刪除「{deleteConfirm.name}」？</p>
            <p className="text-xs text-white/40">相簿和所有照片都會被刪除，無法復原。</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 text-sm text-white/40 hover:text-white/60 border border-white/10 rounded-xl transition-colors">取消</button>
              <button onClick={() => deleteAlbum(deleteConfirm)} className="flex-1 py-2 text-sm bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-xl transition-colors">刪除</button>
            </div>
          </div>
        </div>
      )}

      {createModal && (
        <AlbumNameModal onConfirm={createAlbum} onClose={() => setCreateModal(false)} />
      )}
    </div>
  )
}
