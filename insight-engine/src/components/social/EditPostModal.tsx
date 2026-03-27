'use client'

import { useState, useCallback } from 'react'
import { X, Save, Loader2, Globe, Lock, Tag } from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import type { SocialPost } from '@/lib/socialEngine'

interface EditPostModalProps {
  post: SocialPost
  onClose: () => void
  onSaved: (updated: SocialPost) => void
}

export function EditPostModal({ post, onClose, onSaved }: EditPostModalProps) {
  const [content, setContent] = useState(post.content)
  const [title, setTitle] = useState(post.title ?? '')
  const [tags, setTags] = useState<string[]>(post.tags)
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(post.isPublic)
  const [saving, setSaving] = useState(false)

  const isArticle = post.type === 'article'

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/social/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content,
          tags,
          isPublic,
        }),
      })
      if (res.ok) {
        onSaved({ ...post, title: title.trim() || null, content, tags, isPublic, updatedAt: new Date().toISOString() })
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }, [post, title, content, tags, isPublic, onSaved, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h3 className="text-base font-semibold text-white/90">編輯{isArticle ? '文章' : '貼文'}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPublic(s => !s)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                isPublic ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 text-white/30'
              }`}
            >
              {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? '公開' : '私密'}
            </button>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isArticle && (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="文章標題..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-base font-semibold text-white placeholder-white/20 outline-none focus:border-amber-400/30"
            />
          )}

          {isArticle ? (
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="編輯文章內容..."
            />
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-amber-400/30 resize-none"
            />
          )}

          {/* Tags */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-400/20 rounded-full text-xs text-amber-300">
                  #{t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-amber-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-white/20" />
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                placeholder="新增標籤（Enter 確認）"
                className="flex-1 text-sm text-white/60 bg-transparent outline-none placeholder-white/20"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/8 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors">取消</button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            儲存
          </button>
        </div>
      </div>
    </div>
  )
}
