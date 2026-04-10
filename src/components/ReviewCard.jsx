import { cn } from '../lib/utils'
import { Bookmark } from 'lucide-react'

export default function ReviewCard({ question, index, userAnswer, isMarked }) {
  const isCorrect = userAnswer === question.correct
  const isUnattempted = !userAnswer

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-400">Q{index + 1}</span>
        <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400">
          {question.exam}
        </span>
        <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
          {question.level}
        </span>
        <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
          {question.year}
        </span>
        {isMarked && (
          <span className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-400">
            <Bookmark className="h-3 w-3" /> Marked
          </span>
        )}
        {isUnattempted && (
          <span className="rounded-full bg-slate-600/50 px-2.5 py-0.5 text-xs text-slate-400">
            Not Attempted
          </span>
        )}
        {!isUnattempted && (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            {isCorrect ? 'Correct' : 'Wrong'}
          </span>
        )}
      </div>

      <p className="mb-4 text-base leading-relaxed text-slate-100">
        {question.question}
      </p>

      <div className="space-y-2">
        {Object.entries(question.options).map(([key, value]) => {
          const isThisCorrect = key === question.correct
          const isUserWrong = key === userAnswer && !isCorrect

          return (
            <div
              key={key}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-sm',
                isThisCorrect
                  ? 'border-green-500/50 bg-green-500/10 text-green-300'
                  : isUserWrong
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : 'border-slate-700/30 bg-slate-900/20 text-slate-400'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isThisCorrect
                    ? 'bg-green-500 text-white'
                    : isUserWrong
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                )}
              >
                {key}
              </span>
              <span>{value}</span>
            </div>
          )
        })}
      </div>

      {question.explanation && (
        <div className="mt-4 rounded-xl bg-slate-900/60 p-4 text-sm text-slate-400">
          <span className="font-semibold text-slate-300">Explanation: </span>
          {question.explanation}
        </div>
      )}
    </div>
  )
}
