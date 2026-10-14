import type { FC } from 'react'

interface EvalBarProps {
  percent: number
  label: string
  orientation: 'white' | 'black'
}

export const EvalBar: FC<EvalBarProps> = ({ percent, label, orientation }) => {
  const whiteAtTop = orientation === 'black'
  const whiteHeight = `${percent}%`
  const blackHeight = `${100 - percent}%`

  return (
    <div className="relative w-4 sm:w-5 h-full rounded-lg overflow-hidden">
      <div
        className={`absolute left-0 right-0 bg-amber-300 dark:bg-amber-900/60 transition-all duration-300 ${
          whiteAtTop ? 'top-0' : 'bottom-0'
        }`}
        style={{ height: whiteHeight }}
      />
      <div
        className={`absolute left-0 right-0 bg-zinc-800 dark:bg-zinc-700 transition-all duration-300 ${
          whiteAtTop ? 'bottom-0' : 'top-0'
        }`}
        style={{ height: blackHeight }}
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/90 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
          {label}
        </span>
      </span>
    </div>
  )
}
