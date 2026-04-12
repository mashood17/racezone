require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const pool = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const driverRoutes = require('./src/routes/drivers');
const raceRoutes = require('./src/routes/races');
const lapRoutes = require('./src/routes/laps');
const errorHandler = require('./src/middleware/errorHandler');
const raceSocket = require('./src/socket/raceSocket');

const app = express();
const httpServer = http.createServer(app);

// ── CORS ──
const allowedOrigins = [
  'http://localhost:5173',
  'https://racezone-hrwxtj4ny-mashood17s-projects.vercel.app',
  'https://racezone-9e9cdikkk-mashood17s-projects.vercel.app',
  'https://racezone-git-main-mashood17s-projects.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json());

// ── Socket.io ──
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/laps', lapRoutes);

app.get('/health', (req, res) => res.json({ status: 'RaceZone server running 🏁' }));

app.use(errorHandler);

raceSocket(io);

// ── Database Init ──
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(10) DEFAULT '🏎️',
        car_number VARCHAR(5) DEFAULT '00',
        color VARCHAR(20) DEFAULT '#e10600',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS races (
        id SERIAL PRIMARY KEY,
        venue_name VARCHAR(200) DEFAULT 'RaceZone Arena',
        venue_logo_url TEXT,
        duration_seconds INTEGER DEFAULT 180,
        total_laps INTEGER DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'waiting',
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS race_entries (
        id SERIAL PRIMARY KEY,
        race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
        driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        lap_count INTEGER DEFAULT 0,
        best_lap_ms INTEGER,
        total_time_ms INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS laps (
        id SERIAL PRIMARY KEY,
        race_entry_id INTEGER REFERENCES race_entries(id) ON DELETE CASCADE,
        lap_number INTEGER NOT NULL,
        lap_time_ms INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Database schema ready')
  } catch (err) {
    console.error('❌ DB init failed:', err)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 4000;

initDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 RaceZone server running on port ${PORT}`)
  })
})