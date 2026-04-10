import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function SessionManager({ onRaceCreated }) {
  const { token } = useAuth()
  const [venueName, setVenueName] = useState('')
  const [mode, setMode] = useState('laps') // 'laps' or 'time'
  const [totalLaps, setTotalLaps] = useState(5)
  const [duration, setDuration] = useState(180)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const createRace = async () => {
    if (!venueName.trim()) {
      setMsg('❌ Enter a venue name')
      return
    }
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(`${API}/races`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          venue_name: venueName,
          duration_seconds: mode === 'time' ? duration : 3600,
          total_laps: mode === 'laps' ? totalLaps : null,
        }),
      })
      const race = await res.json()
      if (race && race.id) {
        setMsg('✅ Session created!')
        onRaceCreated(race)
      } else {
        setMsg('❌ Server error')
      }
    } catch (err) {
      setMsg('❌ Failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">
        Session Setup
      </div>
      <div className="bg-darkcard border border-darkborder rounded-xl p-4 space-y-4">

        {/* Venue Name */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
            Venue Name
          </label>
          <input
            type="text"
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createRace()}
            placeholder="e.g. Café Noir, TechPark Lounge"
            className="w-full bg-black/40 border border-darkborder rounded-lg px-4 py-3 text-white focus:border-f1red focus:outline-none"
          />
        </div>

        {/* Race Mode */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
            Race Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('laps')}
              className={`py-3 rounded-lg font-bold text-sm transition-all ${
                mode === 'laps'
                  ? 'bg-f1red text-white'
                  : 'bg-darkbg border border-darkborder text-gray-400'
              }`}
            >
              🏁 LAP RACE
            </button>
            <button
              onClick={() => setMode('time')}
              className={`py-3 rounded-lg font-bold text-sm transition-all ${
                mode === 'time'
                  ? 'bg-f1red text-white'
                  : 'bg-darkbg border border-darkborder text-gray-400'
              }`}
            >
              ⏱️ TIME RACE
            </button>
          </div>
        </div>

        {/* Lap count OR duration */}
        {mode === 'laps' ? (
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
              Total Laps: <span className="text-white">{totalLaps}</span>
            </label>
            <input
              type="range" min={1} max={20} step={1}
              value={totalLaps}
              onChange={e => setTotalLaps(Number(e.target.value))}
              className="w-full accent-f1red"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1 lap</span><span>10 laps</span><span>20 laps</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
              Race Duration: <span className="text-white">{duration}s ({Math.floor(duration/60)}m)</span>
            </label>
            <input
              type="range" min={60} max={600} step={30}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-f1red"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1 min</span><span>5 min</span><span>10 min</span>
            </div>
          </div>
        )}

        <button
          onClick={createRace}
          disabled={loading}
          className="w-full bg-f1red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors uppercase tracking-widest"
        >
          {loading ? 'Creating...' : '🏁 Create New Race Session'}
        </button>

        {msg && (
          <div className={`text-sm text-center font-bold ${msg.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}