import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllResults, getQuestionMasteryStats, getQuestionHistory, classifyQuestion, getWeakQuestionIds } from '../lib/streak'
import { getQuestionsByIds, getQuestionsBySubject } from '../db/seedData'
import { SUBJECT_MAP, SUBJECT_KEYS, shuffleArray, checkPasswordStrength } from '../lib/utils'
import { getSession, getAvatarStyle, changePassword } from '../lib/auth'
import useTestStore from '../store/useTestStore'

const REVERSE_SUBJECT_MAP = {}
Object.entries(SUBJECT_MAP).forEach(([k, v]) => { REVERSE_SUBJECT_MAP[v] = k })

function normalizeSubjectKey(s) {
  return REVERSE_SUBJECT_MAP[s] || s
}

const SPIDER_COLORS = {
  Maths: '#6366f1', English: '#22c55e', GK: '#f59e0b', Reasoning: '#a855f7', Computer: '#22d3ee',
}

function SpiderChart({ data, size = 280 }) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.34
  const levels = 5
  const labels = Object.keys(data)
  const n = labels.length
  if (n < 3) return null

  const angleSlice = (Math.PI * 2) / n

  function getPoint(i, value) {
    const angle = angleSlice * i - Math.PI / 2
    const r = (value / 100) * radius
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const gridLines = []
  for (let l = 1; l <= levels; l++) {
    const points = []
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, (l / levels) * 100)
      points.push(`${p.x},${p.y}`)
    }
    gridLines.push(points.join(' '))
  }

  const axisLines = []
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, 100)
    axisLines.push({ x1: cx, y1: cy, x2: p.x, y2: p.y })
  }

  const dataPoints = labels.map((_, i) => getPoint(i, data[labels[i]]))
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  const labelPositions = labels.map((_, i) => getPoint(i, 122))

  const percentPositions = [20, 40, 60, 80, 100].map((val, i) => {
    const p = getPoint(0, val)
    return { ...p, val }
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[300px] sm:max-w-[340px]">
      {gridLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {axisLines.map((l, i) => (
        <line key={i} {...l} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      <polygon points={dataPath} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill={SPIDER_COLORS[labels[i]] || '#6366f1'} stroke="#131315" strokeWidth="2" />
      ))}
      {labelPositions.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          fill={SPIDER_COLORS[labels[i]] || '#a1a1aa'} fontSize="11" fontWeight="600" fontFamily="system-ui">
          {SUBJECT_MAP[labels[i]] ? SUBJECT_MAP[labels[i]].split(' ')[0] : labels[i]}
        </text>
      ))}
      {percentPositions.map((p, i) => (
        <text key={i} x={p.x + 12} y={p.y} textAnchor="start" dominantBaseline="middle"
          fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="system-ui">
          {p.val}%
        </text>
      ))}
    </svg>
  )
}

