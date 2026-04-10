import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useTestStore from '../store/useTestStore'
import { SUBJECT_MAP } from '../lib/utils'

export default function ReviewPage() {
  const navigate = useNavigate()
  const { questions, selectedAnswers, markedForReview } = useTestStore()

  useEffect(() => {
    if (questions.length === 0) navigate('/', { replace: true })
  }, [questions, navigate])

  if (questions.length === 0) return null

  const correct = questions.filter((q) => selectedAnswers[q.id] === q.correct).length
  const wrong = questions.filter((q) => selectedAnswers[q.id] && selectedAnswers[q.id] !== q.correct).length

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-8">
          <button onClick={() => navigate('/result')}
            className="border border-border bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted transition-all hover:text-text active:bg-surface-high">
            ← Results
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-text">Full Review</span>
          <span className="text-[10px] font-bold text-text-muted">{correct}/{questions.length}</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-8 sm:py-8">
        {/* Summary strip */}
        <div className="mb-5 flex gap-2 sm:mb-8 sm:gap-4">
          <div className="flex-1 border border-success/20 bg-success/[0.06] p-2.5 text-center sm:p-3">
            <p className="text-[8px] font-bold uppercase tracking-widest text-success sm:text-[10px]">Correct</p>
            <p className="text-base font-black text-success sm:text-xl">{correct}</p>
          </div>
          <div className="flex-1 border border-error/20 bg-error/[0.06] p-2.5 text-center sm:p-3">
            <p className="text-[8px] font-bold uppercase tracking-widest text-error sm:text-[10px]">Wrong</p>
            <p className="text-base font-black text-error sm:text-xl">{wrong}</p>
          </div>
          <div className="flex-1 border border-white/10 bg-white/[0.02] p-2.5 text-center sm:p-3">
            <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted sm:text-[10px]">Skipped</p>
            <p className="text-base font-black text-text-muted sm:text-xl">{questions.length - correct - wrong}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3 sm:space-y-4">
          {questions.map((q, i) => {
            const ua = selectedAnswers[q.id]
            const isC = ua === q.correct
            const attempted = !!ua
            const flagged = markedForReview.has(q.id)

            return (
              <div key={q.id} className="border-2 border-white/10 bg-surface-lowest">
                {/* Question header */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.05] px-4 py-2.5 sm:gap-2 sm:px-5 sm:py-3">
                  <span className="bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-bg sm:text-xs">
                    Q{String(i + 1).padStart(2, '0')}
                  </span>
                  {q.exam && (
                    <span className="border border-white/10 bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-text-muted sm:text-[10px]">
                      {q.exam}
                    </span>
                  )}
                  {q.level && (
                    <span className="border border-white/10 bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-text-muted sm:text-[10px]">
                      {q.level}
                    </span>
                  )}
                  {q.year && (
                    <span className="border border-white/10 bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-text-muted sm:text-[10px]">
                      {q.year}
                    </span>
                  )}
                  {q.subtopic && (
                    <span className="border border-white/10 bg-surface px-2 py-0.5 text-[9px] text-text-muted sm:text-[10px]">
                      {q.subtopic}
                    </span>
                  )}

                  {/* Status tag */}
                  <span className="ml-auto">
                    {attempted ? (
                      isC ? (
                        <span className="border border-success/30 bg-success/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-success sm:text-[10px]">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="border border-error/30 bg-error/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-error sm:text-[10px]">
                          ✗ Wrong
                        </span>
                      )
                    ) : (
                      <span className="border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[10px]">
                        Skipped
                      </span>
                    )}
                    {flagged && (
                      <span className="ml-1.5 border border-purple/30 bg-purple/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple sm:text-[10px]">
                        🔖 Flagged
                      </span>
                    )}
                  </span>
                </div>

                {/* Question body */}
                <div className="px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-sm font-bold leading-relaxed text-text sm:text-base">{q.question}</p>

                  {/* Options */}
                  <div className="mt-4 space-y-1.5 sm:mt-5 sm:space-y-2">
                    {Object.entries(q.options).map(([k, v]) => {
                      const isCorrect = k === q.correct
                      const isWrongPick = k === ua && !isCorrect
                      return (
                        <div key={k}
                          className={`flex items-center gap-3 border-2 px-3.5 py-2.5 sm:px-4 sm:py-3 ${
                            isCorrect
                              ? 'border-success/30 bg-success/[0.06]'
                              : isWrongPick
                              ? 'border-error/30 bg-error/[0.06]'
                              : 'border-white/[0.05] bg-bg'
                          }`}>
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center border text-[10px] font-black sm:h-8 sm:w-8 sm:text-xs ${
                            isCorrect ? 'border-success bg-success text-bg' : isWrongPick ? 'border-error bg-error text-white' : 'border-white/10 text-text-muted'
                          }`}>
                            {k}
                          </span>
                          <span className={`min-w-0 flex-1 text-sm ${isCorrect ? 'font-medium text-success' : isWrongPick ? 'text-error' : 'text-text-muted/70'}`}>
                            {v}
                          </span>
                          {isCorrect && <span className="shrink-0 text-[9px] font-bold uppercase text-success sm:text-[10px]">Correct Answer</span>}
                          {isWrongPick && <span className="shrink-0 text-[9px] font-bold uppercase text-error sm:text-[10px]">Your Answer</span>}
                        </div>
                      )
                    })}
                  </div>

                  {!attempted && (
                    <div className="mt-3 border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-text-muted">
                      You did not attempt this question. The correct answer is <span className="font-bold text-success">{q.correct}</span>.
                    </div>
                  )}

                  {/* Explanation / Solution */}
                  {q.explanation && (
                    <div className="mt-4 border-l-2 border-primary/40 bg-surface p-4 sm:mt-5 sm:p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary-light sm:text-[10px]">
                          Solution
                        </span>
                      </div>
                      <div className="text-xs leading-relaxed text-text-subtle sm:text-sm">
                        {q.explanation.split('\n').map((line, li) => (
                          <p key={li} className={li > 0 ? 'mt-2' : ''}>{line}</p>
                        ))}
                      </div>
                      {q.subject && (
                        <div className="mt-3 flex items-center gap-2 text-[9px] text-text-muted sm:text-[10px]">
                          <span className="border border-white/10 bg-bg px-1.5 py-0.5">{SUBJECT_MAP[q.subject] || q.subject}</span>
                          {q.subtopic && <span className="border border-white/10 bg-bg px-1.5 py-0.5">{q.subtopic}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-5"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button onClick={() => navigate('/result')}
            className="flex flex-1 items-center justify-center gap-2 border-2 border-white/10 bg-surface px-6 py-4 text-sm font-black uppercase tracking-widest text-text-muted shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            ← Back to Results
          </button>
          <button onClick={() => { useTestStore.getState().resetTest(); navigate('/') }}
            className="flex flex-1 items-center justify-center gap-2 border-2 border-primary bg-primary/10 px-6 py-4 text-sm font-black uppercase tracking-widest text-primary-light shadow-[3px_3px_0px_0px_rgba(99,102,241,0.4)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
