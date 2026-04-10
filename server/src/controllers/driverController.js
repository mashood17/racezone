const pool = require('../config/db');

// GET all drivers
const getAllDrivers = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM drivers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET single driver
const getDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST create driver
const createDriver = async (req, res, next) => {
  try {
    const { name, avatar, car_number, color } = req.body;
    const result = await pool.query(
      `INSERT INTO drivers (name, avatar, car_number, color)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, avatar, car_number, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT update driver
const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, avatar, car_number, color } = req.body;
    const result = await pool.query(
      `UPDATE drivers SET name=$1, avatar=$2, car_number=$3, color=$4
       WHERE id=$5 RETURNING *`,
      [name, avatar, car_number, color, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE driver
const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM drivers WHERE id = $1', [id]);
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllDrivers, getDriver, createDriver, updateDriver, deleteDriver };