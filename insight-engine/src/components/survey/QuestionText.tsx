'use client'

interface QuestionTextProps {
  content: string
  value: string
  onChange: (value: string) => void
  isRequired: boolean
}

export function QuestionText({
  content,
  value,
  onChange,
  isRequired,
}: QuestionTextProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-white/90 leading-relaxed">
        {content}
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isRequired ? '請輸入你的回答...' : '選填，可以直接跳過'}
        rows={4}
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 resize-none transition-colors"
        maxLength={2000}
      />
      {!isRequired && (
        <p className="text-sm text-white/30">此題為選填</p>
      )}
    </div>
  )
}
