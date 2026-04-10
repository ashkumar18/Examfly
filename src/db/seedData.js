import { db } from './db'
import mathsData from '../data/maths.json'
import englishData from '../data/english.json'
import gkData from '../data/gk.json'
import reasoningData from '../data/reasoning.json'
import computerData from '../data/computer.json'

const SEED_VERSION = '3'

export async function seedDatabase() {
  const seededVersion = localStorage.getItem('db_seeded')
  if (seededVersion === SEED_VERSION) return false

  const allQuestions = [
    ...mathsData,
    ...englishData,
    ...gkData,
    ...reasoningData,
    ...computerData,
  ]

  await db.questions.clear()
  await db.questions.bulkPut(allQuestions)
  localStorage.setItem('db_seeded', SEED_VERSION)
  return true
}

export async function getQuestionCount(subject) {
  return db.questions.where('subject').equals(subject).count()
}

export async function getSubtopicCount(subject, subtopic) {
  return db.questions
    .where('[subject+subtopic]')
    .equals([subject, subtopic])
    .count()
    .catch(() => db.questions.where('subject').equals(subject).filter((q) => q.subtopic === subtopic).count())
}

export async function getQuestionsBySubtopic(subject, subtopic, limit = 25) {
  const questions = await db.questions
    .where('subject')
    .equals(subject)
    .filter((q) => q.subtopic === subtopic)
    .toArray()

  const shuffled = questions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
}

export async function getQuestionsBySubject(subject, limit = 25) {
  const questions = await db.questions
    .where('subject')
    .equals(subject)
    .toArray()

  const shuffled = questions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
}

export async function getSubtopicCounts(subject, subtopics) {
  const counts = {}
  for (const st of subtopics) {
    counts[st] = await db.questions
      .where('subject')
      .equals(subject)
      .filter((q) => q.subtopic === st)
      .count()
  }
  return counts
}

export async function getQuestionsByIds(ids) {
  if (!ids || ids.length === 0) return []
  const questions = await db.questions.where('id').anyOf(ids).toArray()
  return questions
}
