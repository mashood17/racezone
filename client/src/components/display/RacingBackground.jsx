import { useRef, useEffect, useState } from 'react'

export default function RacingBackground({ videoUrl, opacity = 0.15 }) {
  const videoRef = useRef(null)
  const [loaded, setLoaded] = useState(true)
  const optimizedUrl = videoUrl?.replace('/upload/', '/upload/q_auto,vc_auto,w_1280,h_720,fps_30/')

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // autoplay blocked — try on user interaction
        document.addEventListener('click', () => {
          videoRef.current?.play()
        }, { once: true })
      })
    }
  }, [])

  // Default fallback — animated CSS if no video
  if (!videoUrl) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 15% 25%, rgba(0,123,255,0.18) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 75%, rgba(106,13,173,0.18) 0%, transparent 45%),
          linear-gradient(160deg, #020c1e 0%, #0A1F44 40%, #0d0a2e 70%, #020818 100%)
        `,
      }} />
    )
  }

  return (
  <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
    <video
      ref={videoRef}
      src={videoUrl}
      autoPlay
      muted
      loop
      playsInline
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 1,
      }}
    />
  </div>
)
}