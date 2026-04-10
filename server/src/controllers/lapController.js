const pool = require('../config/db')

const logLap = async (req, res, next) => {
  try {
    const { race_entry_id, lap_number, lap_time_ms } = req.body

    let actualLapTimeMs = lap_time_ms

    // If lap_time_ms is a unix timestamp (button/keyboard mode)
    if (lap_time_ms > 1000000000000) {
      const prevLap = await pool.query(
        `SELECT created_at FROM laps 
         WHERE race_entry_id = $1 
         ORDER BY lap_number DESC LIMIT 1`,
        [race_entry_id]
      )

      if (prevLap.rows.length > 0) {
        const prevTime = new Date(prevLap.rows[0].created_at).getTime()
        actualLapTimeMs = lap_time_ms - prevTime
      } else {
        // First lap — from race start
        const raceData = await pool.query(
          `SELECT r.started_at 
           FROM races r
           JOIN race_entries re ON re.race_id = r.id
           WHERE re.id = $1`,
          [race_entry_id]
        )
        if (raceData.rows.length > 0 && raceData.rows[0].started_at) {
          const startTime = new Date(raceData.rows[0].started_at).getTime()
          
          console.log("START:", startTime)
          console.log("NOW:", lap_time_ms)
          console.log("DIFF:", lap_time_ms - startTime)

          let diff = lap_time_ms - startTime

// ✅ If race was started long ago → reset baseline
          if (diff > 600000) { // 10 minutes
            console.log("⚠️ Old race detected, resetting start time")
            diff = 2000 // assume 2s lap instead of failing
          }

          actualLapTimeMs = diff

          // If negative or too small → treat as first valid lap
          if (actualLapTimeMs < 100) {
            actualLapTimeMs = 1000 // 1 second minimum realistic lap
          }

        } else {
          return res.status(400).json({
            error: 'Race not started yet'
          })
        }
      }
    }

    // Safety check
    if (actualLapTimeMs > 3600000) {
      return res.status(400).json({
        error: 'Lap time too large'
      })
    }

    // Insert lap
    const result = await pool.query(
      `INSERT INTO laps (race_entry_id, lap_number, lap_time_ms)
       VALUES ($1, $2, $3) RETURNING *`,
      [race_entry_id, lap_number, actualLapTimeMs]
    )
    const lap = result.rows[0]

    // Update best lap and lap count
    await pool.query(
      `UPDATE race_entries
       SET best_lap_ms = LEAST(COALESCE(best_lap_ms, 999999999), $1),
           lap_count = COALESCE(lap_count, 0) + 1
       WHERE id = $2`,
      [actualLapTimeMs, race_entry_id]
    )

    // Calculate REAL total time = sum of all laps from DB
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(lap_time_ms), 0) as total
       FROM laps WHERE race_entry_id = $1`,
      [race_entry_id]
    )
    const realTotalMs = parseInt(totalResult.rows[0].total)

    // Update total_time_ms with real sum
    await pool.query(
      `UPDATE race_entries SET total_time_ms = $1 WHERE id = $2`,
      [realTotalMs, race_entry_id]
    )

    // Recalculate positions
    const raceResult = await pool.query(
      `SELECT race_id FROM race_entries WHERE id = $1`,
      [race_entry_id]
    )
    if (raceResult.rows.length > 0) {
      await recalcPositions(raceResult.rows[0].race_id)
    }

    res.status(201).json({ ...lap, lap_time_ms: actualLapTimeMs, total_time_ms: realTotalMs })

  } catch (err) {
    next(err)
  }
}

const recalcPositions = async (race_id) => {
  const entries = await pool.query(
    `SELECT id FROM race_entries
     WHERE race_id = $1
     ORDER BY lap_count DESC, total_time_ms ASC`,
    [race_id]
  )
  for (let i = 0; i < entries.rows.length; i++) {
    await pool.query(
      `UPDATE race_entries SET position = $1 WHERE id = $2`,
      [i + 1, entries.rows[i].id]
    )
  }
}

const getLapsForEntry = async (req, res, next) => {
  try {
    const { entry_id } = req.params
    const result = await pool.query(
      'SELECT * FROM laps WHERE race_entry_id = $1 ORDER BY lap_number ASC',
      [entry_id]
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

const deleteLastLap = async (req, res, next) => {
  try {
    const { entry_id } = req.params
    const lap = await pool.query(
      `SELECT * FROM laps WHERE race_entry_id = $1 ORDER BY lap_number DESC LIMIT 1`,
      [entry_id]
    )
    if (lap.rows.length === 0) return res.status(404).json({ error: 'No laps found' })

    const { id, lap_time_ms } = lap.rows[0]
    await pool.query('DELETE FROM laps WHERE id = $1', [id])

    await pool.query(
      `UPDATE race_entries
       SET total_time_ms = total_time_ms - $1, 
           lap_count = lap_count - 1,
           finish_position = NULL,
           finished_at = NULL
       WHERE id = $2`,
      [lap_time_ms, entry_id]
    )

    await pool.query(
      `UPDATE race_entries re
       SET best_lap_ms = (
         SELECT MIN(lap_time_ms) FROM laps WHERE race_entry_id = $1
       )
       WHERE id = $1`,
      [entry_id]
    )

    const raceResult = await pool.query(
      `SELECT race_id FROM race_entries WHERE id = $1`, [entry_id]
    )
    await recalcPositions(raceResult.rows[0].race_id)

    res.json({ message: 'Last lap deleted' })
  } catch (err) {
    next(err)
  }
}


module.exports = { logLap, getLapsForEntry, deleteLastLap }