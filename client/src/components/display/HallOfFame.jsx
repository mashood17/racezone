import { formatLapTime } from '../../utils/formatTime'

export default function HallOfFame({ records }) {
  if (!records || records.length === 0) {
    return (
      <div className="bg-darkcard border border-darkborder rounded-xl p-4">
        <div className="text-xs text-f1gold uppercase tracking-widest mb-2">🏆 Hall of Fame</div>
        <div className="text-gray-600 text-sm">No records yet</div>
      </div>
    )
  }

  return (
    <div className="bg-darkcard border border-darkborder rounded-xl p-4">
      <div className="text-xs text-f1gold uppercase tracking-widest mb-3 flex items-center gap-2">
        🏆 Hall of Fame
      </div>
      <div className="space-y-2">
        {records.slice(0, 3).map((rec, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{['🥇','🥈','🥉'][idx]}</span>
              <span className="text-white text-sm font-bold">{rec.name}</span>
            </div>
            <span className="font-mono text-sm text-f1purple">
              {formatLapTime(rec.lap_time_ms)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}