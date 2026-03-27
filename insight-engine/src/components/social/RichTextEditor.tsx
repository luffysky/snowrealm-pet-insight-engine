'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2,
  Quote, List, ListOrdered, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Highlighter, Undo, Redo,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg text-xs transition-colors ${
        active ? 'bg-amber-500/25 text-amber-300' : 'text-white/40 hover:text-white/80 hover:bg-white/8'
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ content, onChange, placeholder = '開始輸入...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Image,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight,
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'tiptap-editor min-h-[200px] bg-white/[0.03] rounded-xl p-4 text-white/80 outline-none prose prose-invert prose-sm max-w-none focus:ring-1 focus:ring-amber-400/20' },
    },
  })

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('輸入連結 URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="space-y-1">
      {/* Toolbar */}
      <div className="bg-white/5 border border-white/8 rounded-xl p-1.5 flex flex-wrap gap-0.5">
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="粗體">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜體">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="底線">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <div className="w-px bg-white/10 mx-0.5" />
        <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="標題 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="標題 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引言">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <div className="w-px bg-white/10 mx-0.5" />
        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="無序列表">
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <div className="w-px bg-white/10 mx-0.5" />
        <ToolbarBtn active={editor.isActive('link')} onClick={addLink} title="連結">
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="靠左">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="置中">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="靠右">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="螢光標記">
          <Highlighter className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <div className="w-px bg-white/10 mx-0.5" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="復原" active={false}>
          <Undo className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="重做" active={false}>
          <Redo className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
