import { supabase } from './supabase'
import { getCachedSession } from './auth'

function getUserId() {
  return getCachedSession()?.id || null
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export async function recordSession(questionsCount, correctCount, wrongCount, subject, questions, selectedAnswers) {
  const userId = getUserId()
  if (!userId) return

  const today = todayStr()
  const subjectBreakdown = {}
  if (questions && selectedAnswers) {
    questions.forEach((q) => {
      const s = q.subject
      if (!subjectBreakdown[s]) subjectBreakdown[s] = { total: 0, correct: 0, wrong: 0, unattempted: 0 }
      subjectBreakdown[s].total++
      const ua = selectedAnswers[q.id]
      if (!ua) subjectBreakdown[s].unattempted++
      else if (ua === q.correct) subjectBreakdown[s].correct++
      else subjectBreakdown[s].wrong++
    })
  }

  const resultRow = {
    user_id: userId,
    subject,
    score: Math.round((correctCount - wrongCount / 3) * 100) / 100,
    correct: correctCount,
    wrong: wrongCount,
    unattempted: questionsCount - correctCount - wrongCount,
    accuracy: questionsCount > 0 ? Math.round((correctCount / questionsCount) * 100) : 0,
    total_questions: questionsCount,
    time_taken_seconds: 0,
    subject_breakdown: subjectBreakdown,
    question_data: questions
      ? questions.map((q) => ({
          id: q.id, subject: q.subject, subtopic: q.subtopic, exam: q.exam,
          question: q.question, options: q.options, correct: q.correct, explanation: q.explanation,
        }))
      : [],
    selected_answers: selectedAnswers ? { ...selectedAnswers } : {},
    taken_at: new Date().toISOString(),
  }

  await supabase.from('test_results').insert(resultRow)

  const { data: streakRow } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (streakRow) {
    const lastDate = streakRow.last_active_date
    let newCurrent = streakRow.current_streak
    if (lastDate !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().slice(0, 10)
      newCurrent = lastDate === yStr ? newCurrent + 1 : 1
    }
    const newLongest = Math.max(streakRow.longest_streak, newCurrent)
    await supabase.from('streaks').update({
      current_streak: newCurrent,
      longest_streak: newLongest,
      last_active_date: today,
    }).eq('user_id', userId)
  } else {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
    })
  }

  if (questions && selectedAnswers) {
    const questionIds = questions.map((q) => q.id)
    const { data: existing } = await supabase
      .from('mastery')
      .select('*')
      .eq('user_id', userId)
      .in('question_id', questionIds)

    const existingMap = {}
    ;(existing || []).forEach((m) => { existingMap[m.question_id] = m })

    const toInsert = []
    const toUpdate = []

    questions.forEach((q) => {
      const ua = selectedAnswers[q.id]
      const prev = existingMap[q.id]

      if (prev) {
        const isCorrect = ua && ua === q.correct
        const isWrong = ua && ua !== q.correct
        const newRight = prev.right_count + (isCorrect ? 1 : 0)
        const newWrong = prev.wrong_count + (isWrong ? 1 : 0)
        let newStreak = prev.correct_streak
        if (isCorrect) newStreak = Math.max(0, prev.correct_streak) + 1
        else if (isWrong) newStreak = 0

        toUpdate.push({
          id: prev.id,
          right_count: newRight,
          wrong_count: newWrong,
          correct_streak: newStreak,
          last_seen: new Date().toISOString(),
        })
      } else {
        const isCorrect = ua && ua === q.correct
        const isWrong = ua && ua !== q.correct
        toInsert.push({
          user_id: userId,
          question_id: q.id,
          subject: q.subject,
          subtopic: q.subtopic,
          right_count: isCorrect ? 1 : 0,
          wrong_count: isWrong ? 1 : 0,
          correct_streak: isCorrect ? 1 : 0,
          last_seen: new Date().toISOString(),
        })
      }
    })

    if (toInsert.length > 0) {
      await supabase.from('mastery').insert(toInsert)
    }
    for (const row of toUpdate) {
      await supabase.from('mastery').update({
        right_count: row.right_count,
        wrong_count: row.wrong_count,
        correct_streak: row.correct_streak,
        last_seen: row.last_seen,
      }).eq('id', row.id)
    }
  }
}

export async function getStats() {
  const userId = getUserId()
  const empty = { totalSolved: 0, totalCorrect: 0, totalAttempted: 0, totalWrong: 0, testsCompleted: 0 }
  if (!userId) return empty

  const { data: results } = await supabase
    .from('test_results')
    .select('correct, wrong, total_questions')
    .eq('user_id', userId)

  if (!results || results.length === 0) return empty

  let totalCorrect = 0, totalWrong = 0, totalAttempted = 0
  results.forEach((r) => {
    totalCorrect += r.correct || 0
    totalWrong += r.wrong || 0
    totalAttempted += (r.correct || 0) + (r.wrong || 0)
  })

  return { totalSolved: totalCorrect, totalCorrect, totalAttempted, totalWrong, testsCompleted: results.length }
}

export async function getStreak() {
  const userId = getUserId()
  if (!userId) return { current: 0, max: 0 }

  const { data } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return { current: 0, max: 0 }

  const today = todayStr()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().slice(0, 10)

  if (data.last_active_date !== today && data.last_active_date !== yStr) {
    return { current: 0, max: data.longest_streak || 0 }
  }
  return { current: data.current_streak || 0, max: data.longest_streak || 0 }
}