function ResultDetailModal({ result, onClose }) {
  const [view, setView] = useState('summary')
  const [selected, setSelected] = useState(0)

  if (!result) return null

  const hasQuestionData = result.questionData && result.questionData.length > 0
  const correctCount = result.correct || 0
  const wrongCount = result.wrong || 0
  const unattemptedCount = result.unattempted || 0
  const acc = result.accuracy || 0

  const subjectBreak = result.subjectBreakdown
    ? Object.entries(result.subjectBreakdown).map(([s, d]) => ({
        subject: s, pct: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0, correct: d.correct, total: d.total,
      }))
    : []

  if (view === 'questions' && hasQuestionData) {
    const q = result.questionData[selected]
    const ua = result.selectedAnswers?.[q?.id]
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col border-t-2 border-white/10 bg-bg sm:border-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3 sm:px-6">
            <button onClick={() => setView('summary')} className="text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text">← Summary</button>
            <span className="text-xs font-black uppercase text-text">{result.subject}</span>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center border border-white/10 bg-surface text-text-muted">×</button>
          </div>
          <div className="hide-scrollbar overflow-x-auto border-b border-white/[0.05] px-4 py-2 sm:px-6">
            <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
              {result.questionData.map((qq, i) => {
                const a = result.selectedAnswers?.[qq.id]
                const c = a === qq.correct
                const w = a && a !== qq.correct
                return (
                  <button key={i} onClick={() => setSelected(i)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-black transition-all ${
                      i === selected ? 'border-2 border-primary bg-primary/20 text-primary-light'
                      : c ? 'border border-success/30 bg-success/10 text-success'
                      : w ? 'border border-error/30 bg-error/10 text-error'
                      : 'border border-white/[0.06] bg-white/[0.02] text-text-muted'
                    }`}>
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {q && (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-bg">Q{selected + 1}</span>
                  {q.exam && <span className="border border-white/10 px-1.5 py-0.5 text-[9px] font-bold text-text-muted">{q.exam}</span>}
                  {q.subtopic && <span className="border border-white/10 px-1.5 py-0.5 text-[9px] text-text-muted">{q.subtopic}</span>}
                  <span className="ml-auto">
                    {ua ? (ua === q.correct
                      ? <span className="border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] font-bold text-success">✓ Correct</span>
                      : <span className="border border-error/30 bg-error/10 px-2 py-0.5 text-[9px] font-bold text-error">✗ Wrong</span>
                    ) : <span className="border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold text-text-muted">Skipped</span>}
                  </span>
                </div>
                <p className="text-sm font-bold leading-relaxed text-text">{q.question}</p>
                <div className="mt-3 space-y-1.5">
                  {Object.entries(q.options).map(([k, v]) => {
                    const isC = k === q.correct
                    const isW = k === ua && !isC
                    return (
                      <div key={k} className={`flex items-center gap-2 border-2 px-3 py-2 text-sm ${isC ? 'border-success/30 bg-success/[0.06] text-success' : isW ? 'border-error/30 bg-error/[0.06] text-error' : 'border-white/[0.05] bg-bg text-text-muted/60'}`}>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center border text-[10px] font-black ${isC ? 'border-success bg-success text-bg' : isW ? 'border-error bg-error text-white' : 'border-white/10'}`}>{k}</span>
                        <span className="min-w-0 flex-1">{v}</span>
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
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col border-t-2 border-white/10 bg-bg sm:border-2" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3 sm:px-6">
          <span className="text-xs font-black uppercase tracking-widest text-text">Exam Summary</span>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center border border-white/10 bg-surface text-text-muted">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {/* Score hero */}
          <div className="mb-4 border-2 border-white/10 bg-surface-lowest p-4 text-center shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{result.subject}</p>
            <p className="mt-1 text-4xl font-black text-text">{acc}%</p>
            <p className="mt-0.5 text-xs text-text-muted">{result.date} · {result.questions} questions</p>
          </div>

          {/* Stats grid */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="border border-success/20 bg-success/[0.06] p-2.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-success">Correct</p>
              <p className="text-lg font-black text-success">{correctCount}</p>
            </div>
            <div className="border border-error/20 bg-error/[0.06] p-2.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-error">Wrong</p>
              <p className="text-lg font-black text-error">{wrongCount}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.02] p-2.5 text-center">
              <p className="text-[8px] font-bold uppercase tracking-widest text-text-muted">Skipped</p>
              <p className="text-lg font-black text-text-muted">{unattemptedCount}</p>
            </div>
          </div>

          {/* Score */}
          <div className="mb-4 flex items-center justify-between border border-white/10 bg-surface-lowest px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Score</span>
            <span className="text-lg font-black text-text">{result.score}/{result.questions}</span>
          </div>

          {/* Subject Breakdown */}
          {subjectBreak.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-text-muted">Subject Breakdown</p>
              <div className="space-y-2">
                {subjectBreak.map((s) => (
                  <div key={s.subject}>
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-text">{SUBJECT_MAP[s.subject] || s.subject}</span>
                      <span className="font-bold text-text-muted">{s.pct}% ({s.correct}/{s.total})</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06]">
                      <div className={`h-full ${s.pct >= 80 ? 'bg-success' : s.pct >= 60 ? 'bg-warning' : 'bg-error'}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {hasQuestionData && (
              <button onClick={() => setView('questions')}
                className="flex-1 border-2 border-primary bg-primary/10 py-3 text-xs font-black uppercase tracking-widest text-primary-light shadow-[2px_2px_0px_0px_rgba(99,102,241,0.3)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                Review Questions →
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 border-2 border-white/10 bg-surface py-3 text-xs font-bold uppercase tracking-widest text-text-muted transition-all hover:bg-surface-high">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage({ onLogout }) {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [mastery, setMastery] = useState(null)
  const [subjectMastery, setSubjectMastery] = useState({})
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showNoWeakPopup, setShowNoWeakPopup] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [startingExam, setStartingExam] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const profileRef = useRef(null)
  const setQuestions = useTestStore((s) => s.setQuestions)
  const session = getSession()
  const isAdmin = session?.role === 'admin'
  const av = session ? getAvatarStyle(session.avatar || 0) : null

  useEffect(() => {
    async function load() {
      const [r, m, history] = await Promise.all([
        getAllResults(),
        getQuestionMasteryStats(),
        getQuestionHistory(),
      ])
      setResults(r)
      setMastery(m)

      const bySubject = {}
      Object.values(history).forEach((h) => {
        const s = h.subject
        if (!bySubject[s]) bySubject[s] = { mastered: 0, learning: 0, weak: 0, total: 0 }
        bySubject[s].total++
        const cat = classifyQuestion(h)
        if (cat === 'mastered') bySubject[s].mastered++
        else if (cat === 'learning') bySubject[s].learning++
        else if (cat === 'weak') bySubject[s].weak++
      })
      setSubjectMastery(bySubject)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function startFullExam() {
    if (isAdmin) return
    setStartingExam(true)
    let all = []
    for (const s of SUBJECT_KEYS) {
      const qs = await getQuestionsBySubject(s, 20)
      all.push(...qs)
    }
    if (all.length === 0) { setStartingExam(false); return }
    setQuestions(all, 'Full Exam', 'All Subjects', 3600)
    navigate('/test')
  }

  async function handleLogout() {
    if (onLogout) await onLogout()
  }

  async function startImprovementQuiz() {
    if (isAdmin) return
    const ids = await getWeakQuestionIds()
    if (ids.length === 0) { setShowNoWeakPopup(true); return }
    const questions = await getQuestionsByIds(ids)
    const selected = shuffleArray(questions).slice(0, 25)
    if (selected.length === 0) { setShowNoWeakPopup(true); return }
    setQuestions(selected, 'Improvement Quiz', 'Mixed', 20 * 60)
    navigate('/test')
  }

  const subjectAgg = useMemo(() => {
    const agg = {}
    results.forEach((r) => {
      if (r.subjectBreakdown) {
        Object.entries(r.subjectBreakdown).forEach(([s, d]) => {
          const k = normalizeSubjectKey(s)
          if (!agg[k]) agg[k] = { total: 0, correct: 0, wrong: 0, unattempted: 0, tests: 0 }
          agg[k].total += d.total
          agg[k].correct += d.correct
          agg[k].wrong += d.wrong
          agg[k].unattempted += d.unattempted
          agg[k].tests++
        })
      }
    })
    return agg
  }, [results])

  const spiderData = useMemo(() => {
    const data = {}
    const hasAnyData = Object.keys(subjectAgg).length > 0
    SUBJECT_KEYS.forEach((s) => {
      const d = subjectAgg[s]
      if (d && d.total > 0) {
        data[s] = Math.round((d.correct / d.total) * 100)
      } else {
        data[s] = hasAnyData ? 0 : Math.floor(Math.random() * 40 + 30)
      }
    })
    return data
  }, [subjectAgg])

  const accuracyTrend = useMemo(() => {
    return results.slice(0, 20).reverse().map((r, i) => ({
      index: i, accuracy: r.accuracy, score: r.score, date: r.date, subject: r.subject,
    }))
  }, [results])

  const weakAreas = useMemo(() => {
    return Object.entries(subjectAgg)
      .map(([s, d]) => ({ subject: s, accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0, total: d.total }))
      .filter((d) => d.total > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
  }, [subjectAgg])

  const historyToShow = showAllHistory ? results : results.slice(0, 10)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin border-2 border-white/10 border-t-primary" />
      </div>
    )
  }

  function goToMastery(category) {
    navigate('/mastery', { state: { category } })
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <span className="text-base font-black uppercase tracking-tight text-text sm:text-lg">SSC PrepZone</span>
          <div className="hidden items-center gap-8 md:flex">
            <span onClick={() => navigate('/')} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text">Dashboard</span>
            {!isAdmin && (
              <span onClick={startImprovementQuiz} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text">Improvement</span>
            )}
            <span className="cursor-pointer border-b-2 border-primary pb-0.5 text-sm font-bold uppercase tracking-wider text-text">Analytics</span>
            {isAdmin && (
              <span onClick={() => navigate('/admin')} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text">Admin</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <button onClick={startFullExam} disabled={startingExam}
                className="border-2 border-primary bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-light shadow-[2px_2px_0px_0px_rgba(99,102,241,0.4)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 sm:px-5 sm:text-xs">
                {startingExam ? 'Loading...' : 'Full Exam'}
              </button>
            )}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex h-9 w-9 items-center justify-center border-2 border-white/10 text-xs font-black transition-all hover:border-white/20"
                style={{ backgroundColor: av?.bg, color: av?.text }}>
                {(session?.displayName || session?.username || 'U').charAt(0).toUpperCase()}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 border-2 border-white/10 bg-bg shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                  <div className="border-b border-white/[0.05] px-4 py-3">
                    <p className="text-xs font-black text-text">{session?.displayName}</p>
                    <p className="text-[10px] text-text-muted">@{session?.username}{isAdmin && ' · Admin'}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setShowPwModal(true); setProfileOpen(false) }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text">
                      🔑 Change Password
                    </button>
                    <button onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-error transition-colors hover:bg-error/[0.06]">
                      ⏻ Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-9 w-9 items-center justify-center text-text-muted md:hidden">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-white/[0.05] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3">
              <span onClick={() => { navigate('/'); setMenuOpen(false) }} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted active:text-text">Dashboard</span>
              {!isAdmin && <span onClick={() => { startImprovementQuiz(); setMenuOpen(false) }} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted active:text-text">Improvement</span>}
              <span className="text-sm font-bold uppercase tracking-wider text-primary-light">Analytics</span>
              {isAdmin && <span onClick={() => { navigate('/admin'); setMenuOpen(false) }} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted active:text-text">Admin</span>}
            </div>
          </div>
        )}
      </nav>

      {showNoWeakPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowNoWeakPopup(false)}>
          <div className="w-full max-w-sm border-2 border-white/10 bg-bg p-6 text-center shadow-[4px_4px_0px_0px_rgba(99,102,241,0.3)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-success/20 bg-success/10 text-2xl">🎉</div>
            <h3 className="text-sm font-black uppercase text-text">No Weak Questions!</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">You don't have any weak questions. Keep practicing!</p>
            <button onClick={() => setShowNoWeakPopup(false)} className="mt-5 w-full border-2 border-primary bg-primary/10 py-2.5 text-xs font-black uppercase tracking-widest text-primary-light">Got it</button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="mb-5 text-xl font-black uppercase tracking-tighter text-text sm:mb-6 sm:text-2xl">Performance Analytics</h1>

        {results.length === 0 ? (
          <div className="border-2 border-white/10 bg-surface-lowest p-8 text-center shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] sm:p-12">
            <p className="text-base font-black uppercase text-text sm:text-lg">No exam data yet</p>
            <p className="mt-2 text-xs text-text-muted sm:text-sm">Complete a practice session to see your analytics here.</p>

            <div className="mt-6">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-text-muted">Preview — Subject Performance</p>
              <SpiderChart data={{ Maths: 65, English: 72, GK: 45, Reasoning: 58, Computer: 50 }} />
            </div>

            <button onClick={() => navigate('/configure')}
              className="mt-5 w-full border-2 border-primary bg-primary/10 px-6 py-3 text-sm font-black uppercase tracking-widest text-primary-light shadow-[3px_3px_0px_0px_rgba(99,102,241,0.4)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:mt-6 sm:w-auto sm:py-2.5">
              Start Practice
            </button>
          </div>
        ) : (
          <>
            {/* Spider Chart */}
            <div className="mb-5 border-2 border-white/10 bg-surface-lowest p-4 sm:mb-6 sm:p-5">
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-text sm:mb-3 sm:text-sm">Subject Performance</h3>
              <SpiderChart data={spiderData} />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:mt-4 sm:gap-4">
                {SUBJECT_KEYS.map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5" style={{ backgroundColor: SPIDER_COLORS[s] }} />
                    <span className="text-[10px] font-bold text-text-muted sm:text-xs">{SUBJECT_MAP[s]?.split(' ')[0]} {spiderData[s]}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mastery Distribution - clickable */}
            {mastery && (
              <div className="mb-5 border-2 border-white/10 bg-surface-lowest p-4 sm:mb-6 sm:p-5">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-4 sm:text-sm">Question Mastery</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <button onClick={() => goToMastery('mastered')} className="border border-success/20 bg-success/[0.06] p-3 text-left transition-all hover:bg-success/[0.10] active:translate-x-[1px] active:translate-y-[1px]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-success sm:text-[10px]">Mastered</p>
                    <p className="mt-1 text-xl font-black text-success sm:text-2xl">{mastery.mastered}</p>
                    <p className="text-[9px] text-text-muted sm:text-[10px]">5 correct in a row</p>
                  </button>
                  <button onClick={() => goToMastery('learning')} className="border border-warning/20 bg-warning/[0.06] p-3 text-left transition-all hover:bg-warning/[0.10] active:translate-x-[1px] active:translate-y-[1px]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-warning sm:text-[10px]">Learning</p>
                    <p className="mt-1 text-xl font-black text-warning sm:text-2xl">{mastery.learning}</p>
                    <p className="text-[9px] text-text-muted sm:text-[10px]">&ge;50% right, 2+ tries</p>
                  </button>
                  <button onClick={() => goToMastery('weak')} className="border border-error/20 bg-error/[0.06] p-3 text-left transition-all hover:bg-error/[0.10] active:translate-x-[1px] active:translate-y-[1px]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-error sm:text-[10px]">Weak</p>
                    <p className="mt-1 text-xl font-black text-error sm:text-2xl">{mastery.weak}</p>
                    <p className="text-[9px] text-text-muted sm:text-[10px]">&lt;50% right</p>
                  </button>
                  <button onClick={() => goToMastery('encountered')} className="border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:bg-white/[0.04] active:translate-x-[1px] active:translate-y-[1px]">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[10px]">Encountered</p>
                    <p className="mt-1 text-xl font-black text-text sm:text-2xl">{mastery.total}</p>
                    <p className="text-[9px] text-text-muted sm:text-[10px]">unique questions</p>
                  </button>
                </div>
                {mastery.total > 0 && (
                  <div className="mt-3 h-2.5 overflow-hidden bg-white/[0.04] sm:mt-4 sm:h-3">
                    <div className="flex h-full">
                      {mastery.mastered > 0 && <div className="h-full bg-success transition-all" style={{ width: `${(mastery.mastered / mastery.total) * 100}%` }} />}
                      {mastery.learning > 0 && <div className="h-full bg-warning transition-all" style={{ width: `${(mastery.learning / mastery.total) * 100}%` }} />}
                      {mastery.weak > 0 && <div className="h-full bg-error transition-all" style={{ width: `${(mastery.weak / mastery.total) * 100}%` }} />}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4 sm:space-y-6">
                {/* Accuracy Trend — Smooth Line Graph */}
                <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-5">
                  <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-4 sm:text-sm">Accuracy Trend</h3>
                  {accuracyTrend.length > 1 ? (() => {
                    const chartW = 500
                    const chartH = 160
                    const padL = 32
                    const padR = 12
                    const padT = 20
                    const padB = 25
                    const w = chartW - padL - padR
                    const h = chartH - padT - padB
                    const n = accuracyTrend.length
                    const pts = accuracyTrend.map((d, i) => ({
                      x: padL + (i / (n - 1)) * w,
                      y: padT + h - (d.accuracy / 100) * h,
                      acc: d.accuracy,
                    }))

                    function smoothPath(points) {
                      if (points.length < 2) return ''
                      if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`
                      let d = `M${points[0].x},${points[0].y}`
                      for (let i = 0; i < points.length - 1; i++) {
                        const p0 = points[Math.max(0, i - 1)]
                        const p1 = points[i]
                        const p2 = points[i + 1]
                        const p3 = points[Math.min(points.length - 1, i + 2)]
                        const tension = 0.3
                        const cp1x = p1.x + (p2.x - p0.x) * tension
                        const cp1y = p1.y + (p2.y - p0.y) * tension
                        const cp2x = p2.x - (p3.x - p1.x) * tension
                        const cp2y = p2.y - (p3.y - p1.y) * tension
                        d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
                      }
                      return d
                    }

                    const curvePath = smoothPath(pts)
                    const areaPath = `${curvePath} L${pts[pts.length - 1].x},${padT + h} L${pts[0].x},${padT + h} Z`
                    const gradId = 'accGrad'

                    return (
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {[0, 25, 50, 75, 100].map((v) => {
                          const y = padT + h - (v / 100) * h
                          return (
                            <g key={v}>
                              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                              <text x={padL - 5} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="system-ui">{v}%</text>
                            </g>
                          )
                        })}
                        <path d={areaPath} fill={`url(#${gradId})`} />
                        <path d={curvePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
                        {pts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#131315" stroke="#6366f1" strokeWidth="2.5" />
                            <circle cx={p.x} cy={p.y} r="2" fill="#6366f1" />
                            <title>{accuracyTrend[i].date}: {p.acc}%</title>
                          </g>
                        ))}
                      </svg>
                    )
                  })() : accuracyTrend.length === 1 ? (
                    <p className="text-sm text-text-muted">Complete more tests to see a trend line.</p>
                  ) : (
                    <p className="text-sm text-text-muted">Not enough data</p>
                  )}
                  <div className="mt-2 flex justify-between text-[9px] text-text-muted sm:text-[10px]">
                    <span>Oldest</span><span>Most Recent</span>
                  </div>
                </div>

                {/* Subject Breakdown */}
                <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-5">
                  <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-4 sm:text-sm">Subject Breakdown</h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    {Object.entries(subjectAgg).map(([s, d]) => {
                      const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
                      return (
                        <div key={s}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-bold text-text sm:text-sm">{SUBJECT_MAP[s] || s}</span>
                            <span className="text-[10px] font-bold text-text-muted sm:text-xs">{acc}% ({d.correct}/{d.total})</span>
                          </div>
                          <div className="h-1.5 overflow-hidden bg-white/[0.06] sm:h-2">
                            <div className={`h-full transition-all ${acc >= 80 ? 'bg-success' : acc >= 60 ? 'bg-warning' : 'bg-error'}`}
                              style={{ width: `${acc}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Per-Subject Mastery */}
                {Object.keys(subjectMastery).length > 0 && (
                  <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-5">
                    <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-4 sm:text-sm">Subject Mastery Breakdown</h3>
                    <div className="space-y-3">
                      {SUBJECT_KEYS.filter((s) => subjectMastery[s]).map((s) => {
                        const m = subjectMastery[s]
                        return (
                          <div key={s}>
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="text-xs font-medium text-text sm:text-sm">{SUBJECT_MAP[s]}</span>
                              <span className="text-[10px] text-text-muted sm:text-xs">{m.total} seen</span>
                            </div>
                            <div className="flex gap-1.5 sm:gap-2">
                              <div className="flex flex-1 items-center gap-1 rounded-md bg-success/[0.06] px-2 py-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                                <span className="text-[9px] font-medium text-success sm:text-[10px]">{m.mastered}</span>
                              </div>
                              <div className="flex flex-1 items-center gap-1 rounded-md bg-warning/[0.06] px-2 py-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                                <span className="text-[9px] font-medium text-warning sm:text-[10px]">{m.learning}</span>
                              </div>
                              <div className="flex flex-1 items-center gap-1 rounded-md bg-error/[0.06] px-2 py-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-error" />
                                <span className="text-[9px] font-medium text-error sm:text-[10px]">{m.weak}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-4 sm:space-y-6">
                {/* Weak Areas */}
                <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-5">
                  <h3 className="mb-2.5 text-xs font-black uppercase tracking-widest text-text sm:mb-3 sm:text-sm">Areas to Improve</h3>
                  {weakAreas.length === 0 ? (
                    <p className="text-xs text-text-muted sm:text-sm">Complete more tests to identify weak areas.</p>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {weakAreas.map((w) => (
                        <div key={w.subject} className="flex items-center justify-between border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 sm:px-3 sm:py-2.5">
                          <span className="text-xs text-text sm:text-sm">{SUBJECT_MAP[w.subject] || w.subject}</span>
                          <span className={`text-xs font-bold sm:text-sm ${w.accuracy >= 80 ? 'text-success' : w.accuracy >= 60 ? 'text-warning' : 'text-error'}`}>{w.accuracy}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Most Missed */}
                {mastery && mastery.mostMissed.length > 0 && (
                  <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-5">
                    <h3 className="mb-2.5 text-xs font-black uppercase tracking-widest text-text sm:mb-3 sm:text-sm">Most Missed Questions</h3>
                    <div className="max-h-[280px] space-y-1.5 overflow-y-auto sm:max-h-[320px]">
                      {mastery.mostMissed.map((q) => (
                        <div key={q.id} className="rounded-lg bg-white/[0.03] px-2.5 py-2 sm:px-3 sm:py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-text sm:text-xs">{SUBJECT_MAP[q.subject] || q.subject}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-success sm:text-[10px]">✓ {q.right}</span>
                              <span className="text-[9px] text-error sm:text-[10px]">✗ {q.wrong}</span>
                            </div>
                          </div>
                          <p className="mt-0.5 truncate text-[9px] text-text-muted sm:text-[10px]">{q.subtopic}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam History */}
                <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-5">
                  <h3 className="mb-2.5 text-xs font-black uppercase tracking-widest text-text sm:mb-3 sm:text-sm">Exam History</h3>
                  <div className="max-h-[400px] space-y-1 overflow-y-auto sm:space-y-1.5">
                    {historyToShow.map((r) => (
                      <button key={r.id} onClick={() => setSelectedResult(r)}
                        className="flex w-full items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2 text-left transition-all active:bg-white/[0.06] sm:px-3 sm:py-2.5 hover:bg-white/[0.05]">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium text-text sm:text-xs">{r.subject}</p>
                          <p className="text-[9px] text-text-muted sm:text-[10px]">{r.date} · {r.questions}Q</p>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs font-bold text-text sm:text-sm">{r.score}</p>
                            <p className={`text-[9px] font-medium sm:text-[10px] ${r.accuracy >= 80 ? 'text-success' : r.accuracy >= 60 ? 'text-warning' : 'text-error'}`}>{r.accuracy}%</p>
                          </div>
                          <svg className="h-3 w-3 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </button>
                    ))}
                  </div>
                  {results.length > 10 && (
                    <button onClick={() => setShowAllHistory(!showAllHistory)}
                      className="mt-2 w-full rounded-lg bg-white/[0.04] py-2 text-[10px] font-medium text-text-muted transition-all active:bg-white/[0.06] sm:text-xs">
                      {showAllHistory ? 'Show Less' : `View All History (${results.length})`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        <div className="h-8 sm:h-12" />
      </div>

      {showPwModal && <ChangePasswordModal username={session?.username} onClose={() => setShowPwModal(false)} />}

      {selectedResult && (
        <ResultDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </div>
  )
}

function PwStrengthBarAnalytics({ password }) {
  if (!password) return null
  const { level, passed, total, suggestions } = checkPasswordStrength(password)
  const colors = { weak: 'bg-error', medium: 'bg-warning', strong: 'bg-success' }
  const labels = { weak: 'Weak', medium: 'Medium', strong: 'Strong' }
  const textCls = { weak: 'text-error', medium: 'text-warning', strong: 'text-success' }
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`h-1 flex-1 ${i < passed ? colors[level] : 'bg-white/[0.06]'}`} />
          ))}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${textCls[level]}`}>{labels[level]}</span>
      </div>
      {suggestions.length > 0 && level !== 'strong' && (
        <div className="space-y-0.5">
          {suggestions.map((s) => <p key={s} className="text-[9px] text-text-muted">• {s}</p>)}
        </div>
      )}
    </div>
  )
}

function ChangePasswordModal({ username, onClose }) {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const pwStrength = newPw ? checkPasswordStrength(newPw) : null
  const isWeak = newPw && pwStrength && pwStrength.level === 'weak'

  async function handleSubmit(e) {
    e.preventDefault()
    if (isWeak) { setError('Password is too weak. Must be at least Medium strength.'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return }
    setSubmitting(true)
    const result = await changePassword(username, oldPw, newPw)
    if (result.success) { setSuccess(true); setTimeout(onClose, 1500) }
    else setError(result.error)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm border-2 border-white/10 bg-bg p-5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-text">Change Password</h3>
        {success ? (
          <div className="border border-success/20 bg-success/10 px-3 py-2 text-xs font-bold text-success">Password changed successfully!</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="Current password"
              className="w-full border-2 border-white/10 bg-surface-lowest px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted/40 focus:border-primary/40" />
            <div>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password"
                className="w-full border-2 border-white/10 bg-surface-lowest px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted/40 focus:border-primary/40" />
              <PwStrengthBarAnalytics password={newPw} />
            </div>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password"
              className={`w-full border-2 bg-surface-lowest px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-muted/40 ${confirmPw && newPw !== confirmPw ? 'border-error/40' : 'border-white/10 focus:border-primary/40'}`} />
            {confirmPw && newPw !== confirmPw && <p className="text-[10px] font-bold text-error">Passwords do not match</p>}
            {error && <div className="border border-error/20 bg-error/10 px-3 py-2 text-xs font-bold text-error">{error}</div>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="flex-1 border-2 border-white/10 bg-surface py-2.5 text-xs font-bold text-text-muted transition-all hover:bg-surface-high">Cancel</button>
              <button type="submit" disabled={isWeak || (confirmPw && newPw !== confirmPw) || submitting}
                className="flex-1 border-2 border-primary bg-primary/10 py-2.5 text-xs font-black text-primary-light transition-all active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40">
                {submitting ? '...' : 'Change'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
