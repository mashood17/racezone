import { useState, useEffect, useRef } from 'react'
import { formatCountdown } from '../../utils/formatTime'
import { RACE_STATUS } from '../../utils/constants'

export default function RaceControl({ race, raceStatus, token, socket, onStatusChange }) {
  const [timeLeft, setTimeLeft] = useState(race?.duration_seconds || 180)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

  useEffect(() => {
    if (raceStatus === RACE_STATUS.ACTIVE) {
      setRunning(true)
    }
  }, [raceStatus])

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            handleEndRace()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const handleStartRace = async () => {
    if (!race) return
    try {
      // ✅ FIRST update backend
      await fetch(`${API}/races/${race.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'active', 
          started_at: new Date().toISOString() 
        }),
      })

      socket?.emit('race_start', { race_id: race.id })

      onStatusChange('active')
      setRunning(true)

    } catch (err) {
      alert('Error starting race: ' + err.message)
    }
  }

  const handleEndRace = async () => {
    if (!race) return
    clearInterval(intervalRef.current)
    setRunning(false)
    try {
      await fetch(`${API}/races/${race.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'completed', ended_at: new Date().toISOString() }),
      })
      socket?.emit('race_end', { race_id: race.id })
      onStatusChange('completed')
    } catch (err) {
      alert('Error ending race: ' + err.message)
    }
  }

  const handleShowPodium = () => {
    socket?.emit('show_podium', { race_id: race.id })
    onStatusChange('podium')
  }

  const statusColor = {
    waiting: 'text-yellow-400',
    active: 'text-green-400',
    completed: 'text-gray-400',
    podium: 'text-yellow-300',
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white font-race tracking-wider">
        RACE CONTROL
      </h2>

      {/* Status */}
      <div className="bg-darkbg border border-darkborder rounded-lg p-4 text-center">
        <div className={`text-2xl font-bold font-race tracking-widest ${statusColor[raceStatus] || 'text-white'}`}>
          {raceStatus?.toUpperCase() || 'WAITING'}
        </div>
        {running && (
          <div className="text-4xl font-mono text-white mt-2">
            {formatCountdown(timeLeft)}
          </div>
        )}
        {running && (
          <div className="mt-3 h-2 bg-darkborder rounded overflow-hidden">
            <div
              className="h-full bg-f1red rounded transition-all duration-1000"
              style={{ width: `${((race.duration_seconds - timeLeft) / race.duration_seconds) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        {raceStatus === RACE_STATUS.WAITING && (
          <button
            onClick={handleStartRace}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold font-race text-xl tracking-widest rounded-lg transition-all"
          >
            🏁 START RACE
          </button>
        )}

        {raceStatus === RACE_STATUS.ACTIVE && (
          <button
            onClick={handleEndRace}
            className="w-full py-4 bg-f1red hover:bg-red-700 text-white font-bold font-race text-xl tracking-widest rounded-lg transition-all"
          >
            🔴 END RACE
          </button>
        )}

        {raceStatus === RACE_STATUS.COMPLETED && (
          <button
            onClick={handleShowPodium}
            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold font-race text-xl tracking-widest rounded-lg transition-all"
          >
            🏆 SHOW PODIUM
          </button>
        )}
      </div>

      {/* Race info */}
      {race && (
        <div className="bg-darkbg border border-darkborder rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Race ID</span>
            <span className="text-white font-mono">#{race.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Venue</span>
            <span className="text-white">{race.venue_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="text-white">{race.duration_seconds}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={statusColor[raceStatus]}>{raceStatus?.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  )
}