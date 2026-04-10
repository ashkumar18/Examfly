import { useMemo, useState, useEffect } from 'react'
import { getHeatmapData } from '../lib/streak'

const LEVELS = [
  'bg-white/[0.04]',
  'bg-indigo-900/60',
  'bg-indigo-700/60',
  'bg-indigo-500/70',
  'bg-indigo-400',
]

function getLevel(count) {
  if (count === 0) return 0
  if (count <= 5) return 1
  if (count <= 15) return 2
  if (count <= 30) return 3
  return 4
}

export default function StreakHeatmap() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHeatmapData(182).then((d) => { setData(d); setLoading(false) })
  }, [])

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const cellSize = isMobile ? 10 : 12
  const gapSize = isMobile ? 2 : 3
  const labelWidth = isMobile ? 20 : 28

  const startDayOfWeek = data[0]?.day || 0
  const padded = useMemo(
    () => Array(startDayOfWeek).fill(null).concat(data),
    [data, startDayOfWeek]
  )

  const weeks = useMemo(() => {
    const w = []
    for (let i = 0; i < padded.length; i += 7) {
      w.push(padded.slice(i, i + 7))
    }
    return w
  }, [padded])

  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const firstReal = week.find((d) => d !== null)
      if (firstReal && firstReal.month !== lastMonth) {
        labels.push({ index: wi, label: firstReal.monthName.toUpperCase() })
        lastMonth = firstReal.month
      }
    })
    return labels
  }, [weeks])

  if (loading || data.length === 0) {
    return (
      <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-6">
        <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-5 sm:text-sm">Study Contributions</h3>
        <div className="flex h-20 items-center justify-center">
          <div className="h-4 w-4 animate-spin border-2 border-white/10 border-t-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-white/10 bg-surface-lowest p-4 sm:p-6">
      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-text sm:mb-5 sm:text-sm">Study Contributions</h3>

      <div className="hide-scrollbar relative overflow-x-auto">
        {/* Month labels */}
        <div className="relative mb-1 sm:mb-1.5" style={{ height: '14px', minWidth: 'max-content', paddingLeft: `${labelWidth}px` }}>
          {monthLabels.map((m, i) => (
            <div key={`ml-${i}`} className="absolute text-[8px] font-bold tracking-widest text-text-muted sm:text-[10px]"
              style={{ left: `${labelWidth + m.index * (cellSize + gapSize)}px`, top: 0 }}>
              {m.label}
            </div>
          ))}
        </div>

        <div className="flex" style={{ gap: `${gapSize}px` }}>
          {/* Day labels */}
          <div className="flex shrink-0 flex-col pt-0" style={{ width: `${labelWidth}px`, gap: `${gapSize}px` }}>
            {['', 'M', '', 'W', '', 'F', ''].map((d, i) => (
              <div key={i} className="flex items-center" style={{ height: `${cellSize}px` }}>
                <span className="text-[7px] font-bold text-text-muted sm:text-[9px]">{d}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: `${gapSize}px` }}>
              {week.map((day, di) => (
                <div key={di}
                  className={`transition-colors ${
                    day === null ? 'bg-transparent' : LEVELS[getLevel(day.count)]
                  }`}
                  style={{ height: `${cellSize}px`, width: `${cellSize}px` }}
                  title={day ? `${day.date}: ${day.count} questions` : ''}
                />
              ))}
              {week.length < 7 &&
                Array(7 - week.length).fill(null).map((_, i) => (
                  <div key={`pad-${i}`} style={{ height: `${cellSize}px`, width: `${cellSize}px` }} />
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1 sm:mt-4 sm:gap-1.5">
        <span className="mr-0.5 text-[8px] font-bold text-text-muted sm:mr-1 sm:text-[10px]">Less</span>
        {LEVELS.map((cls, i) => (
          <div key={i} className={cls} style={{ height: `${cellSize - 1}px`, width: `${cellSize - 1}px` }} />
        ))}
        <span className="ml-0.5 text-[8px] font-bold text-text-muted sm:ml-1 sm:text-[10px]">More</span>
      </div>
    </div>
  )
}
