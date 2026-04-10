import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useTestStore from '../store/useTestStore'

export default function QuestionPaperPage() {
  const navigate = useNavigate()
  const { questions, selectedAnswers, testActive, subject, selectAnswer } = useTestStore()

  useEffect(() => {
    if (!testActive || questions.length === 0) navigate('/', { replace: true })
  }, [testActive, questions, navigate])

  if (!testActive || questions.length === 0) return null

  return (
    <div className="min-h-screen bg-bg pb-8">
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => navigate('/test')} className="text-sm text-text-muted transition-colors active:text-text">← Back to Exam</button>
          <span className="text-sm font-medium text-text">{subject} — All Questions</span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          {questions.map((q, idx) => {
            const ans = selectedAnswers[q.id]
            return (
              <div key={q.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary-light">{idx + 1}</span>
                  {q.exam && <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-text-muted">{q.exam}</span>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text sm:text-base">{q.question}</p>
                <div className="mt-3 space-y-1 sm:space-y-1.5">
                  {Object.entries(q.options).map(([k, v], oi) => (
                    <button key={k} onClick={() => selectAnswer(q.id, k)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                        ans === k ? 'bg-primary/15 text-primary-light ring-1 ring-primary/30' : 'bg-white/[0.03] text-text active:bg-white/[0.06]'
                      }`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold ${ans === k ? 'bg-primary text-white' : 'bg-white/[0.06] text-text-muted'}`}>
                        {oi + 1}
                      </span>
                      <span className="min-w-0 flex-1">{v}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
