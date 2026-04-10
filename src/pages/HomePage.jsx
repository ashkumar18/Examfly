import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQuestionCount, getQuestionsBySubject, getQuestionsByIds } from '../db/seedData'
import { SUBJECT_MAP, SUBJECT_KEYS, shuffleArray, checkPasswordStrength } from '../lib/utils'
import { getStats, getStreak, getRecentTests, getWeakQuestionIds } from '../lib/streak'
import { getSession, getAvatarStyle, changePassword } from '../lib/auth'
import useTestStore from '../store/useTestStore'
import StreakHeatmap from '../components/StreakHeatmap'

const SUBJECT_BORDERS = {
  Maths: 'border-l-primary', English: 'border-l-success', GK: 'border-l-warning',
  Reasoning: 'border-l-purple', Computer: 'border-l-cyan-400',
}
const SUBJECT_SHADOWS = {
  Maths: 'shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)]', English: 'shadow-[3px_3px_0px_0px_rgba(34,197,94,0.3)]',
  GK: 'shadow-[3px_3px_0px_0px_rgba(245,158,11,0.3)]', Reasoning: 'shadow-[3px_3px_0px_0px_rgba(168,85,247,0.3)]',
  Computer: 'shadow-[3px_3px_0px_0px_rgba(34,211,238,0.3)]',
}

