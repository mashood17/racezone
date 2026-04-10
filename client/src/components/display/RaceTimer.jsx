import { useEffect, useState, useRef } from 'react'
import { formatCountdown } from '../../utils/formatTime'

export default function RaceTimer({ status, duration = 180, onTimeUp, startedAt }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (status === 'active') {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const start = startedAt ? new Date(startedAt).getTime() : now
        const elapsedSec = Math.floor((now - start) / 1000)
        const remaining = Math.max(0, duration - elapsedSec)
        setElapsed(elapsedSec)
        setTimeLeft(remaining)
        if (remaining <= 0) {
          clearInterval(intervalRef.current)
          onTimeUp && onTimeUp()
        }
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [status, startedAt, duration])

  const pct = ((duration - timeLeft) / duration) * 100
  const isUrgent = timeLeft <= 30 && status === 'active'

  return (
    <div className="bg-darkcard border border-darkborder rounded-xl p-4">
      <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Race Time</div>
      <div className={`text-5xl font-mono font-bold tabular-nums transition-colors ${
        isUrgent ? 'text-f1red animate-pulse' : 'text-white'
      }`}>
        {formatCountdown(timeLeft)}
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-darkborder rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isUrgent ? 'bg-f1red' : 'bg-f1red'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {status === 'active' ? `+${formatCountdown(elapsed)} elapsed` : status.toUpperCase()}
      </div>
    </div>
  )
}