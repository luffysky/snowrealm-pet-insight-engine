'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { EditorContent } from '@tiptap/react'
import BubbleMenuExtension, { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import HardBreak from '@tiptap/extension-hard-break'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Gapcursor from '@tiptap/extension-gapcursor'
import Dropcursor from '@tiptap/extension-dropcursor'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import Focus from '@tiptap/extension-focus'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import ListItem from '@tiptap/extension-list-item'
import BulletList from '@tiptap/extension-bullet-list'
import Suggestion from '@tiptap/suggestion'
import { Extension, Node } from '@tiptap/core'
import { getSuggestionItems, renderItems } from './suggestion'
import AiBubbleMenu from './AiBubbleMenu'
import { useTipTapContent } from '@/hooks/useTipTapContent'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  List as ListIcon, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon, Undo, Redo,
  Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  FileCode, Minus, Type, CheckSquare, Indent, Outdent,
  Video, Music, Search, X, Plus, Trash2, Columns, Rows, Merge, Split,
  ChevronDown, Loader2, GripVertical,
} from 'lucide-react'

// ─── Custom Extensions ─────────────────────────────────────────────────────

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize?.replace(/['"]+/g, ''),
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => chain().updateAttributes('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }: any) => chain().updateAttributes('textStyle', { fontSize: null }).run(),
    } as any
  },
})

const FontWeight = Extension.create({
  name: 'fontWeight',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontWeight: {
          default: null,
          parseHTML: el => el.style.fontWeight?.replace(/['"]+/g, ''),
          renderHTML: attrs => attrs.fontWeight ? { style: `font-weight: ${attrs.fontWeight}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontWeight: (fontWeight: string) => ({ chain }: any) => chain().updateAttributes('textStyle', { fontWeight }).run(),
      unsetFontWeight: () => ({ chain }: any) => chain().updateAttributes('textStyle', { fontWeight: null }).run(),
    } as any
  },
})

const FontFamilyExt = Extension.create({
  name: 'fontFamily',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontFamily: {
          default: null,
          parseHTML: el => {
            const ff = el.style.fontFamily
            if (!ff) return null
            return ff.replace(/['"]/g, '').split(',')[0].trim()
          },
          renderHTML: attrs => {
            if (!attrs.fontFamily) return {}
            const fallbacks: Record<string, string> = {
              'Noto Sans TC': '"Noto Sans TC", system-ui, sans-serif',
              'Noto Serif TC': '"Noto Serif TC", serif',
              'LXGW WenKai': '"LXGW WenKai", "Noto Serif TC", serif',
            }
            const fv = fallbacks[attrs.fontFamily] ?? `"${attrs.fontFamily}"`
            return { style: `font-family: ${fv}` }
          },
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontFamily: (fontFamily: string) => ({ chain }: any) => chain().updateAttributes('textStyle', { fontFamily }).run(),
      unsetFontFamily: () => ({ chain }: any) => chain().updateAttributes('textStyle', { fontFamily: null }).run(),
    } as any
  },
})

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() { return { types: ['heading', 'paragraph'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: el => el.style.lineHeight || null,
          renderHTML: attrs => attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }: any) =>
        this.options.types.every((type: string) => commands.updateAttributes(type, { lineHeight })),
      unsetLineHeight: () => ({ commands }: any) =>
        this.options.types.every((type: string) => commands.resetAttributes(type, 'lineHeight')),
    } as any
  },
})

const LetterSpacing = Extension.create({
  name: 'letterSpacing',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        letterSpacing: {
          default: null,
          parseHTML: el => el.style.letterSpacing?.replace(/['"]+/g, '') || null,
          renderHTML: attrs => attrs.letterSpacing ? { style: `letter-spacing: ${attrs.letterSpacing}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setLetterSpacing: (letterSpacing: string) => ({ chain }: any) => chain().updateAttributes('textStyle', { letterSpacing }).run(),
      unsetLetterSpacing: () => ({ chain }: any) => chain().updateAttributes('textStyle', { letterSpacing: null }).run(),
    } as any
  },
})

const IndentExtension = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        indent: {
          default: 0,
          parseHTML: el => parseInt(el.style.paddingLeft || '0', 10) / 40,
          renderHTML: attrs => !attrs.indent ? {} : { style: `padding-left: ${attrs.indent * 40}px` },
        },
      },
    }]
  },
  addCommands() {
    return {
      indent: () => ({ state, dispatch }: any) => {
        const { $from, $to } = state.selection
        state.doc.nodesBetween($from.pos, $to.pos, (node: any, pos: number) => {
          if (node.type.name === 'paragraph' || node.type.name.startsWith('heading')) {
            const newIndent = Math.min((node.attrs.indent || 0) + 1, 10)
            if (dispatch) dispatch(state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: newIndent }))
          }
        })
        return true
      },
      outdent: () => ({ state, dispatch }: any) => {
        const { $from, $to } = state.selection
        state.doc.nodesBetween($from.pos, $to.pos, (node: any, pos: number) => {
          if (node.type.name === 'paragraph' || node.type.name.startsWith('heading')) {
            const newIndent = Math.max((node.attrs.indent || 0) - 1, 0)
            if (dispatch) dispatch(state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: newIndent }))
          }
        })
        return true
      },
    } as any
  },
})

