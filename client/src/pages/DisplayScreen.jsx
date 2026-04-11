import { useEffect, useState, useRef } from 'react'
import { useRace } from '../context/RaceContext'
import { useSocket } from '../hooks/useSocket'
import { calculateGaps, findFastestLap } from '../utils/calcGaps'
import { formatLapTime, formatCountdown } from '../utils/formatTime'
import { POSITION_COLORS } from '../utils/constants'
import { QRCodeSVG } from 'qrcode.react'
import { themes } from '../styles/themes'
import ThemeSwitcher from '../components/shared/ThemeSwitcher'
import ShareCard from '../components/display/ShareCard'
import DriverOfTheDay from '../components/display/DriverOfTheDay'

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(value)
  const [flip, setFlip] = useState(false)
  useEffect(() => {
    if (value !== display) {
      setFlip(true)
      setTimeout(() => { setDisplay(value); setFlip(false) }, 150)
    }
  }, [value])
  return (
    <span className={flip ? 'number-flip' : ''} style={{ display: 'inline-block' }}>
      {display}
    </span>
  )
}

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
        <div key={line.id} className="speed-line"
          style={{ top: `${line.top}%`, width: `${line.width}px`, animationDelay: `${line.delay}s` }} />
      ))}
    </>
  )
}

export default function DisplayScreen() {
  const { activeRace, entries, setEntries, raceStatus, setRaceStatus,
    hallOfFame, fetchHallOfFame, raceHistory, fetchRaceHistory,
    fetchActiveRace, theme } = useRace()

  const socket = useSocket()
  const [countdown, setCountdown] = useState(null)
  const [countdownKey, setCountdownKey] = useState(0)
  const [raceTimer, setRaceTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showPodium, setShowPodium] = useState(false)
  const [speedLines, setSpeedLines] = useState(false)
  const [prevPositions, setPrevPositions] = useState({})
  const [positionChanges, setPositionChanges] = useState({})
  const [showShareCard, setShowShareCard] = useState(false)
  const timerRef = useRef(null)

  const t = themes[theme] || themes.f1blue
  const now = new Date()

  useEffect(() => {
    fetchActiveRace()
    fetchHallOfFame()
    fetchRaceHistory()
  }, [])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setRaceTimer(prev => prev + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

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
    const newPos = {}
    entries.forEach(e => { newPos[e.id] = e.position })
    setPrevPositions(newPos)
  }, [entries])

  useEffect(() => {
    if (!socket) return
    if (activeRace?.id) socket.emit('join_race', activeRace.id)

    socket.on('leaderboard_update', (data) => setEntries(data.entries || []))

    socket.on('race_started', () => {
      setShowPodium(false)
      setRaceTimer(0)
      setSpeedLines(true)
      setTimeout(() => setSpeedLines(false), 1500)
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

    socket.on('race_ended', () => { setRaceStatus('completed'); setTimerRunning(false) })
    socket.on('podium_show', () => { setShowPodium(true); setRaceStatus('podium') })

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
    completed: { label: '🏁 RACE COMPLETE',    color: t.accent },
    podium:    { label: '🏆 PODIUM',           color: '#FFD700' },
  }
  const status = statusConfig[raceStatus] || statusConfig.waiting

  // ── PODIUM ──
  if (showPodium && entries.length >= 2) {
    const sorted = [...entries].sort((a, b) => (a.position || 99) - (b.position || 99))
    const podiumOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean)
    const heights = ['180px', '220px', '140px']
    const medals = ['🥈', '🥇', '🥉']
    const labels = ['P2', 'P1', 'P3']
    const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32']

    return (
      <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: 'Rajdhani, sans-serif' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${t.accent}15 0%, transparent 70%)` }} />

        <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative', zIndex: 10 }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>🏆</div>
          <div style={{ fontSize: '80px', fontWeight: 900, color: '#FFD700', letterSpacing: '8px', textShadow: '0 0 40px rgba(255,215,0,0.6)', fontFamily: 'Rajdhani, sans-serif' }}>PODIUM</div>
          <div style={{ color: t.subtext, fontSize: '22px', marginTop: '8px', letterSpacing: '4px' }}>{activeRace?.venue_name || 'RaceZone Arena'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', position: 'relative', zIndex: 10, marginBottom: '60px' }}>
          {podiumOrder.map((entry, i) => (
            <div key={entry?.id} className="podium-rise" style={{ animationDelay: `${i * 0.2}s`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '56px' }}>{entry?.avatar || '🏎️'}</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: t.text, fontFamily: 'Rajdhani, sans-serif' }}>{entry?.name}</div>
              <div style={{ color: t.subtext, fontSize: '14px', fontFamily: 'monospace' }}>Best: {formatLapTime(entry?.best_lap_ms)}</div>
              <div style={{ color: t.subtext, fontSize: '14px', fontFamily: 'monospace' }}>Total: {formatLapTime(entry?.total_time_ms)}</div>
              <div style={{ height: heights[i], width: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '24px', borderRadius: '12px 12px 0 0', backgroundColor: podiumColors[i], boxShadow: `0 0 30px ${podiumColors[i]}66` }}>
                <div style={{ fontSize: '48px' }}>{medals[i]}</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#000' }}>{labels[i]}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ color: t.subtext, fontSize: '18px', letterSpacing: '6px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
          RACEZONE RC RACING EXPERIENCE
        </div>
      </div>
    )
  }

  // ── COUNTDOWN ──
  if (countdown !== null) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <SpeedLines active={speedLines} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${t.accent}20 0%, transparent 60%)` }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div key={countdownKey} className="countdown-number" style={{ fontSize: '20rem', lineHeight: 1, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: countdown === 0 ? '#00ff88' : t.accent, textShadow: `0 0 60px ${countdown === 0 ? '#00ff88' : t.accent}` }}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <div style={{ color: t.subtext, fontSize: '24px', letterSpacing: '6px', marginTop: '16px', fontFamily: 'Rajdhani, sans-serif' }}>
            {activeRace?.venue_name || 'RACEZONE'}
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN DISPLAY ──
  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Rajdhani, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <SpeedLines active={speedLines} />
      <div className="scan-line" />

      {/* Top accent line */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`, boxShadow: `0 0 20px ${t.accent}` }} />

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${t.border}`, backgroundColor: t.card, backdropFilter: 'blur(10px)', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: t.accent, fontSize: '28px', filter: `drop-shadow(0 0 8px ${t.accent})` }}>⚡</span>
          <div>
            <div style={{ color: t.text, fontSize: '22px', fontWeight: 900, letterSpacing: '6px', lineHeight: 1, textShadow: `0 0 20px ${t.accent}44` }}>RACEZONE</div>
            <div style={{ color: t.subtext, fontSize: '10px', letterSpacing: '3px' }}>RC RACING EXPERIENCE</div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: t.border, margin: '0 8px' }} />
          <span style={{ color: t.subtext, fontSize: '13px', letterSpacing: '2px' }}>LIVE RACE DISPLAY</span>
        </div>

        {/* Status pill */}
        <div style={{ padding: '8px 24px', borderRadius: '999px', border: `2px solid ${status.color}`, color: status.color, fontWeight: 700, fontSize: '16px', letterSpacing: '3px', boxShadow: `0 0 15px ${status.color}44` }}>
          {status.label}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeSwitcher />
          <div style={{ color: t.subtext, fontSize: '13px', fontFamily: 'monospace' }}>
            {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>

        {/* ── LEADERBOARD ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '28px', backgroundColor: t.accent, borderRadius: '2px', boxShadow: `0 0 10px ${t.accent}` }} />
            <span style={{ color: t.text, fontWeight: 700, fontSize: '20px', letterSpacing: '6px' }}>LIVE TIMING TOWER</span>
            {raceStatus === 'active' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff88', boxShadow: '0 0 8px #00ff88', animation: 'pulse 1s infinite' }} />
                <span style={{ color: '#00ff88', fontSize: '11px', letterSpacing: '2px' }}>LIVE</span>
              </div>
            )}
          </div>

          {/* Column headers */}
          {entries.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '3.5rem 1fr 7rem 9rem 9rem 8rem', padding: '0 16px', marginBottom: '8px' }}>
              {['POS', 'DRIVER', 'LAPS', 'BEST LAP', 'TOTAL', 'GAP'].map(h => (
                <div key={h} style={{ color: t.subtext, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textAlign: h === 'DRIVER' ? 'left' : 'center' }}>{h}</div>
              ))}
            </div>
          )}

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {gappedEntries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: t.subtext }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>🏎️</div>
                <div style={{ fontSize: '24px', letterSpacing: '4px', fontWeight: 700 }}>Waiting for drivers...</div>
                <div style={{ fontSize: '14px', marginTop: '8px', color: t.border }}>Add drivers from the admin panel</div>
              </div>
            ) : (
              gappedEntries.map((entry, index) => {
                const isFastest = fastestLapEntry?.id === entry.id
                const posColor = POSITION_COLORS[entry.position] || t.text
                const posChange = positionChanges[entry.id]
                const isLeader = index === 0

                return (
                  <div
                    key={entry.id}
                    className={`row-slide-in ${isFastest ? 'fastest-lap-row' : ''} ${posChange === 'up' ? 'position-up' : ''} ${posChange === 'down' ? 'position-down' : ''}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3.5rem 1fr 7rem 9rem 9rem 8rem',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${isFastest ? t.fastest : isLeader ? entry.color : t.border}`,
                      background: isFastest
                        ? `${t.fastest}15`
                        : isLeader
                          ? `linear-gradient(90deg, ${entry.color}15, ${t.card})`
                          : t.card,
                      animationDelay: `${index * 0.05}s`,
                      transition: 'all 0.3s ease',
                      boxShadow: isLeader ? `0 0 20px ${entry.color}22` : isFastest ? `0 0 20px ${t.fastest}22` : 'none',
                    }}
                  >
                    {/* Position */}
                    <div style={{ fontSize: '28px', fontWeight: 900, color: posColor, textShadow: entry.position <= 3 ? `0 0 15px ${posColor}` : 'none' }}>
                      <AnimatedNumber value={entry.position || index + 1} />
                    </div>

                    {/* Driver */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, border: `2px solid ${entry.color}`, backgroundColor: entry.color + '22', color: entry.color, flexShrink: 0, boxShadow: `0 0 10px ${entry.color}44` }}>
                        {entry.car_number || '?'}
                      </div>
                      <div>
                        <div style={{ color: t.text, fontWeight: 700, fontSize: '20px', lineHeight: 1.1 }}>{entry.name}</div>
                        <div style={{ color: t.subtext, fontSize: '12px' }}>{entry.avatar}</div>
                      </div>
                      {isFastest && (
                        <div style={{ marginLeft: '8px', backgroundColor: t.fastest, color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, boxShadow: `0 0 10px ${t.fastest}` }}>
                          ⚡ FASTEST
                        </div>
                      )}
                      {posChange === 'up' && <span style={{ color: '#00ff88', fontWeight: 700 }}>▲</span>}
                      {posChange === 'down' && <span style={{ color: '#ff4444', fontWeight: 700 }}>▼</span>}
                    </div>

                    {/* Laps */}
                    <div style={{ textAlign: 'center', color: t.text, fontWeight: 900, fontSize: '22px', fontFamily: 'monospace' }}>
                      <AnimatedNumber value={entry.lap_count || 0} />
                    </div>

                    {/* Best lap */}
                    <div style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '16px', color: isFastest ? t.fastest : t.text, textShadow: isFastest ? `0 0 10px ${t.fastest}` : 'none' }}>
                      {formatLapTime(entry.best_lap_ms)}
                    </div>

                    {/* Total time */}
                    <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '14px', color: t.subtext }}>
                      {entry.total_time_ms ? formatLapTime(entry.total_time_ms) : '--'}
                    </div>

                    {/* Gap */}
                    <div style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '16px', color: entry.gap === 'LEADER' ? '#FFD700' : t.text, textShadow: entry.gap === 'LEADER' ? '0 0 10px rgba(255,215,0,0.6)' : 'none' }}>
                      {entry.gap || '--'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderLeft: `1px solid ${t.border}`, backgroundColor: t.card, overflowY: 'auto' }}>

          {/* Race Timer */}
          <div style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ color: t.subtext, fontSize: '10px', letterSpacing: '3px', marginBottom: '8px' }}>RACE TIME</div>
            <div style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'monospace', color: timeLeft < 30 && raceStatus === 'active' ? '#e10600' : t.text, textShadow: timeLeft < 30 && raceStatus === 'active' ? '0 0 20px #e10600' : 'none' }}>
              {formatCountdown(raceStatus === 'active' ? timeLeft : duration)}
            </div>
            <div style={{ marginTop: '8px', height: '4px', backgroundColor: t.border, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '2px', transition: 'width 1s linear', width: `${raceStatus === 'active' ? ((raceTimer / duration) * 100) : 0}%`, background: `linear-gradient(90deg, ${t.accent}, ${t.fastest})`, boxShadow: `0 0 8px ${t.accent}` }} />
            </div>
            <div style={{ color: t.subtext, fontSize: '10px', letterSpacing: '2px', marginTop: '6px' }}>
              {raceStatus === 'active' ? 'IN PROGRESS' : raceStatus?.toUpperCase()}
            </div>
          </div>

          {/* Fastest Lap */}
          <div style={{ backgroundColor: t.bg, border: `1px solid ${t.fastest}55`, borderRadius: '12px', padding: '16px', boxShadow: `0 0 15px ${t.fastest}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.fastest }} />
              <div style={{ color: t.fastest, fontSize: '10px', letterSpacing: '3px', fontWeight: 700 }}>FASTEST LAP</div>
            </div>
            {fastestLapEntry ? (
              <>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', color: t.fastest, textShadow: `0 0 15px ${t.fastest}` }}>
                  {formatLapTime(fastestLapEntry.best_lap_ms)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '18px' }}>{fastestLapEntry.avatar}</span>
                  <div>
                    <div style={{ color: t.text, fontWeight: 700 }}>{fastestLapEntry.name}</div>
                    <div style={{ color: t.subtext, fontSize: '11px' }}>#{fastestLapEntry.car_number}</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: t.subtext, fontSize: '13px' }}>No laps yet</div>
            )}
          </div>

          {/* Hall of Fame */}
          <div style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>🏆</span>
              <div style={{ color: t.text, fontSize: '10px', letterSpacing: '3px', fontWeight: 700 }}>HALL OF FAME</div>
            </div>
            {hallOfFame.length === 0 ? (
              <div style={{ color: t.subtext, fontSize: '12px' }}>No records yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hallOfFame.slice(0, 5).map((record, i) => (
                  <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                      <div>
                        <div style={{ color: t.text, fontSize: '13px', fontWeight: 700 }}>{record.name}</div>
                        <div style={{ color: t.subtext, fontSize: '10px' }}>{record.venue_name}</div>
                      </div>
                    </div>
                    <span style={{ color: t.fastest, fontFamily: 'monospace', fontSize: '13px', fontWeight: 700 }}>
                      {formatLapTime(record.lap_time_ms)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Driver of the Day */}
          {(raceStatus === 'completed' || raceStatus === 'podium') && entries.length > 0 && (
            <DriverOfTheDay entries={entries} raceStatus={raceStatus} />
          )}

          {/* Venue Partner */}
          <div style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ color: t.subtext, fontSize: '10px', letterSpacing: '3px', marginBottom: '8px' }}>VENUE PARTNER</div>
            {activeRace?.venue_logo_url ? (
              <img src={activeRace.venue_logo_url} alt="Venue" style={{ height: '48px', margin: '0 auto', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: t.text, fontWeight: 700, fontSize: '16px' }}>
                {activeRace?.venue_name || 'RaceZone Arena'}
              </div>
            )}
          </div>

          {/* QR Code */}
          <div style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ color: t.subtext, fontSize: '10px', letterSpacing: '3px', marginBottom: '12px' }}>SCAN TO BOOK</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeSVG
                value={import.meta.env.VITE_BOOKING_URL || 'https://racezone.in'}
                size={90}
                bgColor="transparent"
                fgColor={t.text}
                level="M"
              />
            </div>
            <div style={{ color: t.subtext, fontSize: '11px', marginTop: '8px' }}>racezone.in</div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM TICKER ── */}
      <div style={{ borderTop: `1px solid ${t.border}`, backgroundColor: t.card, height: '32px', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        <div className="ticker-content" style={{ display: 'flex', alignItems: 'center', height: '100%', color: t.subtext, fontSize: '11px', letterSpacing: '3px', fontWeight: 700 }}>
          🏎️ RACEZONE RC RACING &nbsp;·&nbsp; LIVE TIMING SYSTEM &nbsp;·&nbsp;
          BOOK YOUR EVENT: racezone.in &nbsp;·&nbsp; 🏁 THE ULTIMATE RC RACING EXPERIENCE &nbsp;·&nbsp;
          {activeRace?.venue_name && `NOW RACING AT: ${activeRace.venue_name.toUpperCase()} · `}
          FASTEST LAP: {fastestLapEntry ? `${fastestLapEntry.name} — ${formatLapTime(fastestLapEntry.best_lap_ms)}` : 'TBD'}
          &nbsp;·&nbsp; 🏎️
        </div>
      </div>

      {/* Share button */}
      {(raceStatus === 'completed' || raceStatus === 'podium') && entries.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px', borderTop: `1px solid ${t.border}`, backgroundColor: t.card, zIndex: 10 }}>
          <button
            onClick={() => setShowShareCard(true)}
            style={{ padding: '12px 32px', backgroundColor: t.accent, color: '#fff', fontWeight: 900, fontSize: '16px', letterSpacing: '4px', borderRadius: '999px', border: 'none', cursor: 'pointer', boxShadow: `0 0 20px ${t.accent}66`, fontFamily: 'Rajdhani, sans-serif' }}
          >
            📸 SHARE YOUR RESULT
          </button>
        </div>
      )}

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