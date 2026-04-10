import { cn } from '../lib/utils'
import useTestStore from '../store/useTestStore'

export default function QuestionCard({ question, index }) {
  const { selectedAnswers, selectAnswer } = useTestStore()
  const selected = selectedAnswers[question.id]

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-medium text-slate-400">
          Question {index + 1}
        </span>
        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
          {question.exam}
        </span>
      </div>

      <p className="mb-6 text-base leading-relaxed text-slate-100 md:text-lg">
        {question.question}
      </p>

      <div className="space-y-3">
        {Object.entries(question.options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => selectAnswer(question.id, key)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
              selected === key
                ? 'border-blue-500 bg-blue-500/15 text-white'
                : 'border-slate-700/50 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/60'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                selected === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              )}
            >
              {key}
            </span>
            <span className="text-sm md:text-base">{value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
