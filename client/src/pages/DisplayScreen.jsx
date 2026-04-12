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
import RacingBackground from '../components/display/RacingBackground'

// ── Animated background particles
const Particles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.4 + 0.1,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: p.id % 2 === 0 ? '#007BFF' : '#B44FFF',
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px ${p.id % 2 === 0 ? '#007BFF' : '#B44FFF'}`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) scale(1); opacity: 0.1; }
          100% { transform: translateY(-30px) scale(1.5); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// ── Light streaks
const LightStreaks = () => {
  const streaks = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    top: 8 + i * 18,
    duration: 10 + i * 3,
    delay: i * 2.5,
    width: 150 + i * 80,
  }))
  return (
    <>
      {streaks.map(s => (
        <div
          key={s.id}
          style={{
            position: 'fixed',
            top: `${s.top}%`,
            width: `${s.width}px`,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,123,255,0.6), rgba(180,79,255,0.4), transparent)',
            animation: `streakMove ${s.duration}s linear ${s.delay}s infinite`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes streakMove {
          0% { transform: translateX(-200px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(110vw); opacity: 0; }
        }
      `}</style>
    </>
  )
}

// ── Speed lines on race start
const SpeedLines = ({ active }) => {
  const [lines, setLines] = useState([])
  useEffect(() => {
    if (!active) return
    const newLines = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      top: Math.random() * 100,
      delay: Math.random() * 0.4,
      width: Math.random() * 300 + 100,
    }))
    setLines(newLines)
    setTimeout(() => setLines([]), 1500)
  }, [active])
  return (
    <>
      {lines.map(line => (
        <div
          key={line.id}
          style={{
            position: 'fixed',
            top: `${line.top}%`,
            width: `${line.width}px`,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #007BFF, #B44FFF, transparent)',
            animation: `speedLine 0.6s ease-out ${line.delay}s forwards`,
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      ))}
      <style>{`
        @keyframes speedLine {
          0% { transform: translateX(-100%); opacity: 0.8; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
      `}</style>
    </>
  )
}

// ── Animated number
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
    <span
      style={{
        display: 'inline-block',
        transition: 'all 0.15s ease',
        transform: flip ? 'translateY(-4px)' : 'translateY(0)',
        opacity: flip ? 0 : 1,
      }}
    >
      {display}
    </span>
  )
}

// ── Glass card style
const glass = (extra = {}) => ({
  background: 'rgba(10, 25, 60, 0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 123, 255, 0.2)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
  transition: 'all 0.3s ease',
  ...extra,
})

