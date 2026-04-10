import Dexie from 'dexie'

export const db = new Dexie('SSCQuestionBank')

db.version(1).stores({
  questions: 'id, subject, subtopic, exam, level, year',
})
