'use client'

interface ProgressMapProps {
  currentStep: number
  totalSteps: number
}

export function ProgressMap({ currentStep, totalSteps }: ProgressMapProps) {
  // 最多顯示 15 個節點,太多會擠
  const maxNodes = Math.min(totalSteps, 15)
  const step = totalSteps > maxNodes ? Math.floor(totalSteps / maxNodes) : 1
  const nodes: number[] = []
  for (let i = 0; i < totalSteps; i += step) nodes.push(i)
  if (nodes[nodes.length - 1] !== totalSteps - 1) nodes.push(totalSteps - 1)

  return (
    <div className="flex items-center justify-center gap-0 flex-wrap py-2 mb-2">
      {nodes.map((nodeIdx, i) => {
        const isCompleted = currentStep > nodeIdx
        const isCurrent = currentStep === nodeIdx
        const isLast = i === nodes.length - 1

        return (
          <div key={nodeIdx} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                isCurrent
                  ? 'bg-purple-500 border-2 border-purple-400 shadow-[0_0_12px_rgba(124,92,252,0.5)] text-white animate-pulse'
                  : isCompleted
                    ? 'bg-amber-500 border-2 border-amber-400 shadow-[0_0_8px_rgba(255,180,50,0.3)] text-white'
                    : 'bg-white/5 border-2 border-white/10 text-white/20'
              }`}
            >
              {isCompleted ? '✓' : i + 1}
            </div>
            {!isLast && (
              <div
                className={`w-3 h-0.5 transition-colors duration-300 ${
                  isCompleted ? 'bg-amber-500' : 'bg-white/8'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
