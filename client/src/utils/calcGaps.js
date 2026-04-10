// Calculate gap between P1 and each driver
export const calculateGaps = (entries) => {
  if (!entries || entries.length === 0) return []

  return entries.map((entry, index) => {
    if (index === 0) return { ...entry, gap: 'LEADER' }
    const leader = entries[0]
    const lapDiff = (leader.lap_count || 0) - (entry.lap_count || 0)
    if (lapDiff > 0) return { ...entry, gap: `+${lapDiff} LAP${lapDiff > 1 ? 'S' : ''}` }
    const gapMs = (entry.total_time_ms || 0) - (leader.total_time_ms || 0)
    if (gapMs <= 0) return { ...entry, gap: 'LEADER' }
    return { ...entry, gap: `+${(gapMs / 1000).toFixed(3)}s` }
  })
}

// Find entry with the fastest lap
export const findFastestLap = (entries) => {
  if (!entries || entries.length === 0) return null
  return entries.reduce((fastest, entry) => {
    if (!entry.best_lap_ms) return fastest
    if (!fastest || entry.best_lap_ms < fastest.best_lap_ms) return entry
    return fastest
  }, null)
}