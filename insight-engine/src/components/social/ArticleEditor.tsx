'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { nanoid } from 'nanoid'
import { GripVertical, X, FileText, Image as ImageIcon } from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { ImagePicker } from './ImagePicker'

export interface ArticleBlock {
  id: string
  type: 'text' | 'image' | 'image-text' | 'text-image'
  textContent?: string
  imageUrl?: string
  imageCaption?: string
  textContent2?: string
}

interface ArticleEditorProps {
  blocks: ArticleBlock[]
  onChange: (blocks: ArticleBlock[]) => void
  onUpload: (file: File) => Promise<string>
}

// --- Single block component ---
function SortableBlock({ block, onChange, onDelete, onUpload }: {
  block: ArticleBlock
  onChange: (updated: ArticleBlock) => void
  onDelete: () => void
  onUpload: (file: File) => Promise<string>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showImagePicker2, setShowImagePicker2] = useState(false)

  const ImageSection = ({ onPick, showPicker, onToggle }: { onPick: (url: string) => void; showPicker: boolean; onToggle: () => void }) => (
    <div className="relative">
      {block.imageUrl && !showPicker ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={block.imageUrl} alt={block.imageCaption ?? ''} className="w-full object-cover max-h-48" />
          <button onClick={onToggle} className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg text-white/70 hover:text-white text-xs">
            換圖
          </button>
        </div>
      ) : (
        <div className="relative">
          <button onClick={onToggle} className="w-full h-24 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-1 text-white/30 hover:text-white/50 hover:border-white/25 transition-colors">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">點擊選擇圖片</span>
          </button>
          {showPicker && (
            <div className="absolute top-full left-0 mt-1 z-20">
              <ImagePicker onSelect={url => { onPick(url); onToggle() }} onClose={onToggle} onUpload={onUpload} />
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div ref={setNodeRef} style={style} className="group relative flex gap-2">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-2 p-1 text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Block content */}
      <div className="flex-1 bg-white/[0.03] border border-white/8 rounded-xl p-3 space-y-2">
        {/* Delete */}
        <button onClick={onDelete} className="absolute top-2 right-2 p-1 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>

        {block.type === 'text' && (
          <RichTextEditor
            content={block.textContent ?? ''}
            onChange={html => onChange({ ...block, textContent: html })}
            placeholder="輸入文字..."
          />
        )}

        {block.type === 'image' && (
          <div className="space-y-2">
            <ImageSection
              onPick={url => onChange({ ...block, imageUrl: url })}
              showPicker={showImagePicker}
              onToggle={() => setShowImagePicker(s => !s)}
            />
            <input
              value={block.imageCaption ?? ''}
              onChange={e => onChange({ ...block, imageCaption: e.target.value })}
              placeholder="圖片說明（選填）"
              className="w-full px-3 py-1.5 bg-transparent border border-white/8 rounded-lg text-xs text-white/50 placeholder-white/20 outline-none focus:border-white/20"
            />
          </div>
        )}

        {(block.type === 'image-text' || block.type === 'text-image') && (
          <div className="grid grid-cols-2 gap-3">
            {block.type === 'image-text' ? (
              <>
                <ImageSection
                  onPick={url => onChange({ ...block, imageUrl: url })}
                  showPicker={showImagePicker}
                  onToggle={() => setShowImagePicker(s => !s)}
                />
                <RichTextEditor
                  content={block.textContent ?? ''}
                  onChange={html => onChange({ ...block, textContent: html })}
                  placeholder="右側文字..."
                />
              </>
            ) : (
              <>
                <RichTextEditor
                  content={block.textContent ?? ''}
                  onChange={html => onChange({ ...block, textContent: html })}
                  placeholder="左側文字..."
                />
                <ImageSection
                  onPick={url => onChange({ ...block, imageUrl: url })}
                  showPicker={showImagePicker2}
                  onToggle={() => setShowImagePicker2(s => !s)}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// --- HTML conversion utilities ---

export function blocksToHtml(blocks: ArticleBlock[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'text':
        return block.textContent ?? ''
      case 'image':
        return `<figure class="article-block-image">${
          block.imageUrl ? `<img src="${block.imageUrl}" alt="${block.imageCaption ?? ''}" style="border-radius:12px;max-width:100%;object-fit:cover;max-height:320px" />` : ''
        }${
          block.imageCaption ? `<figcaption style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;text-align:center">${block.imageCaption}</figcaption>` : ''
        }</figure>`
      case 'image-text':
        return `<div class="article-block-image-text" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">${
          block.imageUrl ? `<figure><img src="${block.imageUrl}" style="border-radius:12px;width:100%;object-fit:cover;max-height:200px" /></figure>` : '<figure></figure>'
        }<div>${block.textContent ?? ''}</div></div>`
      case 'text-image':
        return `<div class="article-block-text-image" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start"><div>${
          block.textContent ?? ''
        }</div>${
          block.imageUrl ? `<figure><img src="${block.imageUrl}" style="border-radius:12px;width:100%;object-fit:cover;max-height:200px" /></figure>` : '<figure></figure>'
        }</div>`
      default:
        return ''
    }
  }).filter(Boolean).join('\n')
}

/** Parse content that may be JSON blocks or plain HTML */
export function parseArticleContent(content: string): string {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return blocksToHtml(parsed as ArticleBlock[])
    }
  } catch { /* not JSON, treat as HTML */ }
  return content
}

// --- Main editor ---
const BLOCK_TYPES: { type: ArticleBlock['type']; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: '文字段落', icon: <FileText className="w-3.5 h-3.5" /> },
  { type: 'image', label: '圖片', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { type: 'image-text', label: '圖文左', icon: <span className="text-xs">📐</span> },
  { type: 'text-image', label: '圖文右', icon: <span className="text-xs">📐</span> },
]

export function ArticleEditor({ blocks, onChange, onUpload }: ArticleEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const addBlock = (type: ArticleBlock['type']) => {
    onChange([...blocks, { id: nanoid(), type }])
  }

  const updateBlock = useCallback((id: string, updated: ArticleBlock) => {
    onChange(blocks.map(b => b.id === id ? updated : b))
  }, [blocks, onChange])

  const deleteBlock = useCallback((id: string) => {
    onChange(blocks.filter(b => b.id !== id))
  }, [blocks, onChange])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIdx = blocks.findIndex(b => b.id === active.id)
      const newIdx = blocks.findIndex(b => b.id === over.id)
      onChange(arrayMove(blocks, oldIdx, newIdx))
    }
  }

  return (
    <div className="space-y-3">
      {/* Block list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map(block => (
              <SortableBlock
                key={block.id}
                block={block}
                onChange={updated => updateBlock(block.id, updated)}
                onDelete={() => deleteBlock(block.id)}
                onUpload={onUpload}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="text-xs text-white/30 self-center">+ 新增區塊</span>
        {BLOCK_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/50 hover:text-white/80 hover:bg-white/8 transition-colors"
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  )
}
