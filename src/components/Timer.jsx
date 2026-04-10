import { useEffect } from 'react'
import { Clock } from 'lucide-react'
import { formatTime } from '../lib/utils'
import useTestStore from '../store/useTestStore'

export default function Timer() {
  const { timeRemaining, decrementTimer } = useTestStore()

  useEffect(() => {
    const interval = setInterval(decrementTimer, 1000)
    return () => clearInterval(interval)
  }, [decrementTimer])

  const isLow = timeRemaining <= 120
  const isCritical = timeRemaining <= 60

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold ${
        isCritical
          ? 'bg-red-500/20 text-red-400 animate-pulse'
          : isLow
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-slate-800 text-slate-200'
      }`}
    >
      <Clock className="h-5 w-5" />
      {formatTime(timeRemaining)}
    </div>
  )
}
