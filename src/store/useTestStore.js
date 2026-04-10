import { create } from 'zustand'

const useTestStore = create((set, get) => ({
  questions: [],
  currentIndex: 0,
  selectedAnswers: {},
  markedForReview: new Set(),
  testStartTime: null,
  timeRemaining: 1200,
  subject: '',
  subtopic: '',
  testActive: false,

  setQuestions: (questions, subject, subtopic, timeSeconds = 1200) =>
    set({
      questions,
      currentIndex: 0,
      selectedAnswers: {},
      markedForReview: new Set(),
      testStartTime: Date.now(),
      timeRemaining: timeSeconds,
      subject,
      subtopic,
      testActive: true,
    }),

  selectAnswer: (questionId, answer) =>
    set((state) => {
      const prev = state.selectedAnswers[questionId]
      if (prev === answer) {
        const next = { ...state.selectedAnswers }
        delete next[questionId]
        return { selectedAnswers: next }
      }
      return { selectedAnswers: { ...state.selectedAnswers, [questionId]: answer } }
    }),

  toggleMarkForReview: (questionId) =>
    set((state) => {
      const newMarked = new Set(state.markedForReview)
      if (newMarked.has(questionId)) {
        newMarked.delete(questionId)
      } else {
        newMarked.add(questionId)
      }
      return { markedForReview: newMarked }
    }),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),

  jumpToQuestion: (index) => set({ currentIndex: index }),

  decrementTimer: () =>
    set((state) => ({
      timeRemaining: Math.max(state.timeRemaining - 1, 0),
    })),

  resetTest: () =>
    set({
      questions: [],
      currentIndex: 0,
      selectedAnswers: {},
      markedForReview: new Set(),
      testStartTime: null,
      timeRemaining: 1200,
      subject: '',
      subtopic: '',
      testActive: false,
    }),
}))

export default useTestStore
