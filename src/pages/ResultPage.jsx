import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useTestStore from '../store/useTestStore'
import { calculateScore, SUBJECT_MAP } from '../lib/utils'

export default function ResultPage() {
  const navigate = useNavigate()
  const { questions, selectedAnswers, markedForReview, timeRemaining, subject } = useTestStore()

  useEffect(() => {
    if (questions.length === 0) navigate('/', { replace: true })
  }, [questions, navigate])

  if (questions.length === 0) return null

  const { correct, wrong, unattempted, score, accuracy } = calculateScore(questions, selectedAnswers)
  const reviewCount = markedForReview.size + wrong

  const totalTime = useTestStore.getState().testStartTime
    ? Math.floor((Date.now() - useTestStore.getState().testStartTime) / 1000)
    : 0
  const mins = String(Math.floor(totalTime / 60)).padStart(2, '0')
  const secs = String(totalTime % 60).padStart(2, '0')

  const subjectBreakdown = useMemo(() => {
    const agg = {}
    questions.forEach((q) => {
      const s = q.subject
      if (!agg[s]) agg[s] = { total: 0, correct: 0 }
      agg[s].total++
      const a = selectedAnswers[q.id]
      if (a === q.correct) agg[s].correct++
    })
    return Object.entries(agg).map(([s, d]) => ({
      subject: s,
      label: SUBJECT_MAP[s] || s,
      pct: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
    }))
  }, [questions, selectedAnswers])

  const progressPct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-8">
          <span className="text-base font-bold tracking-tight text-primary-light sm:text-lg">SSC PrepZone</span>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Performance Summary</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
        {/* Hero Section */}
        <section className="relative mb-8 overflow-hidden border-2 border-white/10 bg-surface-lowest p-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] sm:mb-12 sm:p-10 md:p-14">
          <div className="absolute right-4 top-4 text-[8rem] leading-none sm:right-8 sm:top-6 sm:text-[12rem]">
            {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '📊' : '📝'}
          </div>
          <h1 className="relative text-4xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-8xl">
            {accuracy}%
            <br />
            <span className="text-primary">Performance</span>
            <br />
            Summary
          </h1>
          <div className="mt-6 h-3 w-full border border-white/10 bg-surface-highest sm:mt-8 sm:h-4">
            <div className={`h-full transition-all ${accuracy >= 80 ? 'bg-success' : accuracy >= 60 ? 'bg-warning' : 'bg-error'}`}
              style={{ width: `${accuracy}%` }} />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:mb-12 sm:gap-5 lg:grid-cols-4">
          {/* Total Score */}
          <div className="flex flex-col justify-between border-2 border-white/10 bg-surface p-4 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)] sm:p-6">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[11px]">Total Score</span>
            <div className="mt-3 sm:mt-6">
              <span className="text-3xl font-black text-text sm:text-5xl">{score}</span>
              <span className="ml-1 text-sm text-text-muted sm:text-lg">/{questions.length}</span>
            </div>
            <span className="mt-3 text-xl text-primary sm:mt-4 sm:text-2xl">🏅</span>
          </div>
          {/* Accuracy */}
          <div className="flex flex-col justify-between border-2 border-white/10 bg-surface p-4 shadow-[3px_3px_0px_0px_rgba(168,85,247,0.3)] sm:p-6">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[11px]">Accuracy</span>
            <div className="mt-3 sm:mt-6">
              <span className="text-3xl font-black text-text sm:text-5xl">{accuracy}</span>
              <span className="text-lg font-black text-purple sm:text-2xl">%</span>
            </div>
            <span className="mt-3 text-xl text-purple sm:mt-4 sm:text-2xl">🎯</span>
          </div>
          {/* Time Spent */}
          <div className="flex flex-col justify-between border-2 border-white/10 bg-surface p-4 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.06)] sm:p-6">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[11px]">Time Spent</span>
            <div className="mt-3 sm:mt-6">
              <span className="text-3xl font-black text-text sm:text-5xl">{mins}:{secs}</span>
              <span className="mt-0.5 block text-[9px] font-bold text-text-muted sm:text-[11px]">MIN : SEC</span>
            </div>
            <span className="mt-3 text-xl sm:mt-4 sm:text-2xl">⏱</span>
          </div>
          {/* Review Items */}
          <div className="flex flex-col justify-between border-2 border-white/10 bg-surface p-4 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)] sm:p-6">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[11px]">Review Items</span>
            <div className="mt-3 sm:mt-6">
              <span className="text-3xl font-black text-text sm:text-5xl">{String(reviewCount).padStart(2, '0')}</span>
            </div>
            <span className="mt-3 text-xl text-warning sm:mt-4 sm:text-2xl">⚠️</span>
          </div>
        </section>

        {/* Breakdown + Stat card */}
        <section className="mb-8 grid gap-4 sm:mb-12 sm:gap-6 md:grid-cols-3">
          {/* Subject Breakdown */}
          <div className="border-2 border-white/10 bg-surface-high p-5 sm:p-8 md:col-span-2">
            <h3 className="mb-5 text-lg font-black uppercase tracking-wide text-text sm:mb-8 sm:text-2xl">Subject Breakdown</h3>
            <div className="space-y-4 sm:space-y-6">
              {subjectBreakdown.map((s) => (
                <div key={s.subject}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest sm:mb-2 sm:text-xs">
                    <span className="text-text">{s.label}</span>
                    <span className="text-text-muted">{s.pct}%</span>
                  </div>
                  <div className="h-2 border border-white/10 bg-surface-lowest">
                    <div className={`h-full transition-all ${s.pct >= 80 ? 'bg-primary' : s.pct >= 60 ? 'bg-purple' : 'bg-error'}`}
                      style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stat highlight card */}
          <div className="flex flex-col items-center justify-center border-2 border-primary/30 bg-primary/[0.06] p-6 text-center sm:p-8">
            <span className="mb-3 text-4xl sm:mb-4 sm:text-5xl">📈</span>
            <h4 className="text-base font-black uppercase leading-tight text-primary-light sm:text-xl">
              {correct} out of {questions.length} correct
            </h4>
            <p className="mt-2 text-xs text-text-muted sm:text-sm">
              {unattempted > 0 ? `${unattempted} unattempted` : 'All questions attempted'}
              {wrong > 0 ? ` · ${wrong} wrong` : ''}
            </p>
          </div>
        </section>

        {/* Score Breakdown mini */}
        <section className="mb-8 grid grid-cols-3 gap-2 sm:mb-12 sm:gap-4">
          <div className="border border-success/20 bg-success/[0.06] p-3 text-center sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-success sm:text-[11px]">Correct</p>
            <p className="mt-1 text-xl font-black text-success sm:mt-2 sm:text-3xl">{correct}</p>
          </div>
          <div className="border border-error/20 bg-error/[0.06] p-3 text-center sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-error sm:text-[11px]">Wrong</p>
            <p className="mt-1 text-xl font-black text-error sm:mt-2 sm:text-3xl">{wrong}</p>
          </div>
          <div className="border border-white/10 bg-white/[0.02] p-3 text-center sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[11px]">Unattempted</p>
            <p className="mt-1 text-xl font-black text-text-muted sm:mt-2 sm:text-3xl">{unattempted}</p>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col gap-3 sm:flex-row sm:gap-5">
          <button onClick={() => navigate('/review')}
            className="flex flex-1 items-center justify-center gap-3 border-2 border-primary bg-primary/10 px-6 py-4 text-sm font-black uppercase tracking-widest text-primary-light shadow-[3px_3px_0px_0px_rgba(99,102,241,0.4)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-6 sm:text-base">
            Review Answers
            <span className="text-lg">→</span>
          </button>
          <button onClick={() => { useTestStore.getState().resetTest(); navigate('/') }}
            className="flex flex-1 items-center justify-center gap-3 border-2 border-white/10 bg-surface px-6 py-4 text-sm font-black uppercase tracking-widest text-text-muted shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-6 sm:text-base">
            Go Home
            <span className="text-lg">×</span>
          </button>
        </section>
      </main>
    </div>
  )
}
