// Convert milliseconds to race display format
// e.g. 83456 → "1:23.456"
export const formatLapTime = (ms) => {
  if (!ms || ms === 0) return '--:--.---'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const millis = ms % 1000
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
  }
  return `${seconds}.${String(millis).padStart(3, '0')}s`
}

// Convert seconds to MM:SS countdown display
export const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Convert ms to simple seconds string
export const msToSeconds = (ms) => {
  if (!ms) return '0.000'
  return (ms / 1000).toFixed(3)
}