import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import { useRace } from '../context/RaceContext'
import SessionManager from '../components/admin/SessionManager'
import DriverSetup from '../components/admin/DriverSetup'
import LapEntry from '../components/admin/LapEntry'
import RaceControl from '../components/admin/RaceControl'


const TABS = ['SESSION', 'DRIVERS', 'LAPS', 'CONTROL']



export default function AdminPanel() {
  const { token, logout } = useAuth()
  const { activeRace, setActiveRace, entries, setEntries,
          raceStatus, setRaceStatus, fetchActiveRace } = useRace()
  const socket = useSocket()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('SESSION')
  const [loading, setLoading] = useState(true)

  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'


  

  useEffect(() => {
    const load = async () => {
      await fetchActiveRace()
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (socket && activeRace?.id) {
      socket.emit('join_race', activeRace.id)
    }
  }, [socket, activeRace])

  const refreshEntries = async () => {
    if (!activeRace?.id) return
    try {
      const res = await fetch(`${API}/races/${activeRace.id}`)
      const data = await res.json()
      setEntries(data.entries || [])
      socket?.emit('lap_logged', { race_id: activeRace.id })
    } catch (err) {
      console.error('refreshEntries error:', err)
    }
  }



  const handleRaceCreated = (race) => {
    console.log('Race created:', race)
    if (race && race.id) {
      setActiveRace(race)
      setRaceStatus('waiting')
      setEntries([])
      setActiveTab('DRIVERS')
    } else {
      alert('Error: Race was not created properly.')
    }
  }

  const handleDriversReady = () => {
    refreshEntries()
    setRaceStatus('waiting')
    setActiveTab('CONTROL')
  }

  const handleStatusChange = (status) => {
    setRaceStatus(status)
    if (status === 'active') setActiveTab('LAPS')
    if (status === 'completed') setActiveTab('CONTROL')
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const raceStatusColor = {
    waiting: 'bg-yellow-500',
    active: 'bg-green-500',
    completed: 'bg-gray-500',
    podium: 'bg-yellow-400',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <div className="text-white font-race text-2xl animate-pulse">LOADING...</div>
      </div>
    )
  }

  return (
  <>
    <div className="min-h-screen bg-darkbg flex flex-col max-w-lg mx-auto">

      {/* TOP BAR */}
      <div className="bg-darkcard border-b border-darkborder px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-f1red text-xl">⚡</span>
          <span className="text-white font-black font-race tracking-widest">RACEZONE</span>
          <span className="text-gray-600 text-sm">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          {activeRace && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${raceStatusColor[raceStatus] || 'bg-gray-500'}`} />
              <span className="text-xs text-gray-400 font-mono uppercase">{raceStatus}</span>
            </div>
          )}
          <button onClick={handleLogout} className="text-gray-500 hover:text-white text-sm transition-colors">
            LOGOUT
          </button>
        </div>
      </div>

      {/* ACTIVE RACE BANNER */}
      {activeRace && (
        <div className="bg-darkcard/50 border-b border-darkborder px-4 py-2 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            <span className="text-gray-600">VENUE: </span>
            <span className="text-white font-bold">{activeRace.venue_name}</span>
          </div>
          <div className="text-xs text-gray-400">
            <span className="text-gray-600">RACE #</span>
            <span className="text-white font-mono">{activeRace.id}</span>
            <span className="text-gray-600 ml-2">·</span>
            <span className="text-gray-400 ml-2">{entries.length} drivers</span>
          </div>
        </div>
      )}

      {/* TAB BAR */}
      <div className="flex border-b border-darkborder bg-darkcard sticky top-[57px] z-40">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold tracking-widest font-race transition-all border-b-2 ${
              activeTab === tab
                ? 'text-f1red border-f1red'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab === 'SESSION' && '📋 '}
            {tab === 'DRIVERS' && '🏎️ '}
            {tab === 'LAPS' && '⏱️ '}
            {tab === 'CONTROL' && '🎮 '}
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 p-4 overflow-y-auto pb-8">

        {/* SESSION TAB */}
        {activeTab === 'SESSION' && (
          <div className="space-y-4">
            <SessionManager onRaceCreated={handleRaceCreated} />

            <div className="bg-darkcard border border-darkborder rounded-lg p-4 mt-4">
              <h3 className="text-white font-bold font-race tracking-wider mb-3">HOW IT WORKS</h3>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'Create Session', desc: 'Enter venue name and race duration' },
                  { step: '2', label: 'Add Drivers', desc: 'Set up to 8 drivers with names and avatars' },
                  { step: '3', label: 'Race Control', desc: 'Start countdown on the display screen' },
                  { step: '4', label: 'Log Laps', desc: 'Enter lap times as drivers complete laps' },
                  { step: '5', label: 'Show Podium', desc: 'Display winners on the TV screen' },
                ].map(item => (
                  <div key={item.step} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-f1red text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold">{item.label}</div>
                      <div className="text-gray-500 text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a href="/"
              target="_blank"
              rel="noreferrer"
              className="block w-full py-3 border border-darkborder text-gray-400 hover:text-white hover:border-gray-500 text-center rounded-lg text-sm transition-all"
            >
              📺 Open Display Screen →
            </a>
          </div>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'DRIVERS' && (
          <div>
            {!activeRace ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400">Create a session first</p>
                <button onClick={() => setActiveTab('SESSION')}
                  className="mt-4 text-f1red text-sm hover:underline">
                  Go to Session →
                </button>
              </div>
            ) : (
              <DriverSetup
                raceId={activeRace.id}
                token={token}
                onDriversReady={handleDriversReady}
              />
            )}
          </div>
        )}

        {/* Keyboard Guide */}
        <div className="bg-darkcard border border-green-500/30 rounded-lg p-4 mb-4">
          <div className="text-green-400 text-xs font-bold tracking-widest mb-3">
            ⌨️ KEYBOARD LAP LOGGING — ACTIVE
          </div>
          <div className="grid grid-cols-4 gap-2">
            {entries.slice(0, 4).map((entry, i) => (
              <div key={entry.id} className="text-center">
                <div
                  className="text-2xl font-black font-mono rounded-lg py-2 mb-1 border-2"
                  style={{ borderColor: entry.color, color: entry.color }}
                >
                  {i + 1}
                </div>
                <div className="text-white text-xs font-bold truncate">{entry.name}</div>
                <div className="text-gray-500 text-xs">Lap {entry.lap_count || 0}</div>
              </div>
            ))}
          </div>
          <div className="text-gray-600 text-xs mt-3 text-center">
            Press key 1-4 when driver crosses finish line
          </div>
        </div>
        

        {/* LAPS TAB */}
        {activeTab === 'LAPS' && (
          <div>
            {!activeRace ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">⏱️</div>
                <p className="text-gray-400">No active race</p>
              </div>
            ) : raceStatus !== 'active' ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔴</div>
                <p className="text-gray-400 mb-2">Race not started yet</p>
                <button onClick={() => setActiveTab('CONTROL')}
                  className="text-f1red text-sm hover:underline">
                  Go to Race Control →
                </button>
              </div>
            ) : (
              <div>
                <button
                  onClick={refreshEntries}
                  className="w-full mb-4 py-2 border border-darkborder text-gray-400 hover:text-white rounded-lg text-sm transition-all"
                >
                  🔄 Refresh Drivers
                </button>
                <LapEntry
                  entries={entries}
                  token={token}
                  onLapLogged={refreshEntries}
                  totalLaps={activeRace?.total_laps || null}
                />
              </div>
            )}
          </div>
        )}

        {/* CONTROL TAB */}
        {activeTab === 'CONTROL' && (
          <div>
            {!activeRace ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🎮</div>
                <p className="text-gray-400">Create a session first</p>
                <button onClick={() => setActiveTab('SESSION')}
                  className="mt-4 text-f1red text-sm hover:underline">
                  Go to Session →
                </button>
              </div>
            ) : (
              <RaceControl
                race={activeRace}
                raceStatus={raceStatus}
                token={token}
                socket={socket}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        )}
      </div>

      <div className="h-4 bg-darkbg" />
    </div>
   </>
  )
}