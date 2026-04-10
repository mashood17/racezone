import { useMemo } from 'react'
import { formatLapTime } from '../../utils/formatTime'
import { calculateGaps, findFastestLap } from '../../utils/calcGaps'
import { POSITION_COLORS } from '../../utils/constants'

const PositionBadge = ({ pos }) => {
  const color = POSITION_COLORS[pos]
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0"
      style={{ borderColor: color || '#444', color: color || '#aaa' }}
    >
      {pos}
    </div>
  )
}

export default function Leaderboard({ entries, fastestEntryId }) {
  const withGaps = useMemo(() => calculateGaps(entries), [entries])

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <div className="text-6xl mb-4">🏎️</div>
        <div className="text-xl">Waiting for drivers...</div>
        <div className="text-sm mt-2">Add drivers from the admin panel</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 text-xs text-gray-500 uppercase tracking-widest px-3 pb-1 border-b border-darkborder">
        <div className="col-span-1">Pos</div>
        <div className="col-span-1">No.</div>
        <div className="col-span-4">Driver</div>
        <div className="col-span-2 text-center">Laps</div>
        <div className="col-span-2 text-right">Best Lap</div>
        <div className="col-span-2 text-right">Gap</div>
      </div>

      {/* Rows */}
      {withGaps.map((entry, idx) => {
        const isFastest = entry.id === fastestEntryId
        const posColor = POSITION_COLORS[entry.position] || '#ffffff'

        return (
          <div
            key={entry.id}
            className={`grid grid-cols-12 items-center px-3 py-3 rounded-lg border transition-all duration-500
              ${isFastest
                ? 'border-f1purple/50 bg-f1purple/10 fastest-lap-row'
                : 'border-darkborder bg-darkcard hover:border-gray-600'
              }
              ${idx === 0 ? 'ring-1 ring-f1red/30' : ''}
            `}
          >
            {/* Position */}
            <div className="col-span-1">
              <PositionBadge pos={entry.position || idx + 1} />
            </div>

            {/* Car number */}
            <div className="col-span-1">
              <span
                className="text-sm font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ color: entry.color || '#fff', backgroundColor: `${entry.color}22` || '#ffffff11' }}
              >
                #{entry.car_number}
              </span>
            </div>

            {/* Driver */}
            <div className="col-span-4 flex items-center gap-2">
              <span className="text-xl">{entry.avatar || '🏎️'}</span>
              <div>
                <div className="font-bold text-white leading-tight">{entry.name}</div>
                {isFastest && (
                  <div className="text-xs text-f1purple">⚡ Fastest Lap</div>
                )}
              </div>
            </div>

            {/* Laps */}
            <div className="col-span-2 text-center">
              <span className="text-white font-mono font-bold">{entry.lap_count || 0}</span>
              <span className="text-gray-500 text-xs"> laps</span>
            </div>

            {/* Best lap */}
            <div className="col-span-2 text-right">
              <span className={`font-mono font-bold text-sm ${isFastest ? 'text-f1purple' : 'text-white'}`}>
                {formatLapTime(entry.best_lap_ms)}
              </span>
            </div>

            {/* Gap */}
            <div className="col-span-2 text-right">
              <span className={`text-sm font-mono ${
                entry.gap === 'LEADER' ? 'text-f1gold font-bold' : 'text-gray-400'
              }`}>
                {entry.gap}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}