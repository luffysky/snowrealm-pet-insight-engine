'use client'

import { useEffect, useState, useCallback } from 'react'

type FileType = 'all' | 'image' | 'video' | 'document'
type FileStatus = 'all' | 'pending' | 'approved' | 'flagged' | 'removed'

interface FileMeta {
  id: string
  user_id: string
  file_path: string
  file_type: string
  file_size: number | null
  ai_moderation_status: string
  created_at: string
  nickname: string | null
  display_name: string | null
}

const STATUS_CLS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  flagged: 'bg-orange-500/20 text-orange-400',
  removed: 'bg-red-500/20 text-red-400',
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function isImage(fileType: string) { return fileType.startsWith('image/') }
function isVideo(fileType: string) { return fileType.startsWith('video/') }

export default function FilesPage() {
  const [files, setFiles] = useState<FileMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [type, setType] = useState<FileType>('all')
  const [status, setStatus] = useState<FileStatus>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/super-admin/files?type=${type}&status=${status}&page=${page}`)
      .then(r => r.json())
      .then(d => { setFiles(d.files ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [type, status, page])

  useEffect(() => { load() }, [load])

  async function deleteFile(id: string) {
    if (!confirm('確定要刪除這個檔案？')) return
    setDeleting(id)
    try {
      await fetch(`/api/super-admin/files?fileId=${id}`, { method: 'DELETE' })
      setFiles(prev => prev.filter(f => f.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📁 檔案管理</h1>

      {/* 篩選 */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
          {(['all', 'image', 'video', 'document'] as FileType[]).map(t => (
            <button key={t} onClick={() => { setType(t); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${type === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {t === 'all' ? '全部' : t === 'image' ? '🖼️ 圖片' : t === 'video' ? '🎬 影片' : '📄 文件'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
          {(['all', 'pending', 'approved', 'flagged', 'removed'] as FileStatus[]).map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${status === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {s === 'all' ? '全部狀態' : s === 'pending' ? '待審核' : s === 'approved' ? '已通過' : s === 'flagged' ? '⚠️ 標記' : '已刪除'}
            </button>
          ))}
        </div>
      </div>

      {/* 預覽 Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="max-w-3xl max-h-[80vh] relative" onClick={e => e.stopPropagation()}>
            {preview.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="預覽" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            ) : (
              <video src={preview.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-xl" />
            )}
            <button onClick={() => setPreview(null)} className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-white/50 animate-pulse">載入檔案列表...</p>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead><tr className="border-b border-slate-800 text-white/40 text-xs">
                <th className="text-left px-4 py-2">預覽</th>
                <th className="text-left px-4 py-2">檔案</th>
                <th className="text-left px-4 py-2">類型</th>
                <th className="text-right px-4 py-2">大小</th>
                <th className="text-left px-4 py-2">上傳者</th>
                <th className="text-left px-4 py-2">AI 審核</th>
                <th className="text-left px-4 py-2">時間</th>
                <th className="text-left px-4 py-2">操作</th>
              </tr></thead>
              <tbody>
                {files.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-white/30 py-8">無檔案記錄</td></tr>
                ) : files.map(f => (
                  <tr key={f.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-2.5">
                      {isImage(f.file_type) ? (
                        <button onClick={() => setPreview({ url: f.file_path, type: 'image' })}
                          className="w-24 h-24 bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.file_path} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </button>
                      ) : isVideo(f.file_type) ? (
                        <div className="relative group cursor-pointer" onClick={() => setPreview({ url: f.file_path, type: 'video' })}>
                          <video
                            src={f.file_path}
                            muted
                            preload="metadata"
                            className="w-40 h-24 rounded-lg bg-black object-contain"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/50 transition-colors">
                            <span className="text-white text-2xl">▶</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-xl">📄</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-white/60 text-xs font-mono max-w-[160px] truncate">{f.file_path.split('/').pop()}</td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{f.file_type}</td>
                    <td className="px-4 py-2.5 text-right text-white/40 text-xs">{formatSize(f.file_size)}</td>
                    <td className="px-4 py-2.5 text-white/70 text-xs">{f.nickname || f.display_name || f.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLS[f.ai_moderation_status] ?? 'bg-slate-700 text-slate-400'}`}>
                        {f.ai_moderation_status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-white/40 text-xs">{new Date(f.created_at).toLocaleDateString('zh-TW')}</td>
                    <td className="px-4 py-2.5">
                      <button
                        disabled={deleting === f.id || f.ai_moderation_status === 'removed'}
                        onClick={() => deleteFile(f.id)}
                        className="text-xs text-red-400 hover:underline disabled:opacity-30"
                      >
                        {deleting === f.id ? '…' : '刪除'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm bg-slate-800 text-white/60 rounded-lg disabled:opacity-30">上一頁</button>
          <span className="text-sm text-white/40">{page} / {totalPages}（共 {total} 筆）</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm bg-slate-800 text-white/60 rounded-lg disabled:opacity-30">下一頁</button>
        </div>
      )}
    </div>
  )
}
