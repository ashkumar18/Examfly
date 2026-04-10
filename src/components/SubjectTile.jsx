import { useNavigate } from 'react-router-dom'
import { Calculator, BookOpen, Globe, Brain } from 'lucide-react'
import { cn, SUBJECT_COLORS } from '../lib/utils'

const icons = {
  Maths: Calculator,
  English: BookOpen,
  GK: Globe,
  Reasoning: Brain,
}

const gradients = {
  Maths: 'from-blue-600/30 to-blue-800/50',
  English: 'from-green-600/30 to-green-800/50',
  GK: 'from-orange-600/30 to-orange-800/50',
  Reasoning: 'from-purple-600/30 to-purple-800/50',
}

const borders = {
  Maths: 'border-blue-500/30 hover:border-blue-400/60',
  English: 'border-green-500/30 hover:border-green-400/60',
  GK: 'border-orange-500/30 hover:border-orange-400/60',
  Reasoning: 'border-purple-500/30 hover:border-purple-400/60',
}

const glows = {
  Maths: 'hover:shadow-blue-500/20',
  English: 'hover:shadow-green-500/20',
  GK: 'hover:shadow-orange-500/20',
  Reasoning: 'hover:shadow-purple-500/20',
}

export default function SubjectTile({ subject, count }) {
  const navigate = useNavigate()
  const Icon = icons[subject]
  const color = SUBJECT_COLORS[subject]

  return (
    <button
      onClick={() => navigate(`/subject/${subject}`)}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 md:p-8',
        'bg-gradient-to-br transition-all duration-300 cursor-pointer',
        'hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]',
        'flex flex-col items-center justify-center gap-4 text-center',
        'min-h-[180px] md:min-h-[220px]',
        gradients[subject],
        borders[subject],
        glows[subject]
      )}
    >
      <div
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: color }}
      />
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold text-white md:text-2xl">
          {subject}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {count} Questions
        </p>
      </div>
    </button>
  )
}
