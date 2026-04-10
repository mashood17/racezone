import { formatLapTime } from '../../utils/formatTime'

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

export default function HallOfFame({ records = [], onDelete, isAdmin = false }) {
  return (
    <div className="bg-darkcard border border-darkborder rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-white font-black font-race tracking-wider">HALL OF FAME</div>
            <div className="text-gray-600 text-xs">Top 5 fastest laps ever</div>
          </div>
        </div>
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete('reset')}
            className="text-xs text-red-500 hover:text-red-400 border border-red-900 hover:border-red-500 px-2 py-1 rounded transition-all"
          >
            Reset All
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🏁</div>
          <div className="text-gray-600 text-sm">No records yet</div>
          <div className="text-gray-700 text-xs mt-1">Complete races to set records</div>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record, i) => (
            <div
              key={record.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-darkborder hover:border-gray-600 transition-all group"
              style={{
                background: i === 0
                  ? 'linear-gradient(90deg, rgba(255,215,0,0.08), transparent)'
                  : 'transparent'
              }}
            >
              {/* Medal */}
              <div className="text-2xl w-8 text-center flex-shrink-0">
                {MEDALS[i]}
              </div>

              {/* Driver info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{record.avatar || '🏎️'}</span>
                  <span
                    className="font-black text-base truncate"
                    style={{ color: record.color || '#ffffff' }}
                  >
                    {record.name}
                  </span>
                  <span className="text-gray-600 text-xs">#{record.car_number}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-600 text-xs truncate">
                    📍 {record.venue_name || 'RaceZone'}
                  </span>
                  <span className="text-gray-700 text-xs">·</span>
                  <span className="text-gray-600 text-xs">
                    {new Date(record.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Lap time */}
              <div className="text-right flex-shrink-0">
                <div
                  className="font-black font-mono text-xl"
                  style={{
                    color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#9b59b6',
                    textShadow: i === 0 ? '0 0 15px rgba(255,215,0,0.5)' : undefined,
                  }}
                >
                  {formatLapTime(record.lap_time_ms)}
                </div>
                <div className="text-gray-600 text-xs">best lap</div>
              </div>

              {/* Delete button (admin only) */}
              {isAdmin && onDelete && (
                <button
                  onClick={() => onDelete(record.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 text-xs ml-2 transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}