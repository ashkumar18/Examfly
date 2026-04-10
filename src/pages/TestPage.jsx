import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useTestStore from '../store/useTestStore'
import { formatTime } from '../lib/utils'
import { recordSession } from '../lib/streak'
import { getSession, getAvatarStyle } from '../lib/auth'

export default function TestPage() {
  const navigate = useNavigate()
  const tileRef = useRef(null)
  const session = getSession()
  const av = session ? getAvatarStyle(session.avatar || 0) : null
  const {
    questions, currentIndex, selectedAnswers, markedForReview,
    timeRemaining, testActive, subject,
    selectAnswer, toggleMarkForReview, nextQuestion,
    prevQuestion, jumpToQuestion, decrementTimer,
  } = useTestStore()

  useEffect(() => {
    if (!testActive || questions.length === 0) navigate('/', { replace: true })
  }, [testActive, questions, navigate])

  useEffect(() => {
    if (!testActive) return
    const interval = setInterval(() => {
      if (useTestStore.getState().timeRemaining <= 0) { clearInterval(interval); handleSubmit(); return }
      decrementTimer()
    }, 1000)
    return () => clearInterval(interval)
  }, [testActive])

  useEffect(() => {
    if (tileRef.current) {
      const active = tileRef.current.querySelector(`[data-idx="${currentIndex}"]`)
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [currentIndex])

  const handleSubmit = useCallback(async () => {
    const st = useTestStore.getState()
    let correct = 0, wrong = 0
    st.questions.forEach((q) => {
      const a = st.selectedAnswers[q.id]
      if (a === q.correct) correct++
      else if (a) wrong++
    })
    await recordSession(st.questions.length, correct, wrong, st.subject || 'Mixed', st.questions, st.selectedAnswers)
    navigate('/result')
  }, [navigate])

  const handleKeyDown = useCallback((e) => {
    const st = useTestStore.getState()
    if (!st.testActive) return
    const q = st.questions[st.currentIndex]
    if (!q) return
    const keys = Object.keys(q.options)
    switch (e.key) {
      case '1': if (keys[0]) selectAnswer(q.id, keys[0]); break
      case '2': if (keys[1]) selectAnswer(q.id, keys[1]); break
      case '3': if (keys[2]) selectAnswer(q.id, keys[2]); break
      case '4': if (keys[3]) selectAnswer(q.id, keys[3]); break
      case 'ArrowLeft': prevQuestion(); break
      case 'ArrowRight': nextQuestion(); break
      case 'm': case 'M': toggleMarkForReview(q.id); break
    }
  }, [selectAnswer, prevQuestion, nextQuestion, toggleMarkForReview])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!testActive || questions.length === 0) return null

  const q = questions[currentIndex]
  const ans = selectedAnswers[q.id]
  const low = timeRemaining < 300
  const critical = timeRemaining < 60
  const answered = questions.filter((qq) => !!selectedAnswers[qq.id]).length
  const marked = markedForReview.size
  const remaining = questions.length - answered
  const progressPct = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0

  return (
    <div className="flex min-h-screen flex-col bg-bg pb-20 lg:pb-0">
      {/* Header — no navigation out, user is locked in exam */}
      <header className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-8">
          <span className="text-base font-bold tracking-tight text-primary-light sm:text-lg">SSC PrepZone</span>
          <div className="hidden items-center gap-6 text-xs font-bold uppercase tracking-widest md:flex">
            <span className="border-b-2 border-primary-light pb-0.5 text-primary-light">Exam in Progress</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold sm:h-9 sm:w-9"
              style={{ backgroundColor: av?.bg, color: av?.text }}>
              {(session?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-8 sm:py-8 lg:grid lg:grid-cols-12 lg:gap-8">
        {/* LEFT: Question Area */}
        <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6">
          {/* Question Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-primary px-3 py-1 text-xs font-black uppercase tracking-wider text-bg sm:px-4 sm:text-sm">
                Question {String(currentIndex + 1).padStart(2, '0')}
              </span>
              {q.exam && (
                <span className="border border-primary-light px-2.5 py-0.5 text-[10px] font-bold text-primary-light sm:text-xs">
                  {q.exam} {q.year || ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 border border-border bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted sm:px-4 sm:py-2 sm:text-xs">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className={critical ? 'animate-pulse text-error' : low ? 'text-warning' : ''}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Question Box — fixed height container */}
          <div className="flex min-h-[420px] flex-col border-2 border-white/10 bg-surface-lowest p-5 sm:min-h-[480px] sm:p-8">
            <div className="flex-1 overflow-y-auto">
              <p className="text-base font-bold leading-relaxed text-text sm:text-lg lg:text-xl">{q.question}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
              {Object.entries(q.options).map(([k, v]) => (
                <button key={k} onClick={() => selectAnswer(q.id, k)}
                  className={`group flex items-center gap-4 border-2 p-4 text-left transition-all active:translate-x-[1px] active:translate-y-[1px] sm:p-5 ${
                    ans === k
                      ? 'border-primary bg-primary/10 text-primary-light shadow-[3px_3px_0px_0px_rgba(99,102,241,0.5)]'
                      : 'border-white/10 bg-bg text-text shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] hover:border-white/30 hover:bg-white/[0.02] active:shadow-none'
                  }`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 text-sm font-black sm:h-10 sm:w-10 ${
                    ans === k ? 'border-primary bg-primary text-bg' : 'border-current'
                  }`}>
                    {k}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-bold sm:text-base">{v}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons — desktop only: Previous, Mark, Next (where Submit used to be) */}
          <div className="hidden flex-wrap items-center justify-between gap-4 pt-2 lg:flex">
            <div className="flex gap-3">
              <button onClick={prevQuestion} disabled={currentIndex === 0}
                className="border-2 border-white/10 bg-surface px-5 py-2.5 text-xs font-black uppercase tracking-wider text-text-muted shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] transition-all hover:text-text active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-20">
                Previous
              </button>
              <button onClick={() => toggleMarkForReview(q.id)}
                className={`border-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  markedForReview.has(q.id)
                    ? 'border-purple bg-purple/20 text-purple shadow-[3px_3px_0px_0px_rgba(168,85,247,0.4)]'
                    : 'border-white/10 bg-surface text-text-muted shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] hover:text-text'
                }`}>
                Mark for Review
              </button>
            </div>
            <button onClick={nextQuestion} disabled={currentIndex === questions.length - 1}
              className="border-2 border-white/10 bg-surface px-8 py-2.5 text-xs font-black uppercase tracking-wider text-text-muted shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] transition-all hover:text-text active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-20">
              Next
            </button>
          </div>

          {/* Question Paper — desktop */}
          <div className="hidden lg:block">
            <button onClick={() => navigate('/question-paper')}
              className="w-full border border-border bg-surface py-2.5 text-xs font-bold uppercase tracking-wider text-text-muted transition-all hover:bg-surface-high hover:text-text">
              View Full Question Paper
            </button>
          </div>
        </div>

        {/* RIGHT: Palette & Stats — desktop only */}
        <div className="hidden lg:col-span-4 lg:flex lg:flex-col lg:gap-6">
          <div className="sticky top-[60px] flex flex-col gap-6">
            {/* User Summary */}
            <div className="border-2 border-primary/40 bg-surface p-5 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center border-2 border-white/20 text-base font-bold"
                  style={{ backgroundColor: av?.bg, color: av?.text }}>
                  {(session?.displayName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-primary-light">{session?.displayName || session?.username}</p>
                  <p className="text-[10px] font-bold text-text-muted">@{session?.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border p-3 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Answered</p>
                  <p className="mt-0.5 text-2xl font-black text-success">{String(answered).padStart(2, '0')}</p>
                </div>
                <div className="border border-border p-3 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Remaining</p>
                  <p className="mt-0.5 text-2xl font-black text-text">{String(remaining).padStart(2, '0')}</p>
                </div>
                <div className="border border-border p-3 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Marked</p>
                  <p className="mt-0.5 text-2xl font-black text-purple">{String(marked).padStart(2, '0')}</p>
                </div>
              </div>
            </div>

            {/* Question Palette */}
            <div className="border-2 border-white/10 bg-surface p-5" ref={tileRef}>
              <h4 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-text">
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Question Palette
              </h4>
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((qq, i) => {
                  const done = !!selectedAnswers[qq.id]
                  const isMarked = markedForReview.has(qq.id)
                  const cur = i === currentIndex
                  return (
                    <button key={qq.id} data-idx={i} onClick={() => jumpToQuestion(i)}
                      className={`flex aspect-square items-center justify-center text-xs font-black transition-all ${
                        cur ? 'border-2 border-primary bg-bg text-primary shadow-[inset_0_0_8px_rgba(99,102,241,0.3)]'
                        : isMarked ? 'border border-white/20 bg-purple text-white'
                        : done ? 'border border-white/20 bg-primary text-bg'
                        : 'border border-border bg-surface-highest text-text-muted hover:border-white/30'
                      }`}>
                      {i + 1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                  <span className="h-4 w-4 border border-white/20 bg-primary" />
                  <span className="text-text-muted">Answered</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                  <span className="h-4 w-4 border border-white/20 bg-purple" />
                  <span className="text-text-muted">Marked for Review</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                  <span className="h-4 w-4 border border-border bg-surface-highest" />
                  <span className="text-text-muted">Not Visited</span>
                </div>
              </div>

              {/* Submit button — inside palette area */}
              <button onClick={handleSubmit}
                className="mt-6 w-full border-2 border-error bg-error py-3 text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_rgba(244,63,94,0.5)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                Submit Test
              </button>
            </div>

            {/* Overall Progress */}
            <div className="border-t-2 border-white/10 pt-5">
              <div className="flex items-center justify-between border border-border bg-surface-high px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text">Overall Progress</span>
                <span className="text-xs font-black text-primary-light">{progressPct}%</span>
              </div>
              <div className="mt-2 h-4 w-full overflow-hidden border border-white/10 bg-surface-highest">
                <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile: Right panel inline */}
      <div className="px-4 pb-4 lg:hidden">
        {/* User Summary */}
        <div className="border-2 border-primary/40 bg-surface p-4 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-white/20 text-sm font-bold"
              style={{ backgroundColor: av?.bg, color: av?.text }}>
              {(session?.displayName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-primary-light">{session?.displayName || session?.username}</p>
              <p className="text-[10px] font-bold text-text-muted">@{session?.username}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-border p-2.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Answered</p>
              <p className="mt-0.5 text-xl font-black text-success">{String(answered).padStart(2, '0')}</p>
            </div>
            <div className="border border-border p-2.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Remaining</p>
              <p className="mt-0.5 text-xl font-black text-text">{String(remaining).padStart(2, '0')}</p>
            </div>
            <div className="border border-border p-2.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Marked</p>
              <p className="mt-0.5 text-xl font-black text-purple">{String(marked).padStart(2, '0')}</p>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="mt-4 border-2 border-white/10 bg-surface p-4">
          <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-text">
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Question Palette
          </h4>
          <div className="grid grid-cols-8 gap-1.5">
            {questions.map((qq, i) => {
              const done = !!selectedAnswers[qq.id]
              const isMarked = markedForReview.has(qq.id)
              const cur = i === currentIndex
              return (
                <button key={qq.id} data-idx={i} onClick={() => jumpToQuestion(i)}
                  className={`flex aspect-square items-center justify-center text-[10px] font-black transition-all ${
                    cur ? 'border-2 border-primary bg-bg text-primary shadow-[inset_0_0_6px_rgba(99,102,241,0.3)]'
                    : isMarked ? 'border border-white/20 bg-purple text-white'
                    : done ? 'border border-white/20 bg-primary text-bg'
                    : 'border border-border bg-surface-highest text-text-muted'
                  }`}>
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
              <span className="h-3 w-3 border border-white/20 bg-primary" />
              <span className="text-text-muted">Answered</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
              <span className="h-3 w-3 border border-white/20 bg-purple" />
              <span className="text-text-muted">Marked</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
              <span className="h-3 w-3 border border-border bg-surface-highest" />
              <span className="text-text-muted">Not Visited</span>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-4 border-t-2 border-white/10 pt-4">
          <div className="flex items-center justify-between border border-border bg-surface-high px-3 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text">Overall Progress</span>
            <span className="text-xs font-black text-primary-light">{progressPct}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden border border-white/10 bg-surface-highest">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white/10 bg-bg/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2.5">
          <button onClick={prevQuestion} disabled={currentIndex === 0}
            className="border border-border bg-surface px-3 py-2 text-[11px] font-bold uppercase text-text-muted active:bg-surface-high disabled:opacity-20">
            Prev
          </button>
          <div className="flex gap-1.5">
            <button onClick={() => toggleMarkForReview(q.id)}
              className={`px-2.5 py-2 text-[11px] font-bold uppercase transition-all ${markedForReview.has(q.id) ? 'bg-purple/20 text-purple' : 'bg-surface text-text-muted'}`}>
              {markedForReview.has(q.id) ? 'Marked' : 'Mark'}
            </button>
            <button onClick={handleSubmit}
              className="bg-error px-4 py-2 text-[11px] font-bold uppercase text-white active:bg-error/80">
              Submit
            </button>
            <button onClick={() => navigate('/question-paper')}
              className="bg-surface px-2.5 py-2 text-[11px] text-text-muted active:bg-surface-high">
              Paper
            </button>
          </div>
          <button onClick={nextQuestion} disabled={currentIndex === questions.length - 1}
            className="border border-border bg-surface px-3 py-2 text-[11px] font-bold uppercase text-text-muted active:bg-surface-high disabled:opacity-20">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
