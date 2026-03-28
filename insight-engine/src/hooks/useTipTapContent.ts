import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, Editor } from '@tiptap/react'
import type { Extensions } from '@tiptap/react'

interface UseTipTapContentOptions {
  extensions: Extensions
  initialContent?: string
  articleId?: string
  onChange?: (html: string) => void
  placeholder?: string
  editorProps?: Record<string, unknown>
}

interface UseTipTapContentReturn {
  editor: Editor | null
  isReady: boolean
  setContent: (content: string) => void
  getContent: () => string
  clearContent: () => void
}

export function useTipTapContent({
  extensions,
  initialContent = '',
  articleId,
  onChange,
  editorProps,
}: UseTipTapContentOptions): UseTipTapContentReturn {
  const [isReady, setIsReady] = useState(false)
  const previousArticleIdRef = useRef<string | undefined>(articleId)
  const contentSetRef = useRef(false)

  const editor = useEditor({
    extensions,
    content: '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    onCreate: () => {
      setIsReady(true)
    },
    onDestroy: () => {
      setIsReady(false)
      contentSetRef.current = false
    },
    editorProps: editorProps as any,
  })

  useEffect(() => {
    const articleChanged = previousArticleIdRef.current !== articleId
    if (articleChanged) {
      contentSetRef.current = false
      previousArticleIdRef.current = articleId
    }

    if (editor && isReady && initialContent && !contentSetRef.current) {
      const currentContent = editor.getHTML()
      if (currentContent !== initialContent) {
        editor.commands.setContent(initialContent)
        contentSetRef.current = true
      }
    }
  }, [editor, isReady, initialContent, articleId])

  const setContent = useCallback((content: string) => {
    if (editor && isReady) {
      editor.commands.setContent(content)
      contentSetRef.current = true
    }
  }, [editor, isReady])

  const getContent = useCallback(() => {
    if (editor && isReady) return editor.getHTML()
    return ''
  }, [editor, isReady])

  const clearContent = useCallback(() => {
    if (editor && isReady) {
      editor.commands.clearContent()
      contentSetRef.current = false
    }
  }, [editor, isReady])

  return { editor, isReady, setContent, getContent, clearContent }
}