const VideoExtension = Node.create({
  name: 'video',
  addOptions() { return { inline: false, allowBase64: false, HTMLAttributes: {} } },
  inline() { return this.options.inline },
  group() { return 'block' },
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      autoplay: { default: false },
      loop: { default: false },
      muted: { default: false },
    }
  },
  parseHTML() {
    return [{ tag: 'video[src]' }]
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['video', { ...this.options.HTMLAttributes, ...HTMLAttributes }]
  },
  addCommands() {
    return {
      setVideo: (options: { src: string }) => ({ commands }: any) =>
        commands.insertContent({ type: this.name, attrs: options }),
    } as any
  },
})

// 音訊節點：可上傳 MP3/WAV/M4A、文章內直接播放
const AudioExtension = Node.create({
  name: 'audio',
  addOptions() { return { HTMLAttributes: {} } },
  group() { return 'block' },
  addAttributes() {
    return { src: { default: null }, controls: { default: true } }
  },
  parseHTML() {
    return [{ tag: 'audio[src]' }]
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['audio', { controls: 'true', preload: 'metadata', ...this.options.HTMLAttributes, ...HTMLAttributes }]
  },
  addCommands() {
    return {
      setAudio: (options: { src: string }) => ({ commands }: any) =>
        commands.insertContent({ type: this.name, attrs: options }),
    } as any
  },
})

const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      listType: {
        default: 'disc',
        parseHTML: (el: any) => el.getAttribute('data-list-type') || 'disc',
        renderHTML: (attrs: any) => ({ 'data-list-type': attrs.listType }),
      },
      markerColor: {
        default: null,
        parseHTML: (el: any) => el.style.getPropertyValue('--marker-color') || null,
        renderHTML: (attrs: any) => attrs.markerColor ? { style: `--marker-color: ${attrs.markerColor}` } : {},
      },
    }
  },
})

const SlashCommands = Extension.create({
  name: 'slash-commands',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => props.command({ editor, range }),
      },
    }
  },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })]
  },
})

// Custom BubbleMenu component (manual implementation)
const BubbleMenu = (props: any) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!element || !props.editor) return
    const plugin = BubbleMenuPlugin({
      editor: props.editor,
      element,
      tippyOptions: props.tippyOptions,
      shouldShow: props.shouldShow,
    } as any)
    props.editor.registerPlugin(plugin)
    return () => props.editor.unregisterPlugin('bubbleMenu')
  }, [props.editor, element])
  return <div ref={setElement} className={props.className}>{props.children}</div>
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FONTS = [
  { label: '預設字體', value: 'default' },
  { label: '黑體｜Noto Sans TC', value: 'Noto Sans TC' },
  { label: '黑體｜思源黑體', value: 'Source Han Sans TC' },
  { label: '明體｜Noto Serif TC', value: 'Noto Serif TC' },
  { label: '明體｜思源宋體', value: 'Source Han Serif TC' },
  { label: '明體｜霞鶩文楷', value: 'LXGW WenKai' },
  { label: '圓體｜M PLUS Rounded 1c', value: 'M PLUS Rounded 1c' },
  { label: '手寫｜Yomogi', value: 'Yomogi' },
]

const FONT_SIZES = [
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '48px', value: '48px' },
]

