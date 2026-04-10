import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getQuestionHistory, classifyQuestion } from '../lib/streak'
import { getQuestionsByIds } from '../db/seedData'
import { SUBJECT_MAP } from '../lib/utils'

const CATEGORY_STYLES = {
  mastered: { label: 'Mastered Questions', color: 'text-success', border: 'border-success/20', bg: 'bg-success/[0.06]' },
  learning: { label: 'Learning Questions', color: 'text-warning', border: 'border-warning/20', bg: 'bg-warning/[0.06]' },
  weak: { label: 'Weak Questions', color: 'text-error', border: 'border-error/20', bg: 'bg-error/[0.06]' },
  encountered: { label: 'All Encountered', color: 'text-text', border: 'border-white/10', bg: 'bg-white/[0.02]' },
}

export default function MasteryQuestionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const category = location.state?.category || 'weak'
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.weak

  useEffect(() => {
    async function load() {
      const history = await getQuestionHistory()
      const entries = Object.entries(history)
      let filtered = []

      entries.forEach(([id, h]) => {
        const total = h.right + h.wrong
        const ratio = total > 0 ? h.right / total : 0
        const cat = classifyQuestion(h)

        if (category === 'encountered') {
          filtered.push({ id, ...h, total, ratio })
        } else if (total === 0) {
          return
        } else if (category === 'mastered' && cat === 'mastered') {
          filtered.push({ id, ...h, total, ratio })
        } else if (category === 'learning' && cat === 'learning') {
          filtered.push({ id, ...h, total, ratio })
        } else if (category === 'weak' && cat === 'weak') {
          filtered.push({ id, ...h, total, ratio })
        }
      })

      if (filtered.length > 0) {
        const ids = filtered.map((f) => f.id)
        const dbQuestions = await getQuestionsByIds(ids)
        const historyMap = {}
        filtered.forEach((f) => { historyMap[f.id] = f })

        const merged = dbQuestions.map((q) => ({
          ...q,
          history: historyMap[q.id] || { right: 0, wrong: 0, total: 0 },
        })).sort((a, b) => {
          if (category === 'weak') return (b.history.wrong - b.history.right) - (a.history.wrong - a.history.right)
          return b.history.total - a.history.total
        })

        setQuestions(merged)
      }
      setLoading(false)
    }
    load()
  }, [category])

  return (
    <div className="min-h-screen bg-bg pb-8">
      <nav className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-8">
          <button onClick={() => navigate(-1)}
            className="border border-white/10 bg-surface-lowest px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted transition-all hover:text-text active:bg-surface">
            ← Back
          </button>
          <span className={`text-xs font-black uppercase tracking-widest ${style.color}`}>
            {style.label}
          </span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin border-2 border-white/10 border-t-primary" />
          </div>
        ) : questions.length === 0 ? (
          <div className="border-2 border-white/10 bg-surface-lowest p-8 text-center">
            <p className="text-sm font-bold text-text-muted">No questions found in this category.</p>
          </div>
        ) : (
          <>
            <div className={`mb-4 border ${style.border} ${style.bg} p-3 sm:p-4`}>
              <p className="text-xs font-bold text-text-muted">{questions.length} questions in this category</p>
            </div>
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="border-2 border-white/10 bg-surface-lowest">
                  <button onClick={() => setExpanded(expanded === idx ? null : idx)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-surface sm:px-5 sm:py-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/10 bg-bg text-[10px] font-black text-text-muted">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-text sm:text-sm">{q.question}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-text-muted">{SUBJECT_MAP[q.subject] || q.subject}</span>
                        <span className="text-[9px] text-text-muted">·</span>
                        <span className="text-[9px] text-text-muted">{q.subtopic}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="border border-success/20 bg-success/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-success">✓{q.history.right}</span>
                      <span className="border border-error/20 bg-error/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-error">✗{q.history.wrong}</span>
                    </div>
                    <svg className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expanded === idx && (
                    <div className="border-t border-white/[0.05] px-4 py-3 sm:px-5 sm:py-4">
                      <p className="text-sm font-bold leading-relaxed text-text">{q.question}</p>
                      <div className="mt-3 space-y-1.5">
                        {Object.entries(q.options).map(([k, v]) => {
                          const isCorrect = k === q.correct
                          return (
                            <div key={k} className={`flex items-center gap-2 border-2 px-3 py-2 text-sm ${isCorrect ? 'border-success/30 bg-success/[0.06] text-success' : 'border-white/[0.05] bg-bg text-text-muted'}`}>
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center border text-[10px] font-black ${isCorrect ? 'border-success bg-success text-bg' : 'border-white/10 text-text-muted'}`}>{k}</span>
                              <span className="min-w-0 flex-1">{v}</span>
                              {isCorrect && <span className="text-[9px] font-bold uppercase">Correct</span>}
                            </div>
                          )
                        })}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 border-l-2 border-primary/40 bg-surface p-3">
                          <span className="bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary-light">Solution</span>
                          <p className="mt-2 text-xs leading-relaxed text-text-subtle">{q.explanation}</p>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {q.exam && <span className="border border-white/10 bg-bg px-1.5 py-0.5 text-[9px] font-bold text-text-muted">{q.exam}</span>}
                        {q.level && <span className="border border-white/10 bg-bg px-1.5 py-0.5 text-[9px] font-bold text-text-muted">{q.level}</span>}
                        {q.year && <span className="border border-white/10 bg-bg px-1.5 py-0.5 text-[9px] font-bold text-text-muted">{q.year}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
