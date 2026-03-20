'use client'

import { useCallback, useEffect, useState } from 'react'

interface AnswerRecord {
  content: string
  type: string
  options: { label: string; value: string }[]
  answer: string | string[] | null
}

export function DownloadAnswers() {
  const [records, setRecords] = useState<AnswerRecord[] | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('surveyAnswerRecord')
    if (raw) {
      try {
        setRecords(JSON.parse(raw))
      } catch { /* ignore */ }
    }
  }, [])

  const resolveLabel = useCallback(
    (record: AnswerRecord, value: string): string => {
      const opt = record.options.find((o) => o.value === value)
      return opt ? opt.label : value
    },
    []
  )

  const handleDownload = useCallback(() => {
    if (!records) return

    const now = new Date()
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const lines: string[] = [
      '═══════════════════════════════════════',
      '  毛行天下 · 問卷回答紀錄',
      '═══════════════════════════════════════',
      '',
      `填答時間：${dateStr}`,
      '',
      '───────────────────────────────────────',
      '',
    ]

    records.forEach((r, idx) => {
      lines.push(`【第 ${idx + 1} 題】${r.content}`)
      lines.push('')

      if (r.answer === null || r.answer === '') {
        lines.push('  ➜ （未作答）')
      } else if (Array.isArray(r.answer)) {
        r.answer.forEach((v) => {
          lines.push(`  ✔ ${resolveLabel(r, v)}`)
        })
      } else if (r.type === 'text') {
        lines.push(`  ✎ ${r.answer}`)
      } else {
        lines.push(`  ➜ ${resolveLabel(r, r.answer)}`)
      }

      lines.push('')
      lines.push('───────────────────────────────────────')
      lines.push('')
    })

    lines.push('感謝你完成毛行天下問卷 🐾')
    lines.push('https://snowrealm.pet')

    const text = lines.join('\r\n')
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), text], {
      type: 'text/plain;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `毛行天下_問卷回答紀錄_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [records, resolveLabel])

  if (!records) return null

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/20 text-amber-300 font-medium rounded-2xl hover:from-amber-500/30 hover:to-orange-500/30 transition-all cursor-pointer"
    >
      📋 查看我的回答紀錄
    </button>
  )
}