const LINE_HEIGHTS = [
  { label: '預設', value: 'default' },
  { label: '1.0', value: '1.0' },
  { label: '1.2', value: '1.2' },
  { label: '1.5', value: '1.5' },
  { label: '1.8', value: '1.8' },
  { label: '2.0', value: '2.0' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3.0' },
]

const COLORS = [
  '#000000','#333333','#666666','#999999','#CCCCCC','#FFFFFF',
  '#DC143C','#FF4500','#FF8C00','#FFD700','#32CD32','#00CED1',
  '#4169E1','#8A2BE2','#FF1493','#8B4513',
  '#EF4444','#F97316','#EAB308','#22C55E','#06B6D4','#3B82F6',
  '#A855F7','#EC4899','#14B8A6','#6366F1',
]

const HIGHLIGHTS = [
  '#FFFF00','#ADFF2F','#00FFFF','#FF69B4','#FFB347','#98FB98',
  '#FFF9C4','#DCEDC8','#B3E5FC','#F8BBD9','#FFE0B2','#FFCDD2',
]

// ─── Draggable Float Bar (replaces BubbleMenu) ──────────────────────────────

import type { Editor } from '@tiptap/react'

function DraggableFloatBar({ editor, setLink }: { editor: Editor; setLink: () => void }) {
  const [visible, setVisible] = useState(false)
  const [autoPos, setAutoPos] = useState({ x: 0, y: 0 })
  const [manualDelta, setManualDelta] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, deltaX: 0, deltaY: 0 })
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onSel = () => {
      const { selection } = editor.state
      if (selection.empty) { setVisible(false); return }
      try {
        const coords = editor.view.coordsAtPos(selection.from)
        setAutoPos({ x: coords.left, y: coords.top - 48 })
        setVisible(true)
      } catch { /* ignore */ }
    }
    const onBlur = () => setVisible(false)
    editor.on('selectionUpdate', onSel)
    editor.on('blur', onBlur)
    return () => { editor.off('selectionUpdate', onSel); editor.off('blur', onBlur) }
  }, [editor])

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    dragOrigin.current = { mouseX: e.clientX, mouseY: e.clientY, deltaX: manualDelta.x, deltaY: manualDelta.y }
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => setManualDelta({
      x: dragOrigin.current.deltaX + (e.clientX - dragOrigin.current.mouseX),
      y: dragOrigin.current.deltaY + (e.clientY - dragOrigin.current.mouseY),
    })
    const onUp = () => setIsDragging(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [isDragging])

  const FBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button type="button" title={title} onClick={onClick}
      className={`flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded-lg text-xs transition-colors ${active ? 'bg-amber-500/25 text-amber-300' : 'text-white/55 hover:bg-white/10 hover:text-white/90'}`}>
      {children}
    </button>
  )

  if (!visible) return null

  return (
    <div
      ref={barRef}
      style={{ position: 'fixed', left: autoPos.x + manualDelta.x, top: autoPos.y + manualDelta.y, zIndex: 9999 }}
      className="flex items-center gap-0.5 p-1 bg-slate-800/95 backdrop-blur-sm border border-white/12 shadow-xl rounded-xl select-none"
    >
      {/* Drag handle */}
      <div onMouseDown={onDragStart}
        className={`flex items-center justify-center h-7 w-5 text-white/25 hover:text-white/60 transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        title="拖曳工具列">
        <GripVertical className="w-3 h-3" />
      </div>
      <div className="w-px h-4 bg-white/10 mx-0.5" />
      <FBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗體"><Bold className="w-3.5 h-3.5" /></FBtn>
      <FBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜體"><Italic className="w-3.5 h-3.5" /></FBtn>
      <FBtn onClick={() => editor.chain().focus().toggleUnderline?.().run()} active={editor.isActive('underline')} title="底線"><UnderlineIcon className="w-3.5 h-3.5" /></FBtn>
      <FBtn onClick={setLink} active={editor.isActive('link')} title="連結"><LinkIcon className="w-3.5 h-3.5" /></FBtn>
      <div className="w-px h-4 bg-white/10 mx-0.5" />
      <FBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用"><Quote className="w-3.5 h-3.5" /></FBtn>
      {(['2','3','4'] as const).map(lv => (
        <FBtn key={lv} onClick={() => editor.chain().focus().toggleHeading({ level: parseInt(lv) as any }).run()} active={editor.isActive('heading', { level: parseInt(lv) })} title={`H${lv}`}>
          <span className="font-bold text-[11px]">H{lv}</span>
        </FBtn>
      ))}
      <div className="w-px h-4 bg-white/10 mx-0.5" />
      <div className="flex items-center gap-1 px-0.5">
        {['#EF4444','#3B82F6','#22C55E','#EAB308','#A855F7'].map(c => (
          <button key={c} type="button" title={c}
            className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition-transform"
            style={{ backgroundColor: c }}
            onClick={() => editor.chain().focus().setColor(c).run()} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  articleId?: string
  uploadEndpoint?: string
}

export default function BlogTipTapEditor({
  content,
  onChange,
  placeholder = '開始輸入文章內容...\n\n輸入 / 開啟命令選單',
  articleId,
  uploadEndpoint = '/api/admin/social/messages/upload',
}: Props) {

  // ─── Dropdown states ────────────────────────────────────────────────────
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropPositions, setDropPositions] = useState<Record<string, { top: number; left: number }>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const toggleDropdown = (name: string) => setOpenDropdown(p => p === name ? null : name)
  const openDropdownAt = (name: string, pos: { top: number; left: number }) => {
    setDropPositions(prev => ({ ...prev, [name]: pos }))
    setOpenDropdown(name)
  }
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside the toolbar
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as globalThis.Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  // ─── Extensions ─────────────────────────────────────────────────────────
  const extensions = [
    StarterKit.configure({
      codeBlock: false, hardBreak: false, horizontalRule: false,
      gapcursor: false, dropcursor: false, listItem: false,
      bulletList: false,
    }),
    Placeholder.configure({ placeholder }),
    TextStyle.configure({ HTMLAttributes: { class: 'text-style' } }),
    Color.configure({ types: ['textStyle'] }),
    Highlight.configure({ multicolor: true }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-amber-400 underline cursor-pointer' },
    }),
    Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-xl my-4' } }),
    Table.configure({ resizable: true }),
    TableRow, TableHeader, TableCell,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    FontFamilyExt, FontSize, FontWeight,
    Underline, Subscript, Superscript,
    CodeBlockLowlight.configure({
      lowlight: createLowlight(common),
      HTMLAttributes: { class: 'bg-slate-900 text-slate-100 p-4 rounded-xl my-4 overflow-x-auto text-sm' },
    }),
    HardBreak, HorizontalRule, Gapcursor, Dropcursor,
    CharacterCount, Typography,
    Focus.configure({ className: 'has-focus', mode: 'all' }),
    TaskList,
    TaskItem.configure({ nested: true }),
    ListItem,
    LineHeight.configure({ types: ['heading', 'paragraph'] }),
    LetterSpacing, IndentExtension, VideoExtension, AudioExtension, CustomBulletList,
    BubbleMenuExtension.configure({ element: null }),
    SlashCommands.configure({ suggestion: { items: getSuggestionItems, render: renderItems } }),
  ]

  // ─── Editor lifecycle ────────────────────────────────────────────────────
  const { editor, isReady } = useTipTapContent({
    extensions,
    initialContent: content,
    articleId,
    onChange,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-slate prose-sm sm:prose lg:prose-lg focus:outline-none p-5 min-h-[400px]',
        spellcheck: 'false',
      },
    },
  })

  if (!editor || !isReady) {
    return (
      <div className="min-h-[400px] border border-white/10 rounded-xl flex items-center justify-center bg-white/3">
        <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
      </div>
    )
  }

  // ─── Helper functions ────────────────────────────────────────────────────
  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('連結 URL', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImageByUrl = () => {
    const url = window.prompt('圖片 URL')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const uploadImage = async (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch(uploadEndpoint, { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        editor.chain().focus().setImage({ src: url }).run()
      }
    } catch (e) { console.error('Upload failed', e) }
  }

  const uploadVideo = async (file: File) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    await new Promise<void>(resolve => {
      video.onloadedmetadata = () => { window.URL.revokeObjectURL(video.src); resolve() }
      video.src = URL.createObjectURL(file)
    })
    if (video.duration > 120) { alert('影片長度不能超過 120 秒'); return }
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'video')
    try {
      const res = await fetch(uploadEndpoint, { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        ;(editor.chain().focus() as any).setVideo({ src: url }).run()
      }
    } catch (e) { console.error('Upload failed', e) }
  }

  const uploadAudio = async (file: File) => {
    if (file.size > 30 * 1024 * 1024) { alert('音訊不能超過 30 MB'); return }
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'audio')
    try {
      const res = await fetch(uploadEndpoint, { method: 'POST', body: fd })
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        ;(editor.chain().focus() as any).setAudio({ src: url }).run()
      }
    } catch (e) { console.error('Upload failed', e) }
  }

  const addYouTube = () => {
    const url = window.prompt('YouTube URL')
    if (!url) return
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    if (match?.[1]) {
      editor.chain().focus().insertContent({
        type: 'iframe',
        attrs: { src: `https://www.youtube.com/embed/${match[1]}`, width: '560', height: '315' },
      }).run()
    } else { alert('無效的 YouTube URL') }
  }

  const replaceAll = () => {
    if (!searchQuery || !replaceQuery) return
    const html = editor.getHTML().replace(new RegExp(searchQuery, 'gi'), replaceQuery)
    editor.commands.setContent(html)
    setSearchQuery(''); setReplaceQuery('')
  }

  // ─── Toolbar helpers ─────────────────────────────────────────────────────
  const Btn = ({
    onClick, active, title, children, className = '',
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
    className?: string
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded-lg text-xs transition-colors ${
        active ? 'bg-amber-500/25 text-amber-300' : 'text-white/55 hover:bg-white/10 hover:text-white/90'
      } ${className}`}
    >
      {children}
    </button>
  )

  const Sep = () => <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />

  const Dropdown = ({ id, trigger, children }: { id: string; trigger: React.ReactNode; children: React.ReactNode }) => {
    const btnRef = useRef<HTMLButtonElement>(null)
    const handleOpen = () => {
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect()
        if (openDropdown === id) {
          setOpenDropdown(null)
        } else {
          openDropdownAt(id, { top: r.bottom + 4, left: r.left })
        }
      }
    }
    const pos = dropPositions[id]
    return (
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          ref={btnRef}
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-0.5 h-7 px-1.5 rounded-lg text-xs text-white/55 hover:bg-white/10 hover:text-white/90 transition-colors"
        >
          {trigger}
        </button>
        {openDropdown === id && pos && (
          <div
            style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
            className="bg-slate-800 border border-white/12 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
          >
            {children}
          </div>
        )}
      </div>
    )
  }

  const DItem = ({
    onClick, active, children,
  }: { onClick: () => void; active?: boolean; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => { onClick(); setOpenDropdown(null) }}
      className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs transition-colors ${
        active ? 'bg-amber-500/20 text-amber-300' : 'text-white/70 hover:bg-white/8 hover:text-white'
      }`}
    >
      {children}
    </button>
  )

  const CharCount = editor.storage.characterCount?.characters?.() ?? 0

  return (
    <div className="border border-white/10 rounded-xl bg-slate-900/60 overflow-hidden">
      {/* Draggable Float Bar — formatting toolbar */}
      {editor && <DraggableFloatBar editor={editor} setLink={setLink} />}

      {/* AI Bubble Menu — appears above selected text */}
      {editor && <AiBubbleMenu editor={editor} />}

      {/* Main Toolbar */}
      <div ref={toolbarRef} className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-white/8 bg-white/[0.02] overflow-x-auto">

        {/* Undo/Redo */}
        <Btn onClick={() => editor.chain().focus().undo().run()} title="復原 (Ctrl+Z)">
          <Undo className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="重做 (Ctrl+Y)">
          <Redo className="w-3.5 h-3.5" />
        </Btn>
        <Sep />

        {/* Text Style dropdown */}
        <Dropdown id="style" trigger={<><Bold className="w-3.5 h-3.5" /><span className="hidden sm:inline ml-0.5">樣式</span><ChevronDown className="w-3 h-3 ml-0.5" /></>}>
          <DItem onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <Bold className="w-3.5 h-3.5" /> <span className="font-bold">粗體</span> <span className="ml-auto text-white/30 text-[10px]">Ctrl+B</span>
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <Italic className="w-3.5 h-3.5" /> <span className="italic">斜體</span> <span className="ml-auto text-white/30 text-[10px]">Ctrl+I</span>
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <UnderlineIcon className="w-3.5 h-3.5" /> <span className="underline">底線</span>
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <Strikethrough className="w-3.5 h-3.5" /> <span className="line-through">刪除線</span>
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <Code className="w-3.5 h-3.5" /> 行內程式碼
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')}>
            <SubscriptIcon className="w-3.5 h-3.5" /> 下標
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')}>
            <SuperscriptIcon className="w-3.5 h-3.5" /> 上標
          </DItem>
        </Dropdown>

        {/* Headings dropdown */}
        <Dropdown id="heading" trigger={<><Heading2 className="w-3.5 h-3.5" /><span className="hidden sm:inline ml-0.5">標題</span><ChevronDown className="w-3 h-3 ml-0.5" /></>}>
          {([1,2,3,4,5,6] as const).map(level => (
            <DItem key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} active={editor.isActive('heading', { level })}>
              <span className={`font-bold text-${level === 1 ? 'base' : level === 2 ? 'sm' : 'xs'}`}>H{level}</span>
              {['大標題','中標題','小標題','標題4','標題5','標題6'][level-1]}
            </DItem>
          ))}
          <DItem onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')}>
            <Type className="w-3.5 h-3.5" /> 段落
          </DItem>
        </Dropdown>

        {/* Lists dropdown */}
        <Dropdown id="list" trigger={<><ListIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline ml-0.5">清單</span><ChevronDown className="w-3 h-3 ml-0.5" /></>}>
          <DItem onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            <ListIcon className="w-3.5 h-3.5" /> 項目符號
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            <ListOrdered className="w-3.5 h-3.5" /> 數字清單
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')}>
            <CheckSquare className="w-3.5 h-3.5" /> 待辦清單
          </DItem>
          <DItem onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            <Quote className="w-3.5 h-3.5" /> 引用
          </DItem>
          <DItem onClick={() => (editor.chain().focus() as any).indent().run()}>
            <Indent className="w-3.5 h-3.5" /> 增加縮排
          </DItem>
          <DItem onClick={() => (editor.chain().focus() as any).outdent().run()}>
            <Outdent className="w-3.5 h-3.5" /> 減少縮排
          </DItem>
        </Dropdown>

        <Sep />

        {/* Alignment */}
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="靠左">
          <AlignLeft className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="置中">
          <AlignCenter className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="靠右">
          <AlignRight className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="對齊">
          <AlignJustify className="w-3.5 h-3.5" />
        </Btn>

        <Sep />

        {/* Color picker */}
        <Dropdown id="color" trigger={<><span className="w-3.5 h-3.5 rounded-sm border border-white/20 bg-current" style={{ color: editor.getAttributes('textStyle').color || '#ffffff' }} /><ChevronDown className="w-3 h-3 ml-0.5" /></>}>
          <div className="p-2">
            <p className="text-[10px] text-white/40 mb-1.5 font-medium">文字顏色</p>
            <div className="grid grid-cols-6 gap-1 mb-2">
              {COLORS.map(c => (
                <button key={c} type="button"
                  className="w-5 h-5 rounded border border-white/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => { editor.chain().focus().setColor(c).run(); setOpenDropdown(null) }}
                />
              ))}
            </div>
            <button type="button" className="w-full text-center text-[11px] text-white/40 hover:text-white/70 py-1" onClick={() => { editor.chain().focus().unsetColor().run(); setOpenDropdown(null) }}>
              重設顏色
            </button>
            <p className="text-[10px] text-white/40 mt-2 mb-1.5 font-medium">螢光標記</p>
            <div className="grid grid-cols-6 gap-1">
              {HIGHLIGHTS.map(c => (
                <button key={c} type="button"
                  className="w-5 h-5 rounded border border-white/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => { editor.chain().focus().setHighlight({ color: c }).run(); setOpenDropdown(null) }}
                />
              ))}
            </div>
            <button type="button" className="w-full text-center text-[11px] text-white/40 hover:text-white/70 py-1 mt-1" onClick={() => { editor.chain().focus().unsetHighlight().run(); setOpenDropdown(null) }}>
              移除標記
            </button>
          </div>
        </Dropdown>

        <Sep />

        {/* Font settings */}
        <Dropdown id="font" trigger={<><Type className="w-3.5 h-3.5" /><span className="hidden sm:inline ml-0.5">字體</span><ChevronDown className="w-3 h-3 ml-0.5" /></>}>
          <div className="p-2 space-y-2 min-w-[200px]">
            <div>
              <p className="text-[10px] text-white/40 mb-1 font-medium">字體系列</p>
              <select
                value={editor.getAttributes('textStyle').fontFamily || 'default'}
                onChange={e => {
                  const v = e.target.value
                  if (v === 'default') editor.chain().focus().unsetFontFamily().run()
                  else editor.chain().focus().setFontFamily(v).run()
                }}
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80 outline-none"
              >
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-1 font-medium">字體大小</p>
              <select
                value={editor.getAttributes('textStyle').fontSize || 'default'}
                onChange={e => {
                  const v = e.target.value
                  editor.chain().focus().updateAttributes('textStyle', { fontSize: v === 'default' ? null : v }).run()
                }}
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80 outline-none"
              >
                <option value="default">預設</option>
                {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-1 font-medium">行距</p>
              <select
                value={editor.getAttributes('paragraph').lineHeight || 'default'}
                onChange={e => {
                  const v = e.target.value
                  if (v === 'default') editor.chain().focus().unsetLineHeight().run()
                  else editor.chain().focus().setLineHeight(v).run()
                }}
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80 outline-none"
              >
                {LINE_HEIGHTS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
        </Dropdown>

        <Sep />

        {/* Media */}
        <Dropdown id="media" trigger={<><ImageIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline ml-0.5">媒體</span><ChevronDown className="w-3 h-3 ml-0.5" /></>}>
          <DItem onClick={insertImageByUrl}>
            <LinkIcon className="w-3.5 h-3.5" /> 貼上圖片 URL
          </DItem>
          <label className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white cursor-pointer transition-colors">
            <ImageIcon className="w-3.5 h-3.5" /> 上傳圖片
            <input type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { uploadImage(f); setOpenDropdown(null) } }}
            />
          </label>
          <label className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white cursor-pointer transition-colors">
            <Video className="w-3.5 h-3.5" /> 上傳影片
            <input type="file" accept="video/mp4,video/webm" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { uploadVideo(f); setOpenDropdown(null) } }}
            />
          </label>
          <label className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:bg-white/8 hover:text-white cursor-pointer transition-colors">
            <Music className="w-3.5 h-3.5" /> 上傳音樂
            <input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/aac" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { uploadAudio(f); setOpenDropdown(null) } }}
            />
          </label>
          <DItem onClick={addYouTube}>
            <Video className="w-3.5 h-3.5" /> YouTube 影片
          </DItem>
        </Dropdown>

        {/* Table */}
        <Dropdown id="table" trigger={<><TableIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline ml-0.5">表格</span><ChevronDown className="w-3 h-3 ml-0.5" /></>}>
          <DItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="w-3.5 h-3.5" /> 插入表格
          </DItem>
          <DItem onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows className="w-3.5 h-3.5" /> 新增列
          </DItem>
          <DItem onClick={() => editor.chain().focus().deleteRow().run()}>
            <Trash2 className="w-3.5 h-3.5" /> 刪除列
          </DItem>
          <DItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns className="w-3.5 h-3.5" /> 新增欄
          </DItem>
          <DItem onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Trash2 className="w-3.5 h-3.5" /> 刪除欄
          </DItem>
          <DItem onClick={() => editor.chain().focus().mergeCells().run()}>
            <Merge className="w-3.5 h-3.5" /> 合併儲存格
          </DItem>
          <DItem onClick={() => editor.chain().focus().splitCell().run()}>
            <Split className="w-3.5 h-3.5" /> 分割儲存格
          </DItem>
          <DItem onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> <span className="text-rose-400">刪除表格</span>
          </DItem>
        </Dropdown>

        <Sep />

        {/* Misc */}
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="程式碼區塊">
          <FileCode className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分隔線">
          <Minus className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => setLink()} active={editor.isActive('link')} title="連結">
          <LinkIcon className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => setShowSearch(s => !s)} active={showSearch} title="搜尋取代">
          <Search className="w-3.5 h-3.5" />
        </Btn>

        {/* Character count */}
        <div className="ml-auto text-[10px] text-white/25 px-1 shrink-0">{CharCount} 字</div>
      </div>

      {/* Search & Replace bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-white/[0.02]">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋..."
            className="flex-1 bg-transparent text-xs text-white/80 outline-none placeholder-white/25"
          />
          <span className="text-white/20 text-xs">→</span>
          <input
            value={replaceQuery}
            onChange={e => setReplaceQuery(e.target.value)}
            placeholder="取代..."
            className="flex-1 bg-transparent text-xs text-white/80 outline-none placeholder-white/25"
          />
          <button type="button" onClick={replaceAll}
            className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-lg hover:bg-amber-500/30 transition-colors shrink-0">
            全部取代
          </button>
          <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(''); setReplaceQuery('') }}
            className="text-white/30 hover:text-white/60 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="tiptap-blog-editor"
      />

      {/* Editor styles */}
      <style jsx global>{`
        .tiptap-blog-editor .ProseMirror {
          outline: none;
          padding: 20px;
          min-height: 400px;
          color: rgba(255,255,255,0.85);
          font-size: 15px;
          line-height: 1.7;
        }
        .tiptap-blog-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255,255,255,0.2);
          pointer-events: none;
          height: 0;
          white-space: pre-line;
        }
        .tiptap-blog-editor .ProseMirror h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: rgba(255,255,255,0.95); }
        .tiptap-blog-editor .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.625rem; color: rgba(255,255,255,0.92); }
        .tiptap-blog-editor .ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; color: rgba(255,255,255,0.9); }
        .tiptap-blog-editor .ProseMirror h4, .tiptap-blog-editor .ProseMirror h5, .tiptap-blog-editor .ProseMirror h6 { font-weight: 600; margin: 0.875rem 0 0.4rem; color: rgba(255,255,255,0.88); }
        .tiptap-blog-editor .ProseMirror p { margin: 0.5rem 0; }
        .tiptap-blog-editor .ProseMirror a { color: #f59e0b; text-decoration: underline; }
        .tiptap-blog-editor .ProseMirror strong { font-weight: 700; color: rgba(255,255,255,0.95); }
        .tiptap-blog-editor .ProseMirror em { font-style: italic; }
        .tiptap-blog-editor .ProseMirror code { background: rgba(255,255,255,0.08); border-radius: 4px; padding: 0.1em 0.4em; font-family: monospace; font-size: 0.875em; color: #f0a500; }
        .tiptap-blog-editor .ProseMirror pre { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; margin: 1rem 0; overflow-x: auto; }
        .tiptap-blog-editor .ProseMirror pre code { background: none; padding: 0; color: #e2e8f0; }
        .tiptap-blog-editor .ProseMirror blockquote { border-left: 3px solid rgba(245,158,11,0.4); padding-left: 1rem; margin: 1rem 0; color: rgba(255,255,255,0.6); font-style: italic; }
        .tiptap-blog-editor .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-blog-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-blog-editor .ProseMirror li { margin: 0.25rem 0; }
        .tiptap-blog-editor .ProseMirror ul[data-list-type=circle] { list-style: circle; }
        .tiptap-blog-editor .ProseMirror ul[data-list-type=square] { list-style: square; }
        .tiptap-blog-editor .ProseMirror ul[data-list-type=none] { list-style: none; }
        .tiptap-blog-editor .ProseMirror img { max-width: 100%; border-radius: 12px; margin: 1rem 0; }
        .tiptap-blog-editor .ProseMirror video { max-width: 100%; border-radius: 12px; margin: 1rem 0; }
        .tiptap-blog-editor .ProseMirror hr { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 1.5rem 0; }
        .tiptap-blog-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .tiptap-blog-editor .ProseMirror td, .tiptap-blog-editor .ProseMirror th { border: 1px solid rgba(255,255,255,0.12); padding: 0.5rem 0.75rem; text-align: left; }
        .tiptap-blog-editor .ProseMirror th { background: rgba(255,255,255,0.06); font-weight: 600; }
        .tiptap-blog-editor .ProseMirror .selectedCell { background: rgba(245,158,11,0.1); }
        .tiptap-blog-editor .ProseMirror ul[data-type=taskList] { list-style: none; padding-left: 0.5rem; }
        .tiptap-blog-editor .ProseMirror ul[data-type=taskList] li { display: flex; align-items: flex-start; gap: 0.5rem; }
        .tiptap-blog-editor .ProseMirror ul[data-type=taskList] li input[type=checkbox] { margin-top: 0.25rem; cursor: pointer; }
      `}</style>
    </div>
  )
}
