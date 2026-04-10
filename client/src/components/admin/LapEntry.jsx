import { useState, useRef } from 'react'
import { formatLapTime } from '../../utils/formatTime'

const DEBOUNCE_MS = 1500

export default function LapEntry({ entries, token, onLapLogged, totalLaps }) {
  const [lastLaps, setLastLaps] = useState({})
  const [flashing, setFlashing] = useState({})
  const [logging, setLogging] = useState({})
  const [finished, setFinished] = useState({})
  const lastPressTime = useRef({})
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

  // Keep original entry order FIXED — never re-sort buttons
  const fixedEntries = useRef(null)
  if (!fixedEntries.current && entries.length > 0) {
    fixedEntries.current = [...entries].sort((a, b) => 
      (a.car_number || 0) - (b.car_number || 0)
    )
  }

  // Always use live data but in fixed order
  const orderedEntries = (fixedEntries.current || entries).map(fixed =>
    entries.find(e => e.id === fixed.id) || fixed
  )

  const logLap = async (entry) => {
    // Already finished
    if (finished[entry.id]) return

    const now = Date.now()
    const lastPress = lastPressTime.current[entry.id] || 0
    if (now - lastPress < DEBOUNCE_MS) return
    lastPressTime.current[entry.id] = now

    // Flash button
    setFlashing(prev => ({ ...prev, [entry.id]: true }))
    setTimeout(() => setFlashing(prev => ({ ...prev, [entry.id]: false })), 600)

    setLogging(prev => ({ ...prev, [entry.id]: true }))
    try {
      const lapNumber = (entry.lap_count || 0) + 1
      const res = await fetch(`${API}/laps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          race_entry_id: entry.id,
          lap_number: lapNumber,
          lap_time_ms: now,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Unknown error')
        return
      }
      const lapData = await res.json()

      // Refresh entries to get updated data
      await onLapLogged()

      // Check if this driver finished all laps
      if (totalLaps && lapNumber >= totalLaps) {
        // Calculate total time from first lap to now
        const totalTimeMs = entry.total_time_ms + (lapData.lap_time_ms || 0)
        const bestLapMs = Math.min(entry.best_lap_ms || 999999, lapData.lap_time_ms || 999999)
        
        setFinished(prev => ({
          ...prev,
          [entry.id]: {
            position: entry.position || 1,
            totalTime: totalTimeMs,
            bestLap: bestLapMs,
            laps: lapNumber,
          }
        }))
      }

      setLastLaps(prev => ({ ...prev, [entry.id]: now }))
      onLapLogged()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLogging(prev => ({ ...prev, [entry.id]: false }))
    }
  }

  const deleteLastLap = async (entry) => {
    if (!confirm('Undo last lap?')) return
    // Un-finish if they were finished
    if (finished[entry.id]) {
      setFinished(prev => { const n = {...prev}; delete n[entry.id]; return n })
    }
    try {
      await fetch(`${API}/laps/entry/${entry.id}/last`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      onLapLogged()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <div className="text-4xl mb-3">🏎️</div>
        <p>No drivers in race yet</p>
      </div>
    )
  }

  const allFinished = orderedEntries.every(e => finished[e.id])

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="text-center">
        {allFinished ? (
          <div className="text-yellow-400 text-sm font-black tracking-widest animate-pulse">
            🏁 ALL DRIVERS FINISHED — GO TO CONTROL → SHOW PODIUM
          </div>
        ) : (
          <>
            <div className="text-green-400 text-xs font-bold tracking-widest mb-1">
              🟢 RACE IN PROGRESS
            </div>
            <div className="text-gray-500 text-xs">
              Tap when driver crosses finish line
              {totalLaps && <span className="text-white ml-1">· {totalLaps} lap race</span>}
            </div>
          </>
        )}
      </div>

      {/* Tap buttons — FIXED ORDER, 2 column grid */}
      <div className="grid grid-cols-2 gap-3">
        {orderedEntries.map((entry, index) => {
          const isFinished = !!finished[entry.id]
          const lapsDone = entry.lap_count || 0

          return (
            <div key={entry.id} className="flex flex-col gap-1">

              {/* MAIN TAP BUTTON */}
              <button
                onPointerDown={() => !isFinished && logLap(entry)}
                disabled={logging[entry.id] || isFinished}
                className="relative overflow-hidden rounded-2xl transition-all active:scale-95"
                style={{
                  backgroundColor: isFinished
                    ? '#1a1a1a'
                    : flashing[entry.id]
                      ? entry.color
                      : entry.color + '22',
                  border: `3px solid ${isFinished ? '#444' : entry.color}`,
                  minHeight: '160px',
                  opacity: isFinished ? 0.7 : 1,
                }}
              >
                {/* Finished overlay */}
                {isFinished && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl z-20 p-3">
                    <div className="text-4xl mb-1">🏁</div>
                    <div className="text-yellow-400 font-black text-xl tracking-widest">
                      FINISHED!
                    </div>
                    <div className="text-white font-black text-3xl mt-1">
                      P{finished[entry.id]?.position || '?'}
                    </div>
                    <div className="mt-3 space-y-1 w-full px-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total Time</span>
                        <span className="text-white font-mono font-bold">
                          {formatLapTime(finished[entry.id]?.totalTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Best Lap</span>
                        <span className="text-purple-400 font-mono font-bold">
                          {formatLapTime(finished[entry.id]?.bestLap)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Laps</span>
                        <span className="text-white font-mono font-bold">
                          {finished[entry.id]?.laps}/{totalLaps}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Flash overlay */}
                {flashing[entry.id] && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-40 z-10"
                    style={{ backgroundColor: entry.color }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center py-4 px-2">
                  {/* Position badge */}
                  <div
                    className="text-xs font-black px-2 py-0.5 rounded mb-2"
                    style={{ backgroundColor: entry.color, color: '#000' }}
                  >
                    #{entry.car_number || index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="text-3xl mb-1">{entry.avatar || '🏎️'}</div>

                  {/* Driver name */}
                  <div
                    className="text-lg font-black font-race tracking-wider truncate w-full text-center px-2"
                    style={{ color: isFinished ? '#666' : entry.color }}
                  >
                    {entry.name}
                  </div>

                  {/* Lap count / total */}
                  <div className="mt-2 text-white font-black text-2xl font-mono">
                    {lapsDone}
                    {totalLaps && (
                      <span className="text-gray-500 text-sm font-normal">
                        /{totalLaps}
                      </span>
                    )}
                    <span className="text-gray-500 text-sm font-normal ml-1">
                      laps
                    </span>
                  </div>

                  {/* Lap progress bar */}
                  {totalLaps && (
                    <div className="w-full mt-2 px-2">
                      <div className="h-1.5 bg-darkborder rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-300"
                          style={{
                            width: `${Math.min((lapsDone / totalLaps) * 100, 100)}%`,
                            backgroundColor: entry.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Best lap */}
                  {entry.best_lap_ms && (
                    <div className="text-purple-400 text-xs font-mono mt-2">
                      ⚡ {formatLapTime(entry.best_lap_ms)}
                    </div>
                  )}

                  {/* Logging indicator */}
                  {logging[entry.id] && (
                    <div className="text-white text-xs mt-1 animate-pulse">
                      logging...
                    </div>
                  )}
                </div>
              </button>

              {/* Undo button */}
              {lapsDone > 0 && !isFinished && (
                <button
                  onClick={() => deleteLastLap(entry)}
                  className="w-full py-1.5 rounded-lg text-xs text-gray-500 hover:text-white border border-darkborder hover:border-gray-500 transition-all"
                >
                  ↩ undo
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Live standings */}
      <div className="bg-darkcard border border-darkborder rounded-lg p-3">
        <div className="text-xs text-gray-500 tracking-widest mb-2">LIVE STANDINGS</div>
        <div className="space-y-1">
          {[...entries]
            .sort((a, b) => (a.position || 99) - (b.position || 99))
            .map((entry, i) => (
              <div key={entry.id} className="flex items-center justify-between py-1 border-b border-darkborder last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs w-5">P{entry.position || i + 1}</span>
                  <span className="text-sm font-bold" style={{ color: entry.color }}>
                    {entry.name}
                  </span>
                  {finished[entry.id] && <span className="text-xs">🏁</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-mono">{entry.lap_count || 0} laps</span>
                  <span className="text-purple-400 text-xs font-mono">{formatLapTime(entry.best_lap_ms)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}