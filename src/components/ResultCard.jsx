import { CheckCircle, XCircle, Circle, Zap } from 'lucide-react'

export default function ResultCard({ correct, wrong, unattempted, score, accuracy, total }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/80 p-8">
        <p className="text-sm text-slate-400">Your Score</p>
        <p className="mt-2 font-display text-5xl font-bold text-white">
          {score} <span className="text-2xl text-slate-500">/ {total}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatItem icon={CheckCircle} label="Correct" value={correct} color="text-green-400" bg="bg-green-500/10" />
        <StatItem icon={XCircle} label="Wrong" value={wrong} color="text-red-400" bg="bg-red-500/10" />
        <StatItem icon={Circle} label="Unattempted" value={unattempted} color="text-slate-400" bg="bg-slate-500/10" />
        <StatItem icon={Zap} label="Accuracy" value={`${accuracy}%`} color="text-yellow-400" bg="bg-yellow-500/10" />
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-400">Performance</span>
          <span className="text-slate-300">{accuracy}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-700">
          <div className="flex h-full">
            <div
              className="bg-green-500 transition-all duration-1000"
              style={{ width: `${(correct / total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-1000"
              style={{ width: `${(wrong / total) * 100}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Correct</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Wrong</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-600" /> Unattempted</span>
        </div>
      </div>
    </div>
  )
}

function StatItem({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`flex flex-col items-center rounded-xl ${bg} p-4`}>
      <Icon className={`h-6 w-6 ${color}`} />
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  )
}