export default function HomePage({ onLogout }) {
  const navigate = useNavigate()
  const setQuestions = useTestStore((s) => s.setQuestions)
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [startingExam, setStartingExam] = useState(false)
  const [loadingWeak, setLoadingWeak] = useState(null)
  const [startingImprove, setStartingImprove] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [showNoWeakPopup, setShowNoWeakPopup] = useState(false)
  const profileRef = useRef(null)

  const [stats, setStats] = useState({ totalSolved: 0, totalCorrect: 0, totalAttempted: 0, totalWrong: 0, testsCompleted: 0 })
  const [streak, setStreak] = useState({ current: 0, max: 0 })
  const [recent, setRecent] = useState([])
  const [weakCounts, setWeakCounts] = useState({})

  const session = getSession()
  const isAdmin = session?.role === 'admin'

  useEffect(() => {
    async function load() {
      const [c, s, st, r] = await Promise.all([
        (async () => { const c = {}; for (const s of SUBJECT_KEYS) c[s] = await getQuestionCount(s); return c })(),
        getStats(),
        getStreak(),
        getRecentTests(5),
      ])
      setCounts(c)
      setStats(s)
      setStreak(st)
      setRecent(r)

      const wc = {}
      for (const subj of SUBJECT_KEYS) {
        const ids = await getWeakQuestionIds(subj)
        wc[subj] = ids.length
      }
      setWeakCounts(wc)
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

  const accuracy = stats.totalAttempted > 0 ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0
  const totalQ = Object.values(counts).reduce((a, b) => a + b, 0)
  const progress = totalQ > 0 ? Math.min(Math.round((stats.totalSolved / totalQ) * 100), 100) : 0

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

  async function startWeakPractice(subject) {
    if (isAdmin) return
    setLoadingWeak(subject)
    const ids = await getWeakQuestionIds(subject)
    if (ids.length === 0) { setLoadingWeak(null); return }
    const questions = await getQuestionsByIds(ids)
    const selected = shuffleArray(questions).slice(0, 25)
    if (selected.length === 0) { setLoadingWeak(null); return }
    const minutes = Math.max(10, Math.ceil(selected.length * 0.8))
    setQuestions(selected, `${SUBJECT_MAP[subject]} — Weak`, subject, minutes * 60)
    navigate('/test')
  }

  async function startImprovementQuiz() {
    if (isAdmin) return
    setStartingImprove(true)
    const ids = await getWeakQuestionIds()
    if (ids.length === 0) { setStartingImprove(false); setShowNoWeakPopup(true); return }
    const questions = await getQuestionsByIds(ids)
    const selected = shuffleArray(questions).slice(0, 25)
    if (selected.length === 0) { setStartingImprove(false); setShowNoWeakPopup(true); return }
    setQuestions(selected, 'Improvement Quiz', 'Mixed', 20 * 60)
    navigate('/test')
  }

  async function handleLogout() {
    await onLogout()
  }

  const av = session ? getAvatarStyle(session.avatar || 0) : null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin border-2 border-white/10 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <span className="text-base font-black uppercase tracking-tight text-text sm:text-lg">SSC PrepZone</span>
          <div className="hidden items-center gap-8 md:flex">
            <span className="cursor-pointer border-b-2 border-primary pb-0.5 text-sm font-bold uppercase tracking-wider text-text">Dashboard</span>
            {!isAdmin && (
              <span onClick={startImprovementQuiz}
                className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text">
                Improvement
              </span>
            )}
            <span onClick={() => navigate('/analytics')}
              className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text">
              Analytics
            </span>
            {isAdmin && (
              <span onClick={() => navigate('/admin')}
                className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text">
                Admin
              </span>
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
              <span className="text-sm font-bold uppercase tracking-wider text-primary-light">Dashboard</span>
              {!isAdmin && <span onClick={() => { startImprovementQuiz(); setMenuOpen(false) }} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted active:text-text">Improvement</span>}
              <span onClick={() => { navigate('/analytics'); setMenuOpen(false) }} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted active:text-text">Analytics</span>
              {isAdmin && <span onClick={() => { navigate('/admin'); setMenuOpen(false) }} className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted active:text-text">Admin</span>}
            </div>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-text sm:text-3xl">
            {isAdmin ? 'Admin Dashboard' : `Welcome back, ${session?.displayName || 'Scholar'}.`}
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-text-muted">
            {isAdmin ? 'Monitoring mode — exam features disabled' : `Preparation ${progress}% complete`}
          </p>
        </div>

        {isAdmin ? (
          <div className="border-2 border-white/10 bg-surface-lowest p-6 text-center shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] sm:p-10">
            <p className="text-base font-black uppercase text-text">Admin accounts are for monitoring only.</p>
            <p className="mt-2 text-xs text-text-muted">Use the Admin panel to view user performance data.</p>
            <button onClick={() => navigate('/admin')}
              className="mt-5 border-2 border-primary bg-primary/10 px-6 py-3 text-sm font-black uppercase tracking-widest text-primary-light shadow-[3px_3px_0px_0px_rgba(99,102,241,0.4)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Open Admin Panel
            </button>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-10 sm:gap-4 lg:grid-cols-4">
              <div className="border-2 border-white/10 bg-surface-lowest p-3.5 sm:p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[10px]">Correctly Solved</p>
                <p className="mt-1 text-xl font-black text-success sm:mt-2 sm:text-3xl">{stats.totalCorrect.toLocaleString()}</p>
              </div>
              <div className="border-2 border-white/10 bg-surface-lowest p-3.5 sm:p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[10px]">Current Streak</p>
                <div className="mt-1 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
                  <p className="text-xl font-black text-text sm:text-3xl">{streak.current} days</p>
                  <span className="text-sm sm:text-lg">🔥</span>
                </div>
              </div>
              <div className="border-2 border-white/10 bg-surface-lowest p-3.5 sm:p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[10px]">Average Accuracy</p>
                <div className="mt-1 flex items-center gap-2 sm:mt-2 sm:gap-3">
                  <p className="text-xl font-black text-text sm:text-3xl">{accuracy}%</p>
                  <div className="hidden h-1.5 flex-1 bg-white/10 sm:block">
                    <div className="h-full bg-primary" style={{ width: `${accuracy}%` }} />
                  </div>
                </div>
              </div>
              <div className="border-2 border-white/10 bg-surface-lowest p-3.5 sm:p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted sm:text-[10px]">Tests Completed</p>
                <p className="mt-1 text-xl font-black text-text sm:mt-2 sm:text-3xl">{stats.testsCompleted}</p>
              </div>
            </div>

            {/* Heatmap */}
            <div className="mb-6 sm:mb-10">
              <StreakHeatmap />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              {/* Quick Start */}
              <div className="order-1 lg:order-2">
                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-4 sm:text-sm">Quick Start</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {SUBJECT_KEYS.map((s) => (
                    <div key={s} className={`flex flex-col border-2 border-white/10 border-l-[3px] ${SUBJECT_BORDERS[s]} bg-surface-lowest ${SUBJECT_SHADOWS[s]} transition-all`}>
                      <button onClick={() => navigate('/configure', { state: { preselect: s } })}
                        className="flex w-full flex-1 flex-col items-start p-3 text-left transition-colors active:bg-surface sm:p-4">
                        <p className="text-xs font-black uppercase tracking-wider text-text sm:text-sm">{SUBJECT_MAP[s]}</p>
                        <p className="mt-0.5 text-[10px] font-bold text-text-muted">{counts[s] || 0} Questions</p>
                      </button>
                      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                        {weakCounts[s] > 0 ? (
                          <button onClick={() => startWeakPractice(s)} disabled={loadingWeak === s}
                            className="flex w-full items-center justify-center gap-1 border border-error/20 bg-error/[0.06] px-2 py-1.5 text-[9px] font-bold uppercase text-error transition-all active:bg-error/15 disabled:opacity-50 sm:text-[10px]">
                            🎯 {loadingWeak === s ? '...' : `${weakCounts[s]} weak`}
                          </button>
                        ) : (
                          <div className="flex w-full items-center justify-center gap-1 border border-white/[0.04] bg-white/[0.02] px-2 py-1.5 text-[9px] text-text-muted/40 sm:text-[10px]">
                            No weak questions
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="order-2 border-2 border-white/10 bg-surface-lowest lg:order-1">
                <div className="border-b border-white/[0.05] px-4 pt-4 pb-2 sm:px-6 sm:pt-5 sm:pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text sm:text-sm">Recent Sessions</h3>
                </div>
                {recent.length === 0 ? (
                  <div className="px-4 pb-5 sm:px-6 sm:pb-6">
                    <p className="text-sm text-text-muted">No sessions yet. Start practicing!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Mobile cards */}
                    <div className="space-y-1 px-4 pb-4 sm:hidden">
                      {recent.map((t, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-white/[0.03] px-2 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-text">{t.subject}</p>
                            <p className="text-[10px] text-text-muted">{t.date} · {t.questions}Q</p>
                          </div>
                          <div className="ml-3 text-right">
                            <p className="text-sm font-black text-success">{t.score}/{t.questions}</p>
                            <p className="text-[10px] text-text-muted">{t.accuracy}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop table */}
                    <table className="hidden w-full sm:table">
                      <thead>
                        <tr className="border-t border-white/[0.05]">
                          <th className="px-6 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-text-muted">Date</th>
                          <th className="px-6 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-text-muted">Subject</th>
                          <th className="px-6 py-2 text-center text-[9px] font-bold uppercase tracking-widest text-text-muted">Questions</th>
                          <th className="px-6 py-2 text-center text-[9px] font-bold uppercase tracking-widest text-text-muted">Score</th>
                          <th className="px-6 py-2 text-right text-[9px] font-bold uppercase tracking-widest text-text-muted">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((t, i) => (
                          <tr key={i} className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.02]">
                            <td className="px-6 py-3 text-sm text-text-muted">{t.date}</td>
                            <td className="px-6 py-3 text-sm font-bold text-text">{t.subject}</td>
                            <td className="px-6 py-3 text-center text-sm text-text-muted">{t.questions}</td>
                            <td className="px-6 py-3 text-center text-sm font-black text-success">{t.score}</td>
                            <td className="px-6 py-3 text-right text-sm text-text-muted">{t.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t-2 border-white/10 sm:mt-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-between sm:px-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">SSC PrepZone</span>
          <span className="text-[10px] text-text-muted">&copy; 2025 SSC PrepZone</span>
        </div>
      </footer>

      {showPwModal && <ChangePasswordModal username={session?.username} onClose={() => setShowPwModal(false)} />}

      {showNoWeakPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowNoWeakPopup(false)}>
          <div className="w-full max-w-sm border-2 border-white/10 bg-bg p-6 text-center shadow-[4px_4px_0px_0px_rgba(99,102,241,0.3)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-success/20 bg-success/10 text-2xl">🎉</div>
            <h3 className="text-sm font-black uppercase text-text">No Weak Questions!</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              You don't have any questions that you've answered incorrectly or left unanswered. Keep practicing!
            </p>
            <button onClick={() => setShowNoWeakPopup(false)}
              className="mt-5 w-full border-2 border-primary bg-primary/10 py-2.5 text-xs font-black uppercase tracking-widest text-primary-light transition-all active:translate-x-[2px] active:translate-y-[2px]">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PwStrengthBar({ password }) {
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
              <PwStrengthBar password={newPw} />
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
