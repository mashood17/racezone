import { useEffect, useRef, useCallback } from 'react'

// Maps key '1','2','3','4' to driver index 0,1,2,3
const KEY_MAP = { '1': 0, '2': 1, '3': 2, '4': 3 }
const DEBOUNCE_MS = 1500 // prevent double-press within 1.5s

export const useKeyboardLap = ({ entries, token, raceStatus, onLapLogged, enabled }) => {
  const lastPressTime = useRef({}) // tracks last press time per key
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

  const logLap = useCallback(async (entry) => {
    if (!entry) return
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
          lap_time_ms: Date.now(), // server calculates relative time
        }),
      })
      if (!res.ok) throw new Error('Failed to log lap')
      onLapLogged(entry, lapNumber)
    } catch (err) {
      console.error('Keyboard lap error:', err)
    }
  }, [entries, token, onLapLogged])

  useEffect(() => {
    if (!enabled || raceStatus !== 'active') return

    const handleKeyDown = (e) => {
      // Ignore if typing in an input field
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      const driverIndex = KEY_MAP[e.key]
      if (driverIndex === undefined) return

      const now = Date.now()
      const lastPress = lastPressTime.current[e.key] || 0

      // Debounce — ignore if pressed too recently
      if (now - lastPress < DEBOUNCE_MS) {
        console.warn(`Key ${e.key} debounced — too fast`)
        return
      }

      lastPressTime.current[e.key] = now

      const entry = entries[driverIndex]
      if (!entry) {
        console.warn(`No driver at index ${driverIndex}`)
        return
      }

      console.log(`⌨️ Key ${e.key} → ${entry.name} lap ${(entry.lap_count || 0) + 1}`)
      logLap(entry)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, raceStatus, entries, logLap])
}