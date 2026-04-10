const pool = require('../config/db');

// GET all races
const getAllRaces = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM races ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET active race
const getActiveRace = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM races WHERE status = 'active' LIMIT 1"
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    next(err);
  }
};

// GET single race with drivers + laps
const getRaceDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const race = await pool.query('SELECT * FROM races WHERE id = $1', [id]);
    if (race.rows.length === 0) return res.status(404).json({ error: 'Race not found' });

    const entries = await pool.query(
      `SELECT re.*, d.name, d.avatar, d.car_number, d.color
       FROM race_entries re
       JOIN drivers d ON re.driver_id = d.id
       WHERE re.race_id = $1
       ORDER BY re.position ASC`,
      [id]
    );

    res.json({ race: race.rows[0], entries: entries.rows });
  } catch (err) {
    next(err);
  }
};

// POST create race
const createRace = async (req, res, next) => {
  try {
    const { venue_name, venue_logo_url, duration_seconds, total_laps } = req.body
    await pool.query(
      "UPDATE races SET status = 'completed' WHERE status = 'active'"
    )
    const result = await pool.query(
      `INSERT INTO races (venue_name, venue_logo_url, duration_seconds, total_laps, status)
       VALUES ($1, $2, $3, $4, 'waiting') RETURNING *`,
      [venue_name, venue_logo_url, duration_seconds || 180, total_laps || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    next(err)
  }
}

// PATCH update race status
const updateRaceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, started_at, ended_at } = req.body;
    const result = await pool.query(
      `UPDATE races SET status=$1, started_at=$2, ended_at=$3
       WHERE id=$4 RETURNING *`,
      [status, started_at || null, ended_at || null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST add driver to race
const addDriverToRace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;
    const result = await pool.query(
      `INSERT INTO race_entries (race_id, driver_id, position)
       VALUES ($1, $2, 0) RETURNING *`,
      [id, driver_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET hall of fame — all time fastest laps per venue
const getHallOfFame = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
         l.id,
         l.lap_time_ms,
         l.created_at,
         d.name,
         d.avatar,
         d.car_number,
         d.color,
         r.venue_name
       FROM laps l
       JOIN race_entries re ON l.race_entry_id = re.id
       JOIN drivers d ON re.driver_id = d.id
       JOIN races r ON re.race_id = r.id
       ORDER BY l.lap_time_ms ASC
       LIMIT 5`
    )
    res.json(result.rows)
  } catch (err) {
    next(err)
  }
}

// DELETE single hall of fame entry
const deleteHallOfFameEntry = async (req, res, next) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM laps WHERE id = $1', [id])
    res.json({ message: 'Entry deleted' })
  } catch (err) {
    next(err)
  }
}

// DELETE all hall of fame (reset)
const resetHallOfFame = async (req, res, next) => {
  try {
    // Only delete laps that are in top 5
    await pool.query(`
      DELETE FROM laps
      WHERE id IN (
        SELECT l.id FROM laps l
        JOIN race_entries re ON l.race_entry_id = re.id
        JOIN drivers d ON re.driver_id = d.id
        JOIN races r ON re.race_id = r.id
        ORDER BY l.lap_time_ms ASC
        LIMIT 5
      )
    `)
    res.json({ message: 'Hall of Fame reset' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAllRaces, getActiveRace, getRaceDetail,
  createRace, updateRaceStatus, addDriverToRace, getHallOfFame, 
  deleteHallOfFameEntry, resetHallOfFame
};