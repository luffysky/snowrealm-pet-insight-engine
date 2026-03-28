import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { CommandList } from './CommandList'
import { Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Image as ImageIcon, Minus, Quote } from 'lucide-react'

export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: '大標題 (H1)',
      icon: Heading1,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      title: '中標題 (H2)',
      icon: Heading2,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: '小標題 (H3)',
      icon: Heading3,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: '項目符號清單',
      icon: List,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: '編號清單',
      icon: ListOrdered,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: '待辦事項',
      icon: CheckSquare,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      title: '引用',
      icon: Quote,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: '分隔線',
      icon: Minus,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
  ]
    .filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.title.includes('標題') && query.toLowerCase().includes('h'))
    )
    .slice(0, 10)
}

export const renderItems = () => {
  let component: any
  let popup: any

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      })

      if (!props.clientRect) return

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      })
    },

    onUpdate: (props: any) => {
      component.updateProps(props)
      if (!props.clientRect) return
      popup[0].setProps({ getReferenceClientRect: props.clientRect })
    },

    onKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        popup[0].hide()
        return true
      }
      return component.ref?.onKeyDown(props)
    },

    onExit: () => {
      popup[0].destroy()
      component.destroy()
    },
  }
}
