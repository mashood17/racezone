import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { formatLapTime } from '../../utils/formatTime'

const POSITION_LABELS = { 1: '🥇 P1', 2: '🥈 P2', 3: '🥉 P3' }
const POSITION_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

export default function ShareCard({ entries, activeRace, onClose }) {
  const [selectedDriver, setSelectedDriver] = useState(entries?.[0] || null)
  const [generating, setGenerating] = useState(false)
  const cardRef = useRef(null)

  const handleDownload = async () => {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `racezone-${selectedDriver?.name || 'result'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Share card error:', err)
    } finally {
      setGenerating(false)
    }
  }

  if (!entries || entries.length === 0) return null

  const driver = selectedDriver
  const posColor = POSITION_COLORS[driver?.position] || driver?.color || '#e10600'
  const posLabel = POSITION_LABELS[driver?.position] || `P${driver?.position}`

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-black font-race text-xl tracking-wider">
            📸 SHARE YOUR RESULT
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Driver selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {entries.map(entry => (
            <button
              key={entry.id}
              onClick={() => setSelectedDriver(entry)}
              className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-bold transition-all border-2"
              style={{
                borderColor: selectedDriver?.id === entry.id ? entry.color : 'transparent',
                backgroundColor: selectedDriver?.id === entry.id ? entry.color + '22' : '#12121a',
                color: entry.color,
              }}
            >
              {entry.avatar} {entry.name}
            </button>
          ))}
        </div>

        {/* THE CARD — this gets captured */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
            border: `2px solid ${posColor}`,
            boxShadow: `0 0 40px ${posColor}44`,
            padding: '32px',
            fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(${posColor}44 1px, transparent 1px),
                linear-gradient(90deg, ${posColor}44 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${posColor}, transparent)` }}
          />

          {/* Content */}
          <div className="relative z-10">

            {/* RaceZone branding */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span style={{ color: '#e10600', fontSize: '24px' }}>⚡</span>
                <span
                  className="font-black tracking-widest"
                  style={{ fontSize: '20px', color: '#ffffff' }}
                >
                  RACEZONE
                </span>
              </div>
              <div style={{ color: '#444', fontSize: '12px', letterSpacing: '2px' }}>
                RC RACING EXPERIENCE
              </div>
            </div>

            {/* Position & Driver */}
            <div className="flex items-center gap-6 mb-6">
              {/* Big position */}
              <div
                className="font-black"
                style={{
                  fontSize: '80px',
                  lineHeight: 1,
                  color: posColor,
                  textShadow: `0 0 30px ${posColor}`,
                  fontFamily: 'Rajdhani, sans-serif',
                }}
              >
                P{driver?.position || '?'}
              </div>

              {/* Driver details */}
              <div>
                <div
                  className="font-black"
                  style={{
                    fontSize: '36px',
                    color: '#ffffff',
                    lineHeight: 1.1,
                    fontFamily: 'Rajdhani, sans-serif',
                  }}
                >
                  {driver?.name}
                </div>
                <div style={{ color: posColor, fontSize: '24px', marginTop: '4px' }}>
                  {posLabel}
                </div>
                <div style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>
                  Car #{driver?.car_number} · {driver?.avatar}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div
              className="grid gap-3 mb-6"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
            >
              {[
                {
                  label: 'BEST LAP',
                  value: formatLapTime(driver?.best_lap_ms),
                  color: '#9b59b6',
                  icon: '⚡'
                },
                {
                  label: 'TOTAL TIME',
                  value: formatLapTime(driver?.total_time_ms),
                  color: '#ffffff',
                  icon: '⏱️'
                },
                {
                  label: 'LAPS',
                  value: driver?.lap_count || 0,
                  color: '#00d2be',
                  icon: '🔄'
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 900,
                      color: stat.color,
                      fontFamily: 'Share Tech Mono, monospace',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '10px', color: '#555', letterSpacing: '2px', marginTop: '2px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Venue + date */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: '#555', fontSize: '11px', letterSpacing: '2px' }}>VENUE</div>
                <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700 }}>
                  {activeRace?.venue_name || 'RaceZone Arena'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#555', fontSize: '11px', letterSpacing: '2px' }}>DATE</div>
                <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700 }}>
                  {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Share text */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: posColor + '11',
                border: `1px solid ${posColor}33`,
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '13px',
                color: '#888',
                fontStyle: 'italic',
              }}
            >
              "{driver?.name} finished {posLabel} with a best lap of {formatLapTime(driver?.best_lap_ms)} at {activeRace?.venue_name || 'RaceZone'}"
            </div>
          </div>

          {/* Bottom accent */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${posColor}, transparent)` }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 py-3 bg-f1red hover:bg-red-700 disabled:opacity-50 text-white font-black font-race tracking-widest rounded-lg transition-all"
          >
            {generating ? 'GENERATING...' : '📥 DOWNLOAD CARD'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-darkborder text-gray-400 hover:text-white rounded-lg transition-all"
          >
            Close
          </button>
        </div>

        <p className="text-gray-700 text-xs text-center mt-2">
          Screenshot or download and share on social media!
        </p>
      </div>
    </div>
  )
}