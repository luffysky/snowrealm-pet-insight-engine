'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Image as ImageIcon, Minus, Quote,
} from 'lucide-react'

export const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) props.command(item)
  }

  const upHandler = () => setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  const downHandler = () => setSelectedIndex((selectedIndex + 1) % props.items.length)
  const enterHandler = () => selectItem(selectedIndex)

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') { upHandler(); return true }
      if (event.key === 'ArrowDown') { downHandler(); return true }
      if (event.key === 'Enter') { enterHandler(); return true }
      return false
    },
  }))

  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[200px] p-1">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
              index === selectedIndex ? 'bg-amber-500/20 text-amber-300' : 'text-white/70 hover:bg-white/8'
            }`}
            onClick={() => selectItem(index)}
          >
            {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
            <span>{item.title}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-white/40">無結果</div>
      )}
    </div>
  )
})

CommandList.displayName = 'CommandList'
