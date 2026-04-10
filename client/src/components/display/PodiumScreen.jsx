import ReactConfetti from 'react-confetti'
import { formatLapTime } from '../../utils/formatTime'
import { POSITION_COLORS } from '../../utils/constants'

const PodiumBlock = ({ entry, position, delay }) => {
  const heights = { 1: 'h-40', 2: 'h-28', 3: 'h-20' }
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const color = POSITION_COLORS[position]

  return (
    <div className="flex flex-col items-center" style={{ animationDelay: `${delay}ms` }}>
      {/* Driver info above block */}
      <div className="text-center mb-3 podium-rise" style={{ animationDelay: `${delay + 200}ms` }}>
        <div className="text-4xl mb-1">{entry?.avatar || '🏎️'}</div>
        <div className="font-bold text-white text-lg leading-tight">{entry?.name || '---'}</div>
        <div className="text-sm font-mono" style={{ color }}>
          {formatLapTime(entry?.best_lap_ms)}
        </div>
      </div>
      {/* Podium block */}
      <div
        className={`w-28 ${heights[position]} rounded-t-xl flex items-center justify-center text-3xl font-bold border-t-4 podium-rise`}
        style={{
          backgroundColor: `${color}22`,
          borderColor: color,
          animationDelay: `${delay}ms`,
          color,
        }}
      >
        {medals[position]}
      </div>
    </div>
  )
}

export default function PodiumScreen({ entries, venueName }) {
  const top3 = entries?.slice(0, 3) || []
  const p1 = top3[0], p2 = top3[1], p3 = top3[2]

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center">
      <ReactConfetti recycle={true} numberOfPieces={200} colors={['#FFD700', '#e10600', '#9b59b6', '#ffffff']} />

      <div className="text-center mb-12">
        <div className="text-xs text-gray-500 uppercase tracking-[0.5em] mb-2">Race Complete</div>
        <div className="text-5xl font-bold text-white">🏁 Podium</div>
        <div className="text-gray-400 mt-2">{venueName || 'RaceZone Arena'}</div>
      </div>

      {/* P2 | P1 | P3 layout */}
      <div className="flex items-end gap-4 justify-center">
        <PodiumBlock entry={p2} position={2} delay={400} />
        <PodiumBlock entry={p1} position={1} delay={0} />
        <PodiumBlock entry={p3} position={3} delay={600} />
      </div>

      <div className="mt-12 text-center text-gray-600 text-sm animate-pulse">
        Screenshot & share your result! • racezone.in
      </div>
    </div>
  )
}