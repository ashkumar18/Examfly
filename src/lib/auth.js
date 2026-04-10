import { supabase } from './supabase'

const EMAIL_DOMAIN = 'sscprepzone.app'

function toEmail(username) {
  return `${username.toLowerCase().trim()}@${EMAIL_DOMAIN}`
}

let _cachedSession = null
let _signupInProgress = false

export function getCachedSession() {
  return _cachedSession
}

export function setCachedSession(session) {
  _cachedSession = session
}

export async function initAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const profile = await fetchProfile(session.user.id)
      if (profile) {
        _cachedSession = {
          id: session.user.id,
          username: profile.username,
          displayName: profile.display_name,
          role: profile.role,
          avatar: profile.avatar ?? 0,
        }
        return _cachedSession
      }
    }
  } catch (err) {
    console.error('initAuth failed:', err)
  }
  _cachedSession = null
  return null
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        _cachedSession = null
        callback(null)
        return
      }
      if (_signupInProgress) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await fetchProfile(session.user.id)
        if (profile) {
          _cachedSession = {
            id: session.user.id,
            username: profile.username,
            displayName: profile.display_name,
            role: profile.role,
            avatar: profile.avatar ?? 0,
          }
          callback(_cachedSession)
        }
      }
    }
  )
  return subscription
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export function getSession() {
  return _cachedSession
}

export function isAdmin() {
  return _cachedSession?.role === 'admin'
}

export async function checkUsernameAvailable(username) {
  if (!username || username.length < 3) return { available: false, error: 'Minimum 3 characters' }
  const key = username.toLowerCase().trim()
  if (key === 'admin') return { available: false, error: 'Reserved username' }
  if (!/^[a-z0-9_]+$/.test(key)) return { available: false, error: 'Only letters, numbers, underscores' }

  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', key)
    .maybeSingle()
  if (data) return { available: false, error: 'Username taken' }
  return { available: true }
}

export async function suggestUsernames(base) {
  const clean = (base || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')
  const suffixes = [
    Math.floor(Math.random() * 900) + 100,
    '_ssc',
    Math.floor(Math.random() * 99) + 1,
    '_prep',
    '_ace',
  ]
  const candidates = suffixes.map((s) => clean + s).filter((c) => c.length >= 3)

  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .in('username', candidates)
  const taken = new Set((existing || []).map((r) => r.username))
  return candidates.filter((c) => !taken.has(c)).slice(0, 3)
}

export function isSignupInProgress() {
  return _signupInProgress
}

export async function createAccount(username, password, displayName) {
  if (!username || !password || username.length < 3) {
    return { success: false, error: 'Username must be 3+ chars' }
  }
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }
  const key = username.toLowerCase().trim()
  if (key === 'admin') return { success: false, error: 'Reserved username' }
  if (!/^[a-z0-9_]+$/.test(key)) return { success: false, error: 'Only letters, numbers, underscores allowed' }

  const avail = await checkUsernameAvailable(key)
  if (!avail.available) return { success: false, error: avail.error }

  _signupInProgress = true
  try {
    const avatarIdx = Math.floor(Math.random() * 8)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: toEmail(key),
      password,
      options: {
        data: {
          username: key,
          display_name: displayName || username,
          avatar: avatarIdx,
        },
      },
    })

    if (authError) {
      if (authError.message?.includes('already registered')) {
        return { success: false, error: 'This username is already taken. Try a different one.' }
      }
      return { success: false, error: authError.message }
    }

    const userId = authData.user?.id
    if (!userId) return { success: false, error: 'Signup failed — no user ID returned' }

    let retries = 0
    while (retries < 5) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      if (profile) return { success: true }
      await new Promise((r) => setTimeout(r, 400))
      retries++
    }

    return { success: true }
  } finally {
    _signupInProgress = false
  }
}

export async function login(username, password) {
  const key = username.toLowerCase().trim()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(key),
    password,
  })
  if (error) {
    if (error.message.includes('Invalid login')) {
      return { success: false, error: 'Invalid username or password' }
    }
    return { success: false, error: error.message }
  }

  let profile = null
  let retries = 0
  while (retries < 3) {
    profile = await fetchProfile(data.user.id)
    if (profile) break
    await new Promise((r) => setTimeout(r, 300))
    retries++
  }

  if (!profile) {
    return { success: false, error: 'Unable to load profile. Please try again.' }
  }

  const session = {
    id: data.user.id,
    username: profile.username,
    displayName: profile.display_name,
    role: profile.role,
    avatar: profile.avatar ?? 0,
  }
  _cachedSession = session
  return { success: true, session }
}

export async function logout() {
  _cachedSession = null
  await supabase.auth.signOut()
}

export async function changePassword(username, oldPassword, newPassword) {
  if (newPassword.length < 4) return { success: false, error: 'New password must be 4+ chars' }
  const key = username.toLowerCase().trim()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: toEmail(key),
    password: oldPassword,
  })
  if (signInError) return { success: false, error: 'Current password is incorrect' }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) return { success: false, error: updateError.message }
  return { success: true }
}

export async function getAllUsersForAdmin() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
  if (error) return []
  return data.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    role: u.role,
    createdAt: u.created_at,
    avatar: u.avatar ?? 0,
  }))
}

const AVATARS = [
  { bg: '#6366f1', text: 'white' },
  { bg: '#22c55e', text: 'white' },
  { bg: '#f59e0b', text: 'white' },
  { bg: '#a855f7', text: 'white' },
  { bg: '#f43f5e', text: 'white' },
  { bg: '#22d3ee', text: '#131315' },
  { bg: '#fb923c', text: 'white' },
  { bg: '#e879f9', text: '#131315' },
]

export function getAvatarStyle(index) {
  return AVATARS[index % AVATARS.length]
}
