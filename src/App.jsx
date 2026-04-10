import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { seedDatabase } from './db/seedData'
import { initAuth, onAuthChange, logout } from './lib/auth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import SubtopicsPage from './pages/SubtopicsPage'
import TestPage from './pages/TestPage'
import ResultPage from './pages/ResultPage'
import ReviewPage from './pages/ReviewPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminPage from './pages/AdminPage'
import MasteryQuestionsPage from './pages/MasteryQuestionsPage'
import QuestionPaperPage from './pages/QuestionPaperPage'

const OLD_KEYS = ['prepzone_users', 'prepzone_session', 'prepzone_usernames_registry']

function hasMigrationData() {
  return OLD_KEYS.some((k) => localStorage.getItem(k) !== null)
}

function clearOldData() {
  OLD_KEYS.forEach((k) => localStorage.removeItem(k))
  const allKeys = Object.keys(localStorage)
  allKeys.forEach((k) => {
    if (k.startsWith('prepzone_') && k !== 'db_seeded') localStorage.removeItem(k)
  })
  localStorage.removeItem('migration_dismissed')
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showMigration, setShowMigration] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const isFirstLoad = !localStorage.getItem('db_seeded')
        if (isFirstLoad) setSeeding(true)
        await seedDatabase()
        setSeeding(false)

        const s = await initAuth()
        setSession(s)
        setAuthLoading(false)

        if (!s && hasMigrationData() && !localStorage.getItem('migration_dismissed')) {
          setShowMigration(true)
        }
      } catch (err) {
        console.error('Init error:', err)
        setSeeding(false)
        setAuthLoading(false)
      } finally {
        setReady(true)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const subscription = onAuthChange((s) => {
      setSession(s)
    })
    return () => subscription?.unsubscribe()
  }, [])

  function dismissMigration() {
    clearOldData()
    localStorage.setItem('migration_dismissed', '1')
    setShowMigration(false)
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
          <p className="text-sm font-medium text-text">
            {seeding ? 'Setting up question bank...' : authLoading ? 'Signing in...' : 'Loading...'}
          </p>
          {seeding && (
            <p className="text-xs text-text-muted">
              First load — seeding 6600+ questions
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <LoginPage onLogin={(s) => setSession(s)} />
        {showMigration && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm border-2 border-white/10 bg-bg p-6 text-center shadow-[4px_4px_0px_0px_rgba(99,102,241,0.3)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-primary/20 bg-primary/10 text-2xl">
                ☁️
              </div>
              <h3 className="text-sm font-black uppercase text-text">
                Upgraded to Cloud Saves!
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                We&apos;ve upgraded to cloud-based accounts. Your previous
                local data has been retired. Please sign in or create a
                new account — your progress will now sync across all devices.
              </p>
              <button
                onClick={dismissMigration}
                className="mt-5 w-full border-2 border-primary bg-primary/10 py-2.5 text-xs font-black uppercase tracking-widest text-primary-light transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  const isAdmin = session?.role === 'admin'

  async function handleLogout() {
    await logout()
    setSession(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAdmin ? <AdminPage onLogout={handleLogout} /> : <HomePage onLogout={handleLogout} />} />
        <Route path="/configure" element={isAdmin ? <AdminPage onLogout={handleLogout} /> : <SubtopicsPage />} />
        <Route path="/test" element={isAdmin ? <AdminPage onLogout={handleLogout} /> : <TestPage />} />
        <Route path="/result" element={isAdmin ? <AdminPage onLogout={handleLogout} /> : <ResultPage />} />
        <Route path="/review" element={isAdmin ? <AdminPage onLogout={handleLogout} /> : <ReviewPage />} />
        <Route path="/analytics" element={<AnalyticsPage onLogout={handleLogout} />} />
        <Route path="/admin" element={<AdminPage onLogout={handleLogout} />} />
        <Route path="/mastery" element={<MasteryQuestionsPage />} />
        <Route path="/question-paper" element={isAdmin ? <AdminPage onLogout={handleLogout} /> : <QuestionPaperPage />} />
      </Routes>
    </BrowserRouter>
  )
}
