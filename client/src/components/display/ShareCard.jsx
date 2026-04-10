import { formatLapTime } from '../../utils/formatTime'

export default function ShareCard({ entry, venueName, position }) {
  if (!entry) return null

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div className="bg-gradient-to-br from-darkcard to-black border border-f1red/30 rounded-2xl p-6 text-center max-w-sm mx-auto shadow-[0_0_40px_rgba(225,6,0,0.2)]">
      <div className="text-xs text-f1red uppercase tracking-widest mb-1">RaceZone</div>
      <div className="text-4xl mb-2">{medals[position] || entry.avatar}</div>
      <div className="text-2xl font-bold text-white">{entry.name}</div>
      <div className="text-gray-400 text-sm mt-1">
        finished <span className="text-f1gold font-bold">P{position}</span>
      </div>
      <div className="mt-4 bg-black/40 rounded-xl p-3">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Best Lap</div>
        <div className="text-3xl font-mono font-bold text-f1purple mt-1">
          {formatLapTime(entry.best_lap_ms)}
        </div>
      </div>
      <div className="text-gray-600 text-xs mt-3">
        at {venueName || 'RaceZone Arena'} • racezone.in
      </div>
    </div>
  )
}