import { formatLapTime } from '../../utils/formatTime'

export default function FastestLap({ entry }) {
  if (!entry || !entry.best_lap_ms) {
    return (
      <div className="bg-darkcard border border-darkborder rounded-xl p-4">
        <div className="text-xs text-f1purple uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-f1purple inline-block" />
          Fastest Lap
        </div>
        <div className="text-gray-600 text-sm">No laps yet</div>
      </div>
    )
  }

  return (
    <div className="bg-darkcard border border-f1purple/40 rounded-xl p-4 shadow-[0_0_20px_rgba(155,89,182,0.2)]">
      <div className="text-xs text-f1purple uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-f1purple animate-pulse inline-block" />
        Fastest Lap
      </div>
      <div className="text-3xl font-mono font-bold text-f1purple">
        {formatLapTime(entry.best_lap_ms)}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-lg">{entry.avatar || '🏎️'}</span>
        <span className="text-white font-bold">{entry.name}</span>
        <span className="text-gray-500 text-sm">#{entry.car_number}</span>
      </div>
    </div>
  )
}