import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const SUBJECT_MAP = {
  Maths: 'Quantitative Aptitude',
  English: 'English Comprehension',
  GK: 'General Awareness',
  Reasoning: 'General Intelligence',
  Computer: 'Computer Knowledge',
}

export const SUBJECT_KEYS = ['Maths', 'English', 'GK', 'Reasoning', 'Computer']

export function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function checkPasswordStrength(pw) {
  const checks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
  const passed = Object.values(checks).filter(Boolean).length
  let level = 'weak'
  if (passed >= 4) level = 'strong'
  else if (passed >= 3 && checks.length) level = 'medium'

  const suggestions = []
  if (!checks.length) suggestions.push('At least 8 characters')
  if (!checks.uppercase) suggestions.push('Add an uppercase letter (A-Z)')
  if (!checks.lowercase) suggestions.push('Add a lowercase letter (a-z)')
  if (!checks.number) suggestions.push('Add a number (0-9)')
  if (!checks.special) suggestions.push('Add a special character (!@#$)')

  return { level, passed, total: 5, checks, suggestions }
}

export function calculateScore(questions, selectedAnswers) {
  let correct = 0
  let wrong = 0
  let unattempted = 0

  questions.forEach((q) => {
    const userAnswer = selectedAnswers[q.id]
    if (!userAnswer) {
      unattempted++
    } else if (userAnswer === q.correct) {
      correct++
    } else {
      wrong++
    }
  })

  const score = correct * 1 - wrong * (1 / 3)
  const accuracy = correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0

  return {
    correct,
    wrong,
    unattempted,
    score: Math.round(score * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
  }
}
