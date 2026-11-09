'use client'
import { postUpload } from '@/lib/upload-client'
import { useState } from 'react'
import { useTheme } from './ThemeContext'
import { questionTitleClass } from '@/lib/themes'

interface QuestionFileUploadProps {
  content: string
  value: string
  onChange: (value: string) => void
  isRequired: boolean
  acceptedFileTypes?: string[]
  maxFileSize?: number
}

export function QuestionFileUpload({ content, value, onChange, isRequired, acceptedFileTypes, maxFileSize = 10 }: QuestionFileUploadProps) {
  const { theme } = useTheme()
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`檔案大小不可超過 ${maxFileSize}MB`)
      return
    }

    setError('')
    setUploading(true)
    setFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await postUpload('/api/admin/upload', formData)
      const data = await res.json()
      if (data.url) {
        onChange(data.url)
      } else {
        setError('上傳失敗')
      }
    } catch {
      setError('上傳失敗，請重試')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className={questionTitleClass[theme]}>{content}</h2>
      <label className="block border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/50 transition-colors">
        <input
          type="file"
          onChange={handleFileChange}
          accept={acceptedFileTypes?.join(',')}
          className="hidden"
        />
        {uploading ? (
          <p className="text-white/60 animate-pulse">上傳中...</p>
        ) : value ? (
          <div className="space-y-2">
            <p className="text-2xl">✅</p>
            <p className="text-sm text-white/70">{fileName || '已上傳'}</p>
            <p className="text-xs text-white/40">點擊更換檔案</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-2xl">📁</p>
            <p className="text-sm text-white/60">點擊選擇檔案</p>
            <p className="text-xs text-white/40">最大 {maxFileSize}MB</p>
          </div>
        )}
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!isRequired && <p className="text-xs text-white/40">此題為選填</p>}
    </div>
  )
}
