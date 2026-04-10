const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtUtils');

// For now: single admin account from .env
// Later you can move this to the DB
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (
      username !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ username, role: 'admin' });
    res.json({ token, username, role: 'admin' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login };