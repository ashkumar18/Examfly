import { cn, SUBJECT_COLORS } from '../lib/utils'

export default function SubtopicTile({ subtopic, count, subject, onClick }) {
  const color = SUBJECT_COLORS[subject]

  return (
    <button
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-slate-700/50 bg-slate-800/60 p-4',
        'transition-all duration-200 hover:bg-slate-800 hover:shadow-lg',
        'hover:border-slate-600 cursor-pointer text-left w-full'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-sans text-sm font-semibold text-slate-200 md:text-base">
            {subtopic}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {count} questions
          </p>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {count}
        </div>
      </div>
    </button>
  )
}