export default function DisplayScreen() {
  const {
    activeRace, entries, setEntries, raceStatus, setRaceStatus,
    hallOfFame, fetchHallOfFame, raceHistory, fetchRaceHistory,
    fetchActiveRace, theme
  } = useRace()

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
  const [showVideo, setShowVideo] = useState(false)
  const [flashRow, setFlashRow] = useState(null)
  const timerRef = useRef(null)
  const now = new Date()

  const t = themes[theme] || themes.premium

  useEffect(() => {
    fetchActiveRace()
    fetchHallOfFame()
    fetchRaceHistory()
  }, [])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setRaceTimer(p => p + 1), 1000)
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
      setTimeout(() => setPositionChanges({}), 1200)
    }
    const newPos = {}
    entries.forEach(e => { newPos[e.id] = e.position })
    setPrevPositions(newPos)
  }, [entries])

  useEffect(() => {
    if (!socket) return
    if (activeRace?.id) socket.emit('join_race', activeRace.id)

    socket.on('leaderboard_update', data => {
      setEntries(data.entries || [])
      // Flash the updated entry
      if (data.entries?.[0]) setFlashRow(data.entries[0].id)
      setTimeout(() => setFlashRow(null), 800)
    })

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
  const timerPct = raceStatus === 'active' ? (raceTimer / duration) * 100 : 0
  const isLowTime = timeLeft < 30 && raceStatus === 'active'

  const statusConfig = {
    waiting:   { label: '⏳ WAITING TO START', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
    active:    { label: '🟢 RACE IN PROGRESS', color: '#00FF88', bg: 'rgba(0,255,136,0.1)' },
    completed: { label: '🏁 RACE COMPLETE',    color: '#007BFF', bg: 'rgba(0,123,255,0.1)' },
    podium:    { label: '🏆 PODIUM',           color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  }
  const status = statusConfig[raceStatus] || statusConfig.waiting

  // ── BG style
  const bgStyle = {
    minHeight: '100vh',
    background: `
      radial-gradient(ellipse at 15% 25%, rgba(0,123,255,0.18) 0%, transparent 45%),
      radial-gradient(ellipse at 85% 75%, rgba(106,13,173,0.18) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 50%, rgba(0,50,100,0.1) 0%, transparent 60%),
      linear-gradient(160deg, #020c1e 0%, #0A1F44 40%, #0d0a2e 70%, #020818 100%)
    `,
    fontFamily: 'Rajdhani, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  }

  // ── COUNTDOWN ──
  if (countdown !== null) {
    return (
      <div style={{ ...bgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 0, }}>
        <RacingBackground 
          videoUrl={showVideo ?"https://res.cloudinary.com/daeyrrskx/video/upload/v1775979082/12665098_1922_1080_30fps_mst1ac.mp4" : null}
          opacity={0.15}
        />
        <Particles />
        <LightStreaks />
        <SpeedLines active={speedLines} />

        {/* Big radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,123,255,0.25) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* Race name */}
          <div style={{ color: '#94B8FF', fontSize: '18px', letterSpacing: '8px', marginBottom: '24px', fontWeight: 600 }}>
            {activeRace?.venue_name?.toUpperCase() || 'RACEZONE'}
          </div>

          {/* Countdown number */}
          <div
            key={countdownKey}
            style={{
              fontSize: countdown === 0 ? '14rem' : '20rem',
              lineHeight: 1,
              fontWeight: 900,
              background: countdown === 0
                ? 'linear-gradient(135deg, #00FF88, #007BFF)'
                : 'linear-gradient(135deg, #007BFF, #B44FFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 60px rgba(0,123,255,0.8))',
              animation: 'countdownPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
            }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </div>

          {/* Ring animation */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '400px', height: '400px', borderRadius: '50%', border: '2px solid rgba(0,123,255,0.3)', animation: 'ringPulse 1s ease-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '500px', borderRadius: '50%', border: '1px solid rgba(180,79,255,0.2)', animation: 'ringPulse 1s ease-out 0.3s infinite', pointerEvents: 'none' }} />
        </div>

        <style>{`
          @keyframes countdownPop {
            0% { transform: scale(0.4); opacity: 0; filter: drop-shadow(0 0 80px rgba(0,123,255,1)); }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes ringPulse {
            0% { transform: translate(-50%,-50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%,-50%) scale(1.5); opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  // ── PODIUM ──
  if (showPodium && entries.length >= 2) {
    const sorted = [...entries].sort((a, b) => (a.position || 99) - (b.position || 99))
    const podiumOrder = [sorted[1], sorted[0], sorted[2]].filter(Boolean)
    const heights = ['160px', '210px', '120px']
    const medals = ['🥈', '🥇', '🥉']
    const labels = ['P2', 'P1', 'P3']
    const podiumBg = [
      'linear-gradient(180deg, #C0C0C0, #888)',
      'linear-gradient(180deg, #FFD700, #B8860B)',
      'linear-gradient(180deg, #CD7F32, #8B4513)',
    ]
    const podiumGlow = ['rgba(192,192,192,0.5)', 'rgba(255,215,0,0.7)', 'rgba(205,127,50,0.5)']

    return (
      <div style={{ ...bgStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative',  zIndex: 0, }}>
        <RacingBackground
          videoUrl={showVideo ?"https://res.cloudinary.com/daeyrrskx/video/upload/v1775979082/12665098_1922_1080_30fps_mst1ac.mp4" : null}
          opacity={0.15}
        />
        <Particles />
        <LightStreaks />

        {/* Confetti-like background */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, rgba(255,215,0,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative', zIndex: 10, animation: 'fadeSlideDown 0.6s ease-out forwards' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontSize: '72px', fontWeight: 900, letterSpacing: '10px', background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.6))' }}>
            PODIUM
          </div>
          <div style={{ color: '#94B8FF', fontSize: '18px', letterSpacing: '6px', marginTop: '4px' }}>
            {activeRace?.venue_name || 'RaceZone Arena'}
          </div>
        </div>

        {/* Podium */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', position: 'relative', zIndex: 10, marginBottom: '48px' }}>
          {podiumOrder.map((entry, i) => (
            <div
              key={entry?.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                animation: `podiumRise 0.8s cubic-bezier(0.175,0.885,0.32,1.275) ${i * 0.15}s both`,
              }}
            >
              {/* Driver info above podium */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '52px', filter: `drop-shadow(0 0 15px ${podiumGlow[i]})` }}>{entry?.avatar || '🏎️'}</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '2px', marginTop: '6px' }}>{entry?.name}</div>
                <div style={{ color: '#94B8FF', fontSize: '12px', fontFamily: 'monospace', marginTop: '2px' }}>
                  ⚡ {formatLapTime(entry?.best_lap_ms)}
                </div>
                <div style={{ color: '#6A8FBF', fontSize: '11px', fontFamily: 'monospace' }}>
                  {formatLapTime(entry?.total_time_ms)} total
                </div>
              </div>

              {/* Podium block */}
              <div style={{ height: heights[i], width: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '20px', borderRadius: '12px 12px 0 0', background: podiumBg[i], boxShadow: `0 0 40px ${podiumGlow[i]}, 0 -4px 0 rgba(255,255,255,0.2) inset` }}>
                <div style={{ fontSize: '44px' }}>{medals[i]}</div>
                <div style={{ fontSize: '30px', fontWeight: 900, color: i === 1 ? '#000' : '#fff', marginTop: '4px' }}>{labels[i]}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom branding */}
        <div style={{ color: '#4A7FFF', fontSize: '14px', letterSpacing: '8px', fontWeight: 700, position: 'relative', zIndex: 10 }}>
          RACEZONE RC RACING EXPERIENCE
        </div>

        {/* Share button */}
        {entries.length > 0 && (
          <button
            onClick={() => setShowShareCard(true)}
            style={{ marginTop: '24px', padding: '12px 36px', background: 'linear-gradient(135deg, #007BFF, #B44FFF)', color: '#fff', fontWeight: 900, fontSize: '16px', letterSpacing: '4px', borderRadius: '999px', border: 'none', cursor: 'pointer', boxShadow: '0 0 30px rgba(0,123,255,0.5)', fontFamily: 'Rajdhani, sans-serif', position: 'relative', zIndex: 10 }}
          >
            📸 SHARE YOUR RESULT
          </button>
        )}

        {showShareCard && <ShareCard entries={entries} activeRace={activeRace} onClose={() => setShowShareCard(false)} />}

        <style>{`
          @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-30px); } to { opacity:1; transform:translateY(0); } }
          @keyframes podiumRise { from { opacity:0; transform:translateY(60px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </div>
    )
  }

  // ── MAIN DISPLAY ──
  return (
    <div style={{ ...bgStyle, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 0, }}>
      <RacingBackground
        videoUrl={showVideo ?"https://res.cloudinary.com/daeyrrskx/video/upload/v1775979082/12665098_1922_1080_30fps_mst1ac.mp4" : null}
        opacity={0.15}
      />
      <Particles />
      <LightStreaks />
      <SpeedLines active={speedLines} />

      {/* Scan line */}
      <div style={{ position: 'fixed', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,123,255,0.4), transparent)', animation: 'scanMove 10s linear infinite', pointerEvents: 'none', zIndex: 1 }} />

      {/* Top gradient line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #007BFF 30%, #B44FFF 70%, transparent)', boxShadow: '0 0 20px rgba(0,123,255,0.8)', position: 'relative', zIndex: 10 }} />

      {/* ── TOP BAR ── */}
      <div style={{ ...glass({ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid rgba(0,123,255,0.25)' }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #007BFF, #B44FFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 0 20px rgba(0,123,255,0.6), 0 0 40px rgba(180,79,255,0.3)', flexShrink: 0 }}>⚡</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '6px', background: 'linear-gradient(135deg, #FFFFFF 0%, #94B8FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>RACEZONE</div>
            <div style={{ color: '#4A7FFF', fontSize: '9px', letterSpacing: '4px' }}>RC RACING EXPERIENCE</div>
          </div>
          <div style={{ width: '1px', height: '38px', background: 'linear-gradient(180deg, transparent, rgba(0,123,255,0.5), transparent)', margin: '0 6px' }} />
          <span style={{ color: '#6A8FBF', fontSize: '12px', letterSpacing: '3px' }}>LIVE RACE DISPLAY</span>
        </div>

        {/* Status */}
        <div style={{ padding: '10px 28px', borderRadius: '999px', border: `2px solid ${status.color}`, color: status.color, fontWeight: 800, fontSize: '15px', letterSpacing: '3px', boxShadow: `0 0 25px ${status.color}55`, background: status.bg, transition: 'all 0.3s ease' }}>
          {status.label}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowVideo(v => !v)}
            style={{ padding: '8px 16px', background: 'rgba(0,123,255,0.2)', border: '1px solid rgba(0,123,255,0.4)', borderRadius: '8px', color: '#94B8FF', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Rajdhani, sans-serif' }}
            >
            {showVideo ? '🎥 VIDEO' : '🌌 DEFAULT'}
          </button>
          
          <ThemeSwitcher />
          
          <div style={{ ...glass({ padding: '6px 14px', borderRadius: '10px' }), color: '#94B8FF', fontSize: '13px', fontFamily: 'monospace' }}>
            {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>

        {/* ── LEADERBOARD ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 16px' }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '4px', height: '28px', background: 'linear-gradient(180deg, #007BFF, #B44FFF)', borderRadius: '2px', boxShadow: '0 0 12px rgba(0,123,255,0.8)' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '20px', letterSpacing: '6px', background: 'linear-gradient(135deg, #FFFFFF, #94B8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>LIVE TIMING TOWER</span>
            {raceStatus === 'active' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,255,136,0.1)', padding: '4px 14px', borderRadius: '999px', border: '1px solid rgba(0,255,136,0.3)', marginLeft: '4px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00FF88', boxShadow: '0 0 10px #00FF88', animation: 'livePulse 1s ease-in-out infinite' }} />
                <span style={{ color: '#00FF88', fontSize: '11px', letterSpacing: '3px', fontWeight: 700 }}>LIVE</span>
              </div>
            )}
            {/* Race number */}
            {activeRace && (
              <div style={{ marginLeft: 'auto', color: '#4A7FFF', fontSize: '12px', letterSpacing: '2px', background: 'rgba(0,123,255,0.08)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(0,123,255,0.15)' }}>
                RACE #{activeRace.id} · {activeRace.venue_name}
              </div>
            )}
          </div>

          {/* Column headers */}
          {entries.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '3.5rem 1fr 7rem 10rem 10rem 8rem', padding: '10px 20px', marginBottom: '10px', background: 'rgba(0,123,255,0.07)', borderRadius: '10px', border: '1px solid rgba(0,123,255,0.12)' }}>
              {['POS', 'DRIVER', 'LAPS', 'BEST LAP', 'TOTAL', 'GAP'].map((h, i) => (
                <div key={h} style={{ color: '#4A7FFF', fontSize: '10px', fontWeight: 800, letterSpacing: '3px', textAlign: i <= 1 ? 'left' : 'center' }}>{h}</div>
              ))}
            </div>
          )}

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {gappedEntries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '90px', marginBottom: '20px', filter: 'drop-shadow(0 0 30px rgba(0,123,255,0.5))', animation: 'floatCar 3s ease-in-out infinite' }}>🏎️</div>
                <div style={{ fontSize: '28px', letterSpacing: '4px', fontWeight: 700, background: 'linear-gradient(135deg, #FFFFFF, #94B8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Waiting for drivers...</div>
                <div style={{ fontSize: '14px', marginTop: '8px', color: '#4A7FFF' }}>Add drivers from the admin panel</div>
              </div>
            ) : (
              gappedEntries.map((entry, index) => {
                const isFastest = fastestLapEntry?.id === entry.id
                const posColor = POSITION_COLORS[entry.position] || '#FFFFFF'
                const posChange = positionChanges[entry.id]
                const isLeader = index === 0
                const isFlashing = flashRow === entry.id

                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3.5rem 1fr 7rem 10rem 10rem 8rem',
                      alignItems: 'center',
                      padding: '14px 20px',
                      borderRadius: '14px',
                      border: isFastest
                        ? '1px solid rgba(180,79,255,0.5)'
                        : isLeader
                          ? '1px solid rgba(0,123,255,0.45)'
                          : '1px solid rgba(0,123,255,0.1)',
                      background: isFastest
                        ? 'linear-gradient(135deg, rgba(180,79,255,0.12), rgba(106,13,173,0.08))'
                        : isLeader
                          ? `linear-gradient(90deg, rgba(0,123,255,0.18), rgba(10,25,60,0.6))`
                          : isFlashing
                            ? 'rgba(0,255,136,0.1)'
                            : 'rgba(10,25,60,0.55)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: isLeader
                        ? '0 4px 24px rgba(0,123,255,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
                        : isFastest
                          ? '0 4px 24px rgba(180,79,255,0.2)'
                          : '0 2px 8px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s ease',
                      animation: posChange === 'up'
                        ? 'flashGreen 1s ease-out forwards'
                        : posChange === 'down'
                          ? 'flashRed 1s ease-out forwards'
                          : `rowIn 0.4s ease-out ${index * 0.04}s both`,
                      borderLeft: isLeader ? `4px solid ${entry.color || '#007BFF'}` : undefined,
                    }}
                  >
                    {/* Position */}
                    <div style={{ fontSize: '30px', fontWeight: 900, color: posColor, textShadow: entry.position <= 3 ? `0 0 20px ${posColor}88` : 'none' }}>
                      <AnimatedNumber value={entry.position || index + 1} />
                    </div>

                    {/* Driver */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, background: `linear-gradient(135deg, ${entry.color}33, ${entry.color}11)`, border: `2px solid ${entry.color}`, color: entry.color, flexShrink: 0, boxShadow: `0 0 15px ${entry.color}55` }}>
                        {entry.car_number || '?'}
                      </div>
                      <div>
                        <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '20px', lineHeight: 1.1, letterSpacing: '1px' }}>{entry.name}</div>
                        <div style={{ color: '#4A7FFF', fontSize: '13px', marginTop: '1px' }}>{entry.avatar}</div>
                      </div>
                      {isFastest && (
                        <div style={{ background: 'linear-gradient(135deg, #B44FFF, #6A0DAD)', color: '#fff', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, boxShadow: '0 0 15px rgba(180,79,255,0.7)', letterSpacing: '1px', marginLeft: '4px', whiteSpace: 'nowrap' }}>
                          ⚡ FASTEST
                        </div>
                      )}
                      {posChange === 'up' && <span style={{ color: '#00FF88', fontWeight: 800, fontSize: '18px', marginLeft: '4px' }}>▲</span>}
                      {posChange === 'down' && <span style={{ color: '#FF4444', fontWeight: 800, fontSize: '18px', marginLeft: '4px' }}>▼</span>}
                    </div>

                    {/* Laps */}
                    <div style={{ textAlign: 'center', color: '#EAEAEA', fontWeight: 900, fontSize: '26px', fontFamily: 'monospace' }}>
                      <AnimatedNumber value={entry.lap_count || 0} />
                    </div>

                    {/* Best lap */}
                    <div style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '17px', color: isFastest ? '#B44FFF' : '#00D2FF', textShadow: isFastest ? '0 0 15px rgba(180,79,255,0.8)' : '0 0 8px rgba(0,210,255,0.4)' }}>
                      {formatLapTime(entry.best_lap_ms)}
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '15px', color: '#6A8FBF' }}>
                      {entry.total_time_ms ? formatLapTime(entry.total_time_ms) : '--'}
                    </div>

                    {/* Gap */}
                    <div style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: entry.gap === 'LEADER' ? '#FFD700' : '#94B8FF', textShadow: entry.gap === 'LEADER' ? '0 0 15px rgba(255,215,0,0.7)' : 'none' }}>
                      {entry.gap || '--'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ width: '295px', display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 14px', borderLeft: '1px solid rgba(0,123,255,0.18)', background: 'rgba(5,15,45,0.7)', backdropFilter: 'blur(24px)', overflowY: 'auto' }}>

          {/* Race Timer */}
          <div style={glass({ padding: '16px' })}>
            <div style={{ color: '#4A7FFF', fontSize: '10px', letterSpacing: '3px', marginBottom: '6px', fontWeight: 700 }}>RACE TIME</div>
            <div style={{ fontSize: '46px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, background: isLowTime ? 'linear-gradient(135deg, #FF4444, #FF8800)' : 'linear-gradient(135deg, #FFFFFF, #94B8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', transition: 'all 0.5s ease' }}>
              {formatCountdown(raceStatus === 'active' ? timeLeft : duration)}
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: '10px', height: '5px', background: 'rgba(0,123,255,0.12)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '3px', width: `${timerPct}%`, background: isLowTime ? 'linear-gradient(90deg, #FF4444, #FF8800)' : 'linear-gradient(90deg, #007BFF, #B44FFF)', boxShadow: isLowTime ? '0 0 10px rgba(255,68,68,0.8)' : '0 0 10px rgba(0,123,255,0.8)', transition: 'width 1s linear, background 0.5s ease' }} />
            </div>
            <div style={{ color: isLowTime ? '#FF6644' : '#4A7FFF', fontSize: '10px', letterSpacing: '2px', marginTop: '6px', transition: 'color 0.5s ease' }}>
              {raceStatus === 'active' ? (isLowTime ? '⚠️ LOW TIME' : 'IN PROGRESS') : raceStatus?.toUpperCase()}
            </div>
          </div>

          {/* Fastest Lap */}
          <div style={glass({ padding: '14px', border: '1px solid rgba(180,79,255,0.3)', boxShadow: '0 4px 20px rgba(180,79,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #B44FFF, #6A0DAD)', boxShadow: '0 0 12px rgba(180,79,255,0.9)' }} />
              <span style={{ color: '#B44FFF', fontSize: '10px', letterSpacing: '3px', fontWeight: 700 }}>FASTEST LAP</span>
            </div>
            {fastestLapEntry ? (
              <>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', background: 'linear-gradient(135deg, #B44FFF, #007BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {formatLapTime(fastestLapEntry.best_lap_ms)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{fastestLapEntry.avatar}</span>
                  <div>
                    <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px' }}>{fastestLapEntry.name}</div>
                    <div style={{ color: '#4A7FFF', fontSize: '11px' }}>Car #{fastestLapEntry.car_number}</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: '#4A7FFF', fontSize: '13px' }}>No laps recorded yet</div>
            )}
          </div>

          {/* Hall of Fame */}
          <div style={glass({ padding: '14px' })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span>🏆</span>
              <span style={{ color: '#EAEAEA', fontSize: '10px', letterSpacing: '3px', fontWeight: 700 }}>HALL OF FAME</span>
            </div>
            {hallOfFame.length === 0 ? (
              <div style={{ color: '#4A7FFF', fontSize: '12px' }}>No records yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hallOfFame.slice(0, 5).map((record, i) => (
                  <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(0,123,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                      <div>
                        <div style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 700 }}>{record.name}</div>
                        <div style={{ color: '#4A7FFF', fontSize: '10px' }}>{record.venue_name}</div>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #B44FFF, #007BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700 }}>
                      {formatLapTime(record.lap_time_ms)}
                    </div>
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
          <div style={glass({ padding: '14px', textAlign: 'center' })}>
            <div style={{ color: '#4A7FFF', fontSize: '10px', letterSpacing: '3px', marginBottom: '10px' }}>VENUE PARTNER</div>
            {activeRace?.venue_logo_url ? (
              <img src={activeRace.venue_logo_url} alt="Venue" style={{ height: '48px', margin: '0 auto', objectFit: 'contain' }} />
            ) : (
              <div style={{ background: 'linear-gradient(135deg, #007BFF, #B44FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 800, fontSize: '16px', letterSpacing: '2px' }}>
                {activeRace?.venue_name || 'RaceZone Arena'}
              </div>
            )}
          </div>

          {/* QR Code */}
          <div style={glass({ padding: '14px', textAlign: 'center' })}>
            <div style={{ color: '#4A7FFF', fontSize: '10px', letterSpacing: '3px', marginBottom: '10px' }}>SCAN TO BOOK</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              <QRCodeSVG value={import.meta.env.VITE_BOOKING_URL || 'https://racezone.in'} size={80} bgColor="transparent" fgColor="#94B8FF" level="M" />
            </div>
            <div style={{ color: '#4A7FFF', fontSize: '11px', marginTop: '8px' }}>racezone.in</div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM TICKER ── */}
      <div style={{ borderTop: '1px solid rgba(0,123,255,0.2)', background: 'rgba(5,15,45,0.9)', height: '34px', overflow: 'hidden', position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50px', background: 'linear-gradient(90deg, rgba(5,15,45,1), transparent)', zIndex: 2 }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50px', background: 'linear-gradient(270deg, rgba(5,15,45,1), transparent)', zIndex: 2 }} />
        <div style={{ animation: 'tickerScroll 25s linear infinite', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '32px', color: '#4A7FFF', fontSize: '11px', letterSpacing: '3px', fontWeight: 700 }}>
          <span>🏎️ RACEZONE RC RACING</span>
          <span style={{ color: '#007BFF' }}>◆</span>
          <span>LIVE TIMING SYSTEM</span>
          <span style={{ color: '#007BFF' }}>◆</span>
          <span>BOOK YOUR EVENT: racezone.in</span>
          <span style={{ color: '#007BFF' }}>◆</span>
          <span>🏁 PREMIUM RC RACING EXPERIENCE</span>
          <span style={{ color: '#007BFF' }}>◆</span>
          {activeRace?.venue_name && <span style={{ color: '#94B8FF' }}>NOW AT: {activeRace.venue_name.toUpperCase()}</span>}
          {fastestLapEntry && <><span style={{ color: '#007BFF' }}>◆</span><span style={{ color: '#B44FFF' }}>⚡ FASTEST: {fastestLapEntry.name} — {formatLapTime(fastestLapEntry.best_lap_ms)}</span></>}
        </div>
      </div>

      {/* Share button */}
      {(raceStatus === 'completed' || raceStatus === 'podium') && entries.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px', borderTop: '1px solid rgba(0,123,255,0.2)', background: 'rgba(5,15,45,0.95)', zIndex: 10 }}>
          <button
            onClick={() => setShowShareCard(true)}
            style={{ padding: '12px 40px', background: 'linear-gradient(135deg, #007BFF, #B44FFF)', color: '#fff', fontWeight: 900, fontSize: '16px', letterSpacing: '4px', borderRadius: '999px', border: 'none', cursor: 'pointer', boxShadow: '0 0 30px rgba(0,123,255,0.5), 0 0 60px rgba(180,79,255,0.3)', fontFamily: 'Rajdhani, sans-serif', transition: 'all 0.3s ease' }}
          >
            📸 SHARE YOUR RESULT
          </button>
        </div>
      )}

      {showShareCard && <ShareCard entries={entries} activeRace={activeRace} onClose={() => setShowShareCard(false)} />}

      {/* All keyframes */}
      <style>{`
        @keyframes scanMove { 0% { top: -2px; } 100% { top: 100vh; } }
        @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes floatCar { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        @keyframes rowIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes flashGreen { 0% { box-shadow: 0 0 30px rgba(0,255,136,0.6); border-color: rgba(0,255,136,0.8); } 100% { box-shadow: none; } }
        @keyframes flashRed { 0% { box-shadow: 0 0 30px rgba(255,68,68,0.6); border-color: rgba(255,68,68,0.8); } 100% { box-shadow: none; } }
        @keyframes tickerScroll { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  )
}