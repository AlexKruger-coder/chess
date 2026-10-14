import type { FC } from 'react'

interface EvalBarProps {
  percent: number
  label: string
  orientation: 'white' | 'black'
  className?: string
  title?: string
}

export const EvalBar: FC<EvalBarProps> = ({ percent, label, orientation, className, title }) => {
  const whiteAtTop = orientation === 'black'
  const whiteHeight = `${percent}%`
  const blackHeight = `${100 - percent}%`

  return (
    <div className={`flex flex-col items-center ${className ?? ''}`} title={title}>
      <div className="relative self-stretch w-4 sm:w-5 shrink-0 min-h-[200px] rounded-lg overflow-hidden">
        {/* White portion - light with thin border */}
        <div
          className={`absolute left-0 right-0 bg-[#f5f5f5] dark:bg-[#f5f5f5] border border-[#e0e0e0] dark:border-[#e0e0e0]/30 transition-all duration-300 ${
            whiteAtTop ? 'top-0' : 'bottom-0'
          }`}
          style={{ height: whiteHeight }}
        />
        {/* Black portion - dark */}
        <div
          className={`absolute left-0 right-0 bg-[#1a1a1a] dark:bg-[#1a1a1a] transition-all duration-300 ${
            whiteAtTop ? 'bottom-0' : 'top-0'
          }`}
          style={{ height: blackHeight }}
        />
      </div>
      <span className="mt-1 text-[10px] sm:text-[11px] font-mono whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}