export async function getHeatmapData(days = 182) {
  const userId = getUserId()
  const result = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    result.push({ date: k, count: 0, day: d.getDay(), month: d.getMonth(), monthName: d.toLocaleString('default', { month: 'short' }) })
  }

  if (!userId) return result

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days)

  const { data: results } = await supabase
    .from('test_results')
    .select('correct, wrong, taken_at')
    .eq('user_id', userId)
    .gte('taken_at', startDate.toISOString())

  if (results) {
    const dateMap = {}
    result.forEach((r, i) => { dateMap[r.date] = i })
    results.forEach((r) => {
      const d = r.taken_at.slice(0, 10)
      if (dateMap[d] !== undefined) {
        result[dateMap[d]].count += (r.correct || 0) + (r.wrong || 0)
      }
    })
  }

  return result
}

export async function getRecentTests(limit = 5) {
  const userId = getUserId()
  if (!userId) return []

  const { data } = await supabase
    .from('test_results')
    .select('subject, correct, total_questions, accuracy, taken_at')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(limit)

  if (!data) return []
  return data.map((r) => ({
    date: r.taken_at.slice(0, 10),
    subject: r.subject,
    questions: r.total_questions,
    score: r.correct,
    accuracy: r.accuracy,
  }))
}

export async function getAllResults() {
  const userId = getUserId()
  if (!userId) return []

  const { data } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(100)

  if (!data) return []
  return data.map(mapResultRow)
}

function mapResultRow(r) {
  return {
    id: r.id,
    date: (r.taken_at || '').slice(0, 10),
    timestamp: new Date(r.taken_at || 0).getTime(),
    subject: r.subject,
    questions: r.total_questions,
    correct: r.correct,
    wrong: r.wrong,
    unattempted: r.unattempted,
    accuracy: r.accuracy,
    score: r.score,
    subjectBreakdown: r.subject_breakdown || {},
    questionData: r.question_data || [],
    selectedAnswers: r.selected_answers || {},
  }
}

export async function getQuestionHistory() {
  const userId = getUserId()
  if (!userId) return {}

  const { data } = await supabase
    .from('mastery')
    .select('*')
    .eq('user_id', userId)

  if (!data) return {}
  const history = {}
  data.forEach((m) => {
    history[m.question_id] = {
      subject: m.subject,
      subtopic: m.subtopic,
      right: m.right_count,
      wrong: m.wrong_count,
      streak: m.correct_streak,
      lastSeen: m.last_seen?.slice(0, 10) || '',
    }
  })
  return history
}

export function classifyQuestion(h) {
  const total = h.right + h.wrong
  if (total === 0) return 'unseen'
  const streak = h.streak || 0
  if (streak >= 5) return 'mastered'
  const ratio = h.right / total
  if (ratio >= 0.5 && total >= 2) return 'learning'
  return 'weak'
}

export async function getWeakQuestionIds(subject) {
  const history = await getQuestionHistory()
  return Object.entries(history)
    .filter(([, h]) => { if (subject && h.subject !== subject) return false; return h.wrong > 0 && h.wrong >= h.right })
    .sort(([, a], [, b]) => (b.wrong - b.right) - (a.wrong - a.right))
    .map(([id]) => id)
}

export async function getQuestionMasteryStats() {
  const history = await getQuestionHistory()
  const entries = Object.entries(history)
  if (entries.length === 0) return null

  let mastered = 0, learning = 0, weak = 0, unseen = 0
  const mostMissed = []

  entries.forEach(([id, h]) => {
    const cat = classifyQuestion(h)
    if (cat === 'unseen') unseen++
    else if (cat === 'mastered') mastered++
    else if (cat === 'learning') learning++
    else weak++
    if (h.wrong > 0) {
      const total = h.right + h.wrong
      mostMissed.push({ id, ...h, total, ratio: h.right / total })
    }
  })

  mostMissed.sort((a, b) => b.wrong - a.wrong || a.ratio - b.ratio)

  return { total: entries.length, mastered, learning, weak, unseen, mostMissed: mostMissed.slice(0, 10) }
}

export async function getStatsForUser(userId) {
  const { data: results } = await supabase
    .from('test_results')
    .select('correct, wrong, total_questions')
    .eq('user_id', userId)

  if (!results || results.length === 0) {
    return { totalSolved: 0, totalCorrect: 0, totalAttempted: 0, totalWrong: 0, testsCompleted: 0 }
  }

  let totalCorrect = 0, totalWrong = 0, totalAttempted = 0
  results.forEach((r) => {
    totalCorrect += r.correct || 0
    totalWrong += r.wrong || 0
    totalAttempted += (r.correct || 0) + (r.wrong || 0)
  })

  return { totalSolved: totalCorrect, totalCorrect, totalAttempted, totalWrong, testsCompleted: results.length }
}

export async function getResultsForUser(userId) {
  const { data } = await supabase
    .from('test_results')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(100)

  if (!data) return []
  return data.map(mapResultRow)
}

export async function getStreakForUser(userId) {
  const { data } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return { current: 0, max: 0 }

  const today = todayStr()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().slice(0, 10)

  if (data.last_active_date !== today && data.last_active_date !== yStr) {
    return { current: 0, max: data.longest_streak || 0 }
  }
  return { current: data.current_streak || 0, max: data.longest_streak || 0 }
}
