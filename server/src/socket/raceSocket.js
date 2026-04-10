// This is the realtime engine — the TV screen listens here
const pool = require('../config/db');

const raceSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Display screen joins a room for the active race
    socket.on('join_race', (raceId) => {
      socket.join(`race_${raceId}`);
      console.log(`📺 Socket ${socket.id} joined race_${raceId}`);
    });

    // Admin triggers this after logging a lap → broadcast to display screen
    socket.on('lap_logged', async (data) => {
      const { race_id } = data;
      try {
        // Fetch fresh leaderboard
        const entries = await pool.query(
          `SELECT re.*, d.name, d.avatar, d.car_number, d.color
           FROM race_entries re
           JOIN drivers d ON re.driver_id = d.id
           WHERE re.race_id = $1
           ORDER BY re.position ASC`,
          [race_id]
        );
        // Broadcast to everyone watching this race
        io.to(`race_${race_id}`).emit('leaderboard_update', {
          race_id,
          entries: entries.rows,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Socket lap_logged error:', err);
      }
    });

    // Admin starts the race countdown
    socket.on('race_start', (data) => {
      io.to(`race_${data.race_id}`).emit('race_started', data);
    });

    // Admin ends the race
    socket.on('race_end', (data) => {
      io.to(`race_${data.race_id}`).emit('race_ended', data);
    });

    // Admin triggers podium screen
    socket.on('show_podium', (data) => {
      io.to(`race_${data.race_id}`).emit('podium_show', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = raceSocket;