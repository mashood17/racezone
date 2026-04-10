import { useEffect, useState, useRef } from 'react'
import { useRace } from '../context/RaceContext'
import { useSocket } from '../hooks/useSocket'
import { calculateGaps, findFastestLap } from '../utils/calcGaps'
import { formatLapTime, formatCountdown } from '../utils/formatTime'
import { POSITION_COLORS } from '../utils/constants'
import { QRCodeSVG } from 'qrcode.react'
import ShareCard from '../components/display/ShareCard'

// Speed lines component
const SpeedLines = ({ active }) => {
  const [lines, setLines] = useState([])
  useEffect(() => {
    if (!active) return
    const newLines = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      top: Math.random() * 100,
      delay: Math.random() * 0.5,
      width: Math.random() * 200 + 100,
    }))
    setLines(newLines)
    const timer = setTimeout(() => setLines([]), 1500)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <>
      {lines.map(line => (
        <div
          key={line.id}
          className="speed-line"
          style={{
            top: `${line.top}%`,
            width: `${line.width}px`,
            animationDelay: `${line.delay}s`,
          }}
        />
      ))}
    </>
  )
}

// Animated number component
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(value)
  const [flip, setFlip] = useState(false)
  useEffect(() => {
    if (value !== display) {
      setFlip(true)
      setTimeout(() => {
        setDisplay(value)
        setFlip(false)
      }, 150)
    }
  }, [value])
  return (
    <span className={flip ? 'number-flip' : ''} style={{ display: 'inline-block' }}>
      {display}
    </span>
  )
}

export default function DisplayScreen() {
  const { activeRace, entries, setEntries, raceStatus, setRaceStatus,
    hallOfFame, fetchHallOfFame, raceHistory, fetchRaceHistory,
    fetchActiveRace } = useRace()

  const socket = useSocket()
  const [countdown, setCountdown] = useState(null)
  const [countdownKey, setCountdownKey] = useState(0)
  const [raceTimer, setRaceTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showPodium, setShowPodium] = useState(false)
  const [speedLines, setSpeedLines] = useState(false)
  const [flashStart, setFlashStart] = useState(false)
  const [prevPositions, setPrevPositions] = useState({})
  const [positionChanges, setPositionChanges] = useState({})
  const [showShareCard, setShowShareCard] = useState(false)
  const timerRef = useRef(null)
  const now = new Date()

  useEffect(() => {
    fetchActiveRace()
    fetchHallOfFame()
    fetchRaceHistory()
  }, [])

  // Race timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setRaceTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  // Track position changes for animations
  useEffect(() => {
    if (entries.length === 0) return
    const changes = {}
    entries.forEach(entry => {
      const prev = prevPositions[entry.id]
      if (prev !== undefined && prev !== entry.position) {
        changes[entry.id] = entry.position < prev ? 'up' : 'down'
      }
    })
    if (Object.keys(changes).length > 0) {
      setPositionChanges(changes)
      setTimeout(() => setPositionChanges({}), 1000)
    }
    const newPositions = {}
    entries.forEach(e => { newPositions[e.id] = e.position })
    setPrevPositions(newPositions)
  }, [entries])

  // Socket listeners
  useEffect(() => {
    if (!socket) return
    if (activeRace?.id) socket.emit('join_race', activeRace.id)

    socket.on('leaderboard_update', (data) => {
      setEntries(data.entries || [])
    })

    socket.on('race_started', () => {
      setShowPodium(false)
      setRaceTimer(0)
      setSpeedLines(true)
      setFlashStart(true)
      setTimeout(() => setSpeedLines(false), 1500)
      setTimeout(() => setFlashStart(false), 1000)

      let c = 3
      setCountdown(c)
      setCountdownKey(k => k + 1)

      const cd = setInterval(() => {
        c--
        if (c <= 0) {
          setCountdown(0)
          clearInterval(cd)
          setTimeout(() => {
            setCountdown(null)
            setRaceStatus('active')
            setTimerRunning(true)
          }, 800)
        } else {
          setCountdown(c)
          setCountdownKey(k => k + 1)
        }
      }, 1000)
    })

    socket.on('race_ended', () => {
      setRaceStatus('completed')
      setTimerRunning(false)
    })

    socket.on('podium_show', () => {
      setShowPodium(true)
      setRaceStatus('podium')
    })

    return () => {
      socket.off('leaderboard_update')
      socket.off('race_started')
      socket.off('race_ended')
      socket.off('podium_show')
    }
  }, [socket, activeRace])

  const gappedEntries = calculateGaps(entries)
  const fastestLapEntry = findFastestLap(entries)
  const duration = activeRace?.duration_seconds || 180
  const timeLeft = Math.max(0, duration - raceTimer)

  const statusConfig = {
    waiting:   { label: '⏳ WAITING TO START', color: '#FFD700' },
    active:    { label: '🟢 RACE IN PROGRESS', color: '#00ff88' },
    completed: { label: '🏁 RACE COMPLETE',    color: '#e10600' },
    podium:    { label: '🏆 PODIUM',           color: '#FFD700' },
  }
  const status = statusConfig[raceStatus] || statusConfig.waiting

  // ── PODIUM SCREEN ──
  if (showPodium && entries.length >= 2) {
    const sorted = [...entries].sort((a, b) => (a.position || 99) - (b.position || 99))
    const podiumOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean)
    const heights = ['h-44', 'h-56', 'h-36']
    const medals = ['🥈', '🥇', '🥉']
    const labels = ['P2', 'P1', 'P3']
    const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32']

    return (
      <div className="min-h-screen bg-darkbg flex flex-col items-center justify-center relative overflow-hidden">
        <div className="bg-grid absolute inset-0" />
        <div className="scan-line" />

        {/* Radial glow */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, transparent 70%)' }} />

        <div className="text-center mb-10 z-10 fade-in">
          <div className="text-7xl mb-4 text-glow-gold">🏆</div>
          <h1 className="text-8xl font-black font-race text-f1gold tracking-widest text-glow-gold">
            PODIUM
          </h1>
          <p className="text-gray-400 text-2xl mt-3 tracking-widest">
            {activeRace?.venue_name || 'RaceZone Arena'}
          </p>
        </div>

        <div className="flex items-end gap-8 z-10 mb-16">
          {podiumOrder.map((entry, i) => (
            <div
              key={entry?.id}
              className="flex flex-col items-center gap-3 podium-rise"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div className="text-6xl">{entry?.avatar || '🏎️'}</div>
              <div className="text-3xl font-black text-white font-race">{entry?.name}</div>
              <div className="text-sm text-gray-400 font-mono">
                Best: {formatLapTime(entry?.best_lap_ms)}
              </div>
              <div className="text-sm text-gray-400 font-mono">
                Total: {formatLapTime(entry?.total_time_ms)}
              </div>
              <div
                className={`${heights[i]} w-40 flex flex-col items-center justify-start pt-6 rounded-t-xl`}
                style={{
                  backgroundColor: podiumColors[i],
                  boxShadow: `0 0 30px ${podiumColors[i]}66`
                }}
              >
                <div className="text-5xl">{medals[i]}</div>
                <div className="text-3xl font-black text-black mt-2">{labels[i]}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom ticker */}
        <div className="fixed bottom-0 left-0 right-0 bg-f1red/90 py-2 overflow-hidden z-20">
          <div className="ticker-content text-white font-race font-bold tracking-widest text-sm">
            🏁 RACEZONE RC RACING — BOOK YOUR RACE TODAY — racezone.in — 🏎️ THE ULTIMATE RC RACING EXPERIENCE 🏁
          </div>
        </div>

        {/* Share Card Modal */}
        {showShareCard && (
          <ShareCard
            entries={entries}
            activeRace={activeRace}
            onClose={() => setShowShareCard(false)}
          />
        )}
      </div>
    )
  }

  // ── COUNTDOWN SCREEN ──
  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-darkbg flex items-center justify-center relative overflow-hidden">
        <div className="bg-grid absolute inset-0" />
        <SpeedLines active={speedLines} />

        {flashStart && <div className="fixed inset-0 bg-white/10 race-start-flash z-10" />}

        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(225,6,0,0.15) 0%, transparent 60%)' }} />

        <div className="text-center z-10">
          {countdown === 0 ? (
            <div
              key="go"
              className="font-black font-race text-green-400 text-glow-red countdown-number"
              style={{ fontSize: '18rem', lineHeight: 1 }}
            >
              GO!
            </div>
          ) : (
            <div
              key={countdownKey}
              className="font-black font-race text-f1red text-glow-red countdown-number"
              style={{ fontSize: '20rem', lineHeight: 1 }}
            >
              {countdown}
            </div>
          )}
          <div className="text-gray-400 text-2xl tracking-widest mt-4 font-race">
            {activeRace?.venue_name || 'RACEZONE'}
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN DISPLAY ──
  return (
    <div className="min-h-screen bg-darkbg flex flex-col overflow-hidden relative">
      {/* Background grid */}
      <div className="bg-grid absolute inset-0 pointer-events-none" />

      {/* Scan line */}
      <div className="scan-line" />

      {/* Speed lines */}
      <SpeedLines active={speedLines} />

      {/* Ambient glow top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-f1red glow-red" />

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-darkborder"
        style={{ background: 'rgba(18,18,26,0.95)', backdropFilter: 'blur(10px)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-f1red text-3xl text-glow-red">⚡</span>
          </div>
          <div>
            <span className="text-white text-2xl font-black tracking-widest font-race text-glow-red">
              RACEZONE
            </span>
            <div className="text-gray-600 text-xs tracking-widest">RC RACING EXPERIENCE</div>
          </div>
          <div className="w-px h-8 bg-darkborder mx-2" />
          <span className="text-gray-400 text-sm tracking-wider">LIVE RACE DISPLAY</span>
        </div>

        {/* Status pill */}
        <div
          className="px-6 py-2 rounded-full border-2 font-bold font-race tracking-widest text-lg"
          style={{
            borderColor: status.color,
            color: status.color,
            boxShadow: `0 0 15px ${status.color}44`,
          }}
        >
          {status.label}
        </div>

        {/* Date */}
        <div className="text-gray-400 text-sm font-mono">
          {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 relative z-10 overflow-hidden">

        {/* ── LEFT: LEADERBOARD ── */}
        <div className="flex-1 flex flex-col p-4">

          {/* Section header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-7 bg-f1red rounded glow-red" />
            <span className="text-white font-bold text-xl tracking-widest font-race">
              LIVE TIMING TOWER
            </span>
            {raceStatus === 'active' && (
              <div className="flex items-center gap-2 ml-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs tracking-wider">LIVE</span>
              </div>
            )}
          </div>

          {/* Column headers */}
          {entries.length > 0 && (
            <div
              className="grid text-xs text-gray-500 font-bold tracking-widest px-4 mb-2 uppercase"
              style={{ gridTemplateColumns: '3.5rem 1fr 7rem 9rem 9rem 8rem' }}
            >
              <span>POS</span>
              <span>DRIVER</span>
              <span className="text-center">LAPS</span>
              <span className="text-center">BEST LAP</span>
              <span className="text-center">TOTAL</span>
              <span className="text-center">GAP</span>
            </div>
          )}

          {/* Leaderboard rows */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {gappedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="text-8xl mb-6">🏎️</div>
                <p className="text-gray-500 text-2xl font-race">Waiting for drivers...</p>
                <p className="text-gray-700 text-sm mt-2">Add drivers from the admin panel</p>
              </div>
            ) : (
              gappedEntries.map((entry, index) => {
                const isFastest = fastestLapEntry?.id === entry.id
                const posColor = POSITION_COLORS[entry.position] || '#ffffff'
                const posChange = positionChanges[entry.id]
                const isLeader = index === 0

                return (
                  <div
                    key={entry.id}
                    className={`
                      grid items-center px-4 py-3 rounded-xl border transition-all
                      card-3d row-slide-in
                      ${isFastest ? 'fastest-lap-row border-f1purple' : 'border-darkborder bg-darkcard'}
                      ${posChange === 'up' ? 'position-up' : ''}
                      ${posChange === 'down' ? 'position-down' : ''}
                      ${isLeader ? 'border-l-4' : ''}
                    `}
                    style={{
                      gridTemplateColumns: '3.5rem 1fr 7rem 9rem 9rem 8rem',
                      animationDelay: `${index * 0.05}s`,
                      borderLeftColor: isLeader ? entry.color : undefined,
                      background: isFastest
                        ? 'rgba(155,89,182,0.08)'
                        : isLeader
                          ? `linear-gradient(90deg, ${entry.color}11, transparent)`
                          : undefined,
                    }}
                  >
                    {/* Position */}
                    <div
                      className="text-3xl font-black font-race"
                      style={{
                        color: posColor,
                        textShadow: entry.position <= 3 ? `0 0 15px ${posColor}` : undefined,
                      }}
                    >
                      <AnimatedNumber value={entry.position || index + 1} />
                    </div>

                    {/* Driver */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 flex-shrink-0"
                        style={{
                          backgroundColor: entry.color + '22',
                          borderColor: entry.color,
                          color: entry.color,
                          boxShadow: `0 0 10px ${entry.color}44`,
                        }}
                      >
                        {entry.car_number || '?'}
                      </div>
                      <div>
                        <div className="text-white font-bold text-xl leading-tight font-race">
                          {entry.name}
                        </div>
                        <div className="text-gray-600 text-xs">{entry.avatar}</div>
                      </div>
                      {isFastest && (
                        <span className="ml-2 text-xs bg-f1purple text-white px-2 py-0.5 rounded-full font-bold text-glow-purple">
                          ⚡ FASTEST
                        </span>
                      )}
                      {posChange === 'up' && (
                        <span className="text-green-400 text-sm font-bold">▲</span>
                      )}
                      {posChange === 'down' && (
                        <span className="text-red-400 text-sm font-bold">▼</span>
                      )}
                    </div>

                    {/* Laps */}
                    <div className="text-center text-white font-black text-2xl font-mono">
                      <AnimatedNumber value={entry.lap_count || 0} />
                    </div>

                    {/* Best lap */}
                    <div className={`text-center font-mono font-bold text-lg ${isFastest ? 'text-f1purple text-glow-purple' : 'text-white'}`}>
                      {formatLapTime(entry.best_lap_ms)}
                    </div>

                    {/* Total time */}
                    <div className="text-center font-mono text-sm text-gray-400">
                      {entry.total_time_ms ? formatLapTime(entry.total_time_ms) : '--'}
                    </div>

                    {/* Gap */}
                    <div className={`text-center font-mono font-bold text-lg ${entry.gap === 'LEADER' ? 'text-f1gold text-glow-gold' : 'text-gray-300'}`}>
                      {entry.gap || '--'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="w-80 flex flex-col gap-3 p-4 border-l border-darkborder overflow-y-auto"
          style={{ background: 'rgba(12,12,20,0.8)', backdropFilter: 'blur(10px)' }}>

          {/* Race Timer */}
          <div className="bg-darkcard border border-darkborder rounded-xl p-4 card-3d">
            <div className="text-gray-500 text-xs tracking-widest mb-2 font-bold">RACE TIME</div>
            <div
              className="text-5xl font-black font-mono tracking-wider"
              style={{
                color: timeLeft < 30 && raceStatus === 'active' ? '#e10600' : '#ffffff',
                textShadow: timeLeft < 30 && raceStatus === 'active' ? '0 0 20px #e10600' : undefined,
              }}
            >
              {formatCountdown(raceStatus === 'active' ? timeLeft : duration)}
            </div>
            <div className="mt-3 h-2 bg-darkborder rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${raceStatus === 'active' ? ((raceTimer / duration) * 100) : 0}%`,
                  background: 'linear-gradient(90deg, #e10600, #ff4444)',
                  boxShadow: '0 0 10px #e10600',
                }}
              />
            </div>
            <div className="text-gray-600 text-xs mt-2 tracking-widest">
              {raceStatus === 'active' ? 'RACE IN PROGRESS' : raceStatus?.toUpperCase()}
            </div>
          </div>

          {/* Fastest Lap */}
          <div className="bg-darkcard border border-f1purple/50 rounded-xl p-4 card-3d glow-purple">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-f1purple" />
              <div className="text-f1purple text-xs tracking-widest font-bold">FASTEST LAP</div>
            </div>
            {fastestLapEntry ? (
              <>
                <div className="text-3xl font-black font-mono text-f1purple text-glow-purple">
                  {formatLapTime(fastestLapEntry.best_lap_ms)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl">{fastestLapEntry.avatar}</span>
                  <div>
                    <div className="text-white font-bold">{fastestLapEntry.name}</div>
                    <div className="text-gray-500 text-xs">#{fastestLapEntry.car_number}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-600 text-sm">No laps yet</div>
            )}
          </div>

          {/* Hall of Fame */}
          <div className="bg-darkcard border border-darkborder rounded-xl p-4 card-3d">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏆</span>
              <div className="text-gray-300 text-xs tracking-widest font-bold">HALL OF FAME</div>
            </div>
            {hallOfFame.length === 0 ? (
              <div className="text-gray-600 text-sm">No records yet</div>
            ) : (
              <div className="space-y-2">
                {hallOfFame.slice(0, 5).map((record, i) => (
                  <div key={record.id} className="flex items-center justify-between py-1 border-b border-darkborder last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                      <div>
                        <div className="text-white text-sm font-bold">{record.name}</div>
                        <div className="text-gray-600 text-xs truncate">{record.venue_name}</div>
                      </div>
                    </div>
                    <span className="text-f1purple font-mono text-sm font-bold flex-shrink-0 ml-2">
                      {formatLapTime(record.lap_time_ms)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Races */}
          <div className="bg-darkcard border border-darkborder rounded-xl p-4 card-3d">
            <div className="text-gray-300 text-xs tracking-widest font-bold mb-3">RECENT RACES</div>
            {raceHistory.length === 0 ? (
              <div className="text-gray-600 text-sm">No races yet</div>
            ) : (
              <div className="space-y-2">
                {raceHistory.slice(0, 3).map((race) => (
                  <div key={race.id} className="flex justify-between items-center py-1 border-b border-darkborder last:border-0">
                    <span className="text-gray-400 text-xs truncate">{race.venue_name}</span>
                    <span className="text-gray-600 text-xs font-mono ml-2 flex-shrink-0">
                      {new Date(race.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Venue Partner */}
          <div className="bg-darkcard border border-darkborder rounded-xl p-4 text-center card-3d">
            <div className="text-gray-600 text-xs tracking-widest mb-2">VENUE PARTNER</div>
            {activeRace?.venue_logo_url ? (
              <img src={activeRace.venue_logo_url} alt="Venue" className="h-12 mx-auto object-contain" />
            ) : (
              <div className="text-gray-400 font-bold font-race text-lg">
                {activeRace?.venue_name || 'RaceZone Arena'}
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-darkcard border border-darkborder rounded-xl p-4 text-center card-3d">
            <div className="text-gray-600 text-xs tracking-widest mb-3">SCAN TO BOOK</div>
            <div className="flex justify-center">
              <QRCodeSVG
                value={import.meta.env.VITE_BOOKING_URL || 'https://racezone.in'}
                size={90}
                bgColor="transparent"
                fgColor="#ffffff"
                level="M"
              />
            </div>
            <div className="text-gray-600 text-xs mt-2">racezone.in</div>
          </div>
        </div>
      </div>
      
      {/* Share button — shows after race */}
      {(raceStatus === 'completed' || raceStatus === 'podium') && entries.length > 0 && (
        <div className="relative z-10 flex justify-center py-3 border-t border-darkborder">
          <button
            onClick={() => setShowShareCard(true)}
            className="px-8 py-3 bg-f1red hover:bg-red-700 text-white font-black font-race text-lg tracking-widest rounded-full transition-all glow-red animate-pulse"
          >
            📸 SHARE YOUR RESULT
          </button>
        </div>
      )}

      {/* ── BOTTOM TICKER ── */}
      <div className="relative z-10 border-t border-darkborder overflow-hidden"
        style={{ background: 'rgba(225,6,0,0.15)', height: '32px' }}>
        <div className="ticker-content flex items-center h-full text-gray-400 text-xs font-race tracking-widest">
          🏎️ RACEZONE RC RACING &nbsp;·&nbsp; LIVE TIMING SYSTEM &nbsp;·&nbsp;
          BOOK YOUR EVENT: racezone.in &nbsp;·&nbsp;
          🏁 THE ULTIMATE RC RACING EXPERIENCE &nbsp;·&nbsp;
          {activeRace?.venue_name && `NOW RACING AT: ${activeRace.venue_name.toUpperCase()} · `}
          FASTEST LAP: {fastestLapEntry ? `${fastestLapEntry.name} — ${formatLapTime(fastestLapEntry.best_lap_ms)}` : 'TBD'}
          &nbsp;·&nbsp; 🏎️
        </div>
      </div>
    </div>
  )
}