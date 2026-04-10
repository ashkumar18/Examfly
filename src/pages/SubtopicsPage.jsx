import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getQuestionsBySubject, getQuestionsBySubtopic, getSubtopicCounts } from '../db/seedData'
import { SUBJECT_MAP, SUBJECT_KEYS, shuffleArray } from '../lib/utils'
import useTestStore from '../store/useTestStore'

const SUBTOPICS = {
  Maths: ['Profit & Loss', 'Simple Interest', 'Compound Interest', 'CI & SI Mixed', 'Mixture & Alligation', 'Percentage', 'Ratio & Proportion', 'Time & Work', 'Time Speed Distance', 'Number System', 'Algebra', 'Geometry', 'Trigonometry', 'Mensuration', 'Statistics & DI'],
  English: ['Reading Comprehension', 'Cloze Test', 'Error Spotting', 'Sentence Improvement', 'Fill in the Blanks', 'Para Jumbles', 'Idioms & Phrases', 'One Word Substitution', 'Synonyms', 'Antonyms', 'Spelling Correction', 'Active Passive Voice', 'Direct Indirect Speech'],
  GK: ['History', 'Geography', 'Polity', 'Economy', 'Science & Technology', 'Biology', 'Physics', 'Chemistry', 'Current Affairs', 'Sports', 'Books & Authors', 'Awards & Honours'],
  Reasoning: ['Analogy', 'Classification', 'Series', 'Coding-Decoding', 'Blood Relations', 'Direction Sense', 'Syllogism', 'Puzzles', 'Seating Arrangement', 'Matrix', 'Venn Diagram', 'Non-Verbal Reasoning', 'Mirror Image', 'Counting Figures', 'Mathematical Operations'],
  Computer: ['Computer Fundamentals', 'Operating Systems', 'MS Office', 'Networking', 'Internet & Web', 'Database Management', 'Computer Security', 'Data Representation', 'Software Engineering', 'Computer Architecture'],
}

const SUBJECT_ACCENTS = {
  Maths: { border: 'border-primary', shadow: 'shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)]', bg: 'bg-primary/[0.04]' },
  English: { border: 'border-success', shadow: 'shadow-[3px_3px_0px_0px_rgba(34,197,94,0.3)]', bg: 'bg-success/[0.04]' },
  GK: { border: 'border-warning', shadow: 'shadow-[3px_3px_0px_0px_rgba(245,158,11,0.3)]', bg: 'bg-warning/[0.04]' },
  Reasoning: { border: 'border-purple', shadow: 'shadow-[3px_3px_0px_0px_rgba(168,85,247,0.3)]', bg: 'bg-purple/[0.04]' },
  Computer: { border: 'border-cyan-400', shadow: 'shadow-[3px_3px_0px_0px_rgba(34,211,238,0.3)]', bg: 'bg-cyan-400/[0.04]' },
}

export default function SubtopicsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setQuestions = useTestStore((s) => s.setQuestions)

  const preselect = location.state?.preselect
  const [selectedSubjects, setSelectedSubjects] = useState(new Set(preselect ? [preselect] : []))
  const [selectedSubtopics, setSelectedSubtopics] = useState(new Set())
  const [questionCount, setQuestionCount] = useState(25)
  const [timeMinutes, setTimeMinutes] = useState(20)
  const [preparing, setPreparing] = useState(false)
  const [expanded, setExpanded] = useState(preselect || null)
  const [subtopicCounts, setSubtopicCounts] = useState({})

  const visibleSubjects = preselect ? [preselect] : SUBJECT_KEYS

  useEffect(() => {
    async function loadCounts() {
      const counts = {}
      const subjects = preselect ? [preselect] : SUBJECT_KEYS
      for (const s of subjects) counts[s] = await getSubtopicCounts(s, SUBTOPICS[s])
      setSubtopicCounts(counts)
    }
    loadCounts()
  }, [preselect])

  function toggleSubject(s) {
    const next = new Set(selectedSubjects)
    if (next.has(s)) {
      next.delete(s)
      const nst = new Set(selectedSubtopics)
      SUBTOPICS[s].forEach((st) => nst.delete(`${s}:${st}`))
      setSelectedSubtopics(nst)
    } else {
      next.add(s)
    }
    setSelectedSubjects(next)
  }

  function toggleSubtopic(subject, subtopic) {
    const key = `${subject}:${subtopic}`
    const next = new Set(selectedSubtopics)
    if (next.has(key)) next.delete(key)
    else {
      next.add(key)
      setSelectedSubjects(new Set([...selectedSubjects, subject]))
    }
    setSelectedSubtopics(next)
  }

  async function beginExam() {
    if (selectedSubjects.size === 0) return
    setPreparing(true)
    let all = []
    if (selectedSubtopics.size > 0) {
      for (const key of selectedSubtopics) {
        const [s, st] = key.split(':')
        all.push(...(await getQuestionsBySubtopic(s, st, 200)))
      }
    } else {
      for (const s of selectedSubjects) all.push(...(await getQuestionsBySubject(s, 200)))
    }
    const selected = shuffleArray(all).slice(0, questionCount)
    if (selected.length === 0) { setPreparing(false); return }
    const label = selectedSubjects.size === 1 ? SUBJECT_MAP[[...selectedSubjects][0]] : 'Mixed'
    setQuestions(selected, label, 'Mixed', timeMinutes * 60)
    navigate('/test')
  }

  return (
    <div className="min-h-screen bg-bg pb-28 sm:pb-8">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b-2 border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <button onClick={() => navigate('/')}
            className="border border-white/10 bg-surface-lowest px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted transition-all hover:text-text active:bg-surface">
            ← Back
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-text">
            {preselect ? SUBJECT_MAP[preselect] : 'Configure Session'}
          </span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Mobile parameters */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:hidden">
          <div className="border-2 border-white/10 bg-surface-lowest p-4">
            <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Questions</label>
            <input type="number" value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="mt-1.5 block w-full bg-transparent px-0 py-1 text-xl font-black text-text outline-none" />
          </div>
          <div className="border-2 border-white/10 bg-surface-lowest p-4">
            <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Time (min)</label>
            <input type="number" value={timeMinutes}
              onChange={(e) => setTimeMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
              className="mt-1.5 block w-full bg-transparent px-0 py-1 text-xl font-black text-text outline-none" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-4 sm:text-sm">
              {preselect ? 'Select Topics' : 'Select Subjects & Topics'}
            </h2>
            <div className="space-y-2">
              {visibleSubjects.map((s) => {
                const accent = SUBJECT_ACCENTS[s] || SUBJECT_ACCENTS.Maths
                return (
                  <div key={s} className="border-2 border-white/10 bg-surface-lowest">
                    <button
                      className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left transition-colors active:bg-surface sm:gap-3 sm:px-5 sm:py-4"
                      onClick={() => { toggleSubject(s); setExpanded(expanded === s ? null : s) }}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center ${selectedSubjects.has(s) ? 'bg-primary' : 'border-2 border-white/20'}`}>
                        {selectedSubjects.has(s) && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-black uppercase tracking-wider text-text">{SUBJECT_MAP[s]}</span>
                      <span className="shrink-0 text-[10px] font-bold text-text-muted">{SUBTOPICS[s].length} topics</span>
                      <svg className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${expanded === s ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {expanded === s && (
                      <div className="border-t border-white/[0.05] px-3 py-3 sm:px-5 sm:py-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
                          {SUBTOPICS[s].map((st) => {
                            const key = `${s}:${st}`
                            const active = selectedSubtopics.has(key)
                            const count = subtopicCounts[s]?.[st] ?? '...'
                            return (
                              <button key={key} onClick={(e) => { e.stopPropagation(); toggleSubtopic(s, st) }}
                                className={`relative flex flex-col items-start border-2 border-l-[3px] p-3 text-left transition-all sm:p-3.5 ${
                                  active
                                    ? `${accent.border} ${accent.bg} ${accent.shadow}`
                                    : 'border-white/[0.06] bg-bg hover:bg-white/[0.02]'
                                }`}
                              >
                                <div className={`absolute right-2 top-2 flex h-4 w-4 items-center justify-center ${active ? 'bg-primary' : 'border border-white/20'}`}>
                                  {active && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={`text-xs font-bold sm:text-sm ${active ? 'text-text' : 'text-text-muted'}`}>{st}</span>
                                <span className={`mt-0.5 text-[10px] font-bold ${active ? 'text-primary-light' : 'text-text-muted/50'}`}>{count} Questions</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Desktop Parameters */}
          <div className="hidden space-y-4 sm:block">
            <div className="border-2 border-white/10 bg-surface-lowest p-5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Questions</label>
              <input type="number" value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="mt-2 block w-full border-b-2 border-white/10 bg-transparent px-0 py-3 text-3xl font-black text-text outline-none transition-colors focus:border-primary/40" />
            </div>
            <div className="border-2 border-white/10 bg-surface-lowest p-5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Time (minutes)</label>
              <input type="number" value={timeMinutes}
                onChange={(e) => setTimeMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
                className="mt-2 block w-full border-b-2 border-white/10 bg-transparent px-0 py-3 text-3xl font-black text-text outline-none transition-colors focus:border-primary/40" />
            </div>
            <button onClick={beginExam} disabled={selectedSubjects.size === 0 || preparing}
              className="w-full border-2 border-primary bg-primary/10 py-4 text-sm font-black uppercase tracking-widest text-primary-light shadow-[3px_3px_0px_0px_rgba(99,102,241,0.4)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed">
              {preparing ? 'Preparing...' : 'Begin Exam'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white/10 bg-bg/95 px-4 py-3 backdrop-blur-xl sm:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button onClick={beginExam} disabled={selectedSubjects.size === 0 || preparing}
          className="w-full border-2 border-primary bg-primary/10 py-3.5 text-sm font-black uppercase tracking-widest text-primary-light transition-all active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-30">
          {preparing ? 'Preparing...' : 'Begin Exam'}
        </button>
      </div>
    </div>
  )
}
