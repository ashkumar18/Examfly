import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsersForAdmin, getAvatarStyle } from '../lib/auth'
import { getStatsForUser, getResultsForUser, getStreakForUser } from '../lib/streak'

export default function AdminPage({ onLogout }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState({})

  useEffect(() => {
    async function load() {
      const fetched = await getAllUsersForAdmin()
      setUsers(fetched)
      const statsMap = {}
      for (const u of fetched) {
        const [stats, streak] = await Promise.all([
          getStatsForUser(u.id),
          getStreakForUser(u.id),
        ])
        statsMap[u.id] = { stats, streak }
      }
      setUserStats(statsMap)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedUser) { setUserDetails(null); return }
    async function loadDetails() {
      const [stats, results, streak] = await Promise.all([
        getStatsForUser(selectedUser.id),
        getResultsForUser(selectedUser.id),
        getStreakForUser(selectedUser.id),
      ])
      let totalTime = 0
      results.forEach((r) => {
        if (r.questions && r.timestamp) totalTime += (r.questions * 45)
      })
      setUserDetails({ stats, results, streak, totalTime })
    }
    loadDetails()
  }, [selectedUser])

  const regularUsers = users.filter((u) => u.role !== 'admin')

  async function handleLogout() {
    if (onLogout) await onLogout()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin border-2 border-white/10 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <span className="text-base font-black uppercase tracking-tight text-text sm:text-lg">Admin Dashboard</span>
          <div className="flex items-center gap-4">
            <span onClick={() => navigate('/analytics')}
              className="cursor-pointer text-sm font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text">Analytics</span>
            <button onClick={handleLogout}
              className="border border-error/20 bg-error/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-error transition-all hover:bg-error/10 active:translate-x-[1px] active:translate-y-[1px]">
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <h1 className="mb-5 text-xl font-black uppercase tracking-tighter text-text sm:mb-6 sm:text-2xl">User Management</h1>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-4">
          <div className="border-2 border-white/10 bg-surface-lowest p-3 sm:p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Total Users</p>
            <p className="mt-0.5 text-lg font-black text-text sm:mt-1 sm:text-2xl">{regularUsers.length}</p>
          </div>
          <div className="border-2 border-white/10 bg-surface-lowest p-3 sm:p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Active Today</p>
            <p className="mt-0.5 text-lg font-black text-success sm:mt-1 sm:text-2xl">
              {regularUsers.filter((u) => (userStats[u.id]?.streak?.current || 0) > 0).length}
            </p>
          </div>
          <div className="col-span-2 border-2 border-white/10 bg-surface-lowest p-3 sm:col-span-1 sm:p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Total Tests</p>
            <p className="mt-0.5 text-lg font-black text-primary-light sm:mt-1 sm:text-2xl">
              {regularUsers.reduce((a, u) => a + (userStats[u.id]?.stats?.testsCompleted || 0), 0)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_400px]">
          <div className="border-2 border-white/10 bg-surface-lowest">
            <div className="border-b border-white/[0.05] px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-text sm:text-sm">All Users</h3>
            </div>
            {regularUsers.length === 0 ? (
              <div className="px-4 pb-5 sm:px-5">
                <p className="text-sm text-text-muted">No registered users yet.</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                {regularUsers.map((u) => {
                  const uStats = userStats[u.id]?.stats || {}
                  const uStreak = userStats[u.id]?.streak || { current: 0 }
                  const av = getAvatarStyle(u.avatar || 0)
                  const active = selectedUser?.id === u.id
                  return (
                    <button key={u.id} onClick={() => setSelectedUser(u)}
                      className={`flex w-full items-center gap-3 border-t border-white/[0.05] px-4 py-3 text-left transition-colors sm:px-5 ${active ? 'bg-primary/[0.06]' : 'hover:bg-white/[0.02]'}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-white/10 text-xs font-black"
                        style={{ backgroundColor: av.bg, color: av.text }}>
                        {(u.displayName || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-text sm:text-sm">{u.displayName || u.username}</p>
                        <p className="text-[10px] text-text-muted">@{u.username} · {uStats.testsCompleted || 0} tests</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-text">{uStats.totalCorrect || 0}</p>
                        <p className="text-[9px] text-text-muted">{uStreak.current}d streak</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedUser && userDetails && (
            <div className="space-y-3 sm:space-y-4">
              <div className="border-2 border-white/10 bg-surface-lowest p-4 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)] sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center border-2 border-white/10 text-sm font-black"
                    style={{ backgroundColor: getAvatarStyle(selectedUser.avatar || 0).bg, color: getAvatarStyle(selectedUser.avatar || 0).text }}>
                    {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-text">{selectedUser.displayName}</p>
                    <p className="text-[10px] text-text-muted">@{selectedUser.username} · Joined {selectedUser.createdAt?.slice(0, 10)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border-2 border-white/10 bg-surface-lowest p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Solved</p>
                  <p className="mt-0.5 text-lg font-black text-success">{userDetails.stats.totalCorrect || 0}</p>
                </div>
                <div className="border-2 border-white/10 bg-surface-lowest p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Attempted</p>
                  <p className="mt-0.5 text-lg font-black text-text">{userDetails.stats.totalAttempted || 0}</p>
                </div>
                <div className="border-2 border-white/10 bg-surface-lowest p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Tests</p>
                  <p className="mt-0.5 text-lg font-black text-text">{userDetails.stats.testsCompleted || 0}</p>
                </div>
                <div className="border-2 border-white/10 bg-surface-lowest p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Streak</p>
                  <p className="mt-0.5 text-lg font-black text-text">{userDetails.streak.current} 🔥</p>
                </div>
                <div className="border-2 border-white/10 bg-surface-lowest p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Accuracy</p>
                  <p className="mt-0.5 text-lg font-black text-primary-light">
                    {userDetails.stats.totalAttempted > 0 ? Math.round((userDetails.stats.totalCorrect / userDetails.stats.totalAttempted) * 100) : 0}%
                  </p>
                </div>
                <div className="border-2 border-white/10 bg-surface-lowest p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Est. Time</p>
                  <p className="mt-0.5 text-lg font-black text-text">{Math.round(userDetails.totalTime / 60)}m</p>
                </div>
              </div>

              {userDetails.results.length > 0 && (
                <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-5">
                  <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-text">Recent Sessions</h4>
                  <div className="max-h-[200px] space-y-1 overflow-y-auto">
                    {userDetails.results.slice(0, 10).map((r) => (
                      <div key={r.id} className="flex items-center justify-between border-b border-white/[0.03] px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-bold text-text">{r.subject}</p>
                          <p className="text-[9px] text-text-muted">{r.date} · {r.questions}Q</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-text">{r.score}</p>
                          <p className={`text-[9px] font-bold ${r.accuracy >= 80 ? 'text-success' : r.accuracy >= 60 ? 'text-warning' : 'text-error'}`}>{r.accuracy}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
