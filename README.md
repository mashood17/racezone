# 🏁 RaceZone — Live RC Racing Display System

> A premium, real-time RC racing timing and display system inspired by Formula 1 broadcast visuals. Built for commercial deployment at cafes, events, parties, and gaming zones.

![RaceZone Display]![alt text](image.png) ![alt text](image-1.png) ![alt text](image-2.png)
![Tech](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20PostgreSQL-blue)
![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Render-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🌐 Live Demo

| Interface | URL | Description |
|---|---|---|
| 📺 Display Screen | [racezone.vercel.app](https://racezone.vercel.app) | TV display for spectators |
| 🎮 Admin Panel | [racezone.vercel.app/admin](https://racezone.vercel.app/admin) | Operator control panel |

> **Admin credentials:** `admin` / `racezone2024`

---

## 📸 What Is RaceZone?

RaceZone is a **two-screen web application** for live RC car racing events:

- **Display Screen** — Runs on a TV/projector at the venue. Shows a live leaderboard, race timer, fastest lap, Hall of Fame, and podium screen. Designed to feel like an F1 timing tower.
- **Admin Panel** — Runs on the operator's phone/tablet. Used to create race sessions, register drivers, log laps with a single tap, and control the race flow.

Both screens are connected in **real time via WebSockets** — when the operator taps a lap button on their phone, the TV leaderboard updates instantly.

---

## ✨ Features

### 📺 Display Screen
- Live leaderboard — position, driver, laps, best lap, total time, gap
- F1-style fastest lap highlight (purple glow)
- Gap times — `LEADER` / `+1.234s` format
- Animated position change indicators (▲▼)
- Race countdown — 3-2-1 GO! animation
- Race progress timer with gradient bar
- Low time warning (turns red at 30 seconds)
- Podium screen with medal animations
- Hall of Fame — Top 5 all-time fastest laps
- Venue partner logo slot (premium monetization feature)
- QR code linking to your booking page
- Scrolling ticker tape
- Shareable result card (PNG download)
- Driver of the Day crowd vote
- 4 color themes — Premium Blue, Night Race, F1 Blue, Neon City
- Glassmorphism UI with particle and light streak animations
- Racing video background support

### 🎮 Admin Panel
- JWT-protected login
- Create lap race or time race sessions
- Driver setup — name, avatar, color, car number (up to 8 drivers)
- Big tap buttons per driver — single tap logs a lap instantly
- 1.5s debounce — prevents accidental double tap
- Lap progress bar per driver
- Finished overlay with total time when lap limit is reached
- Undo last lap
- Race control — START / END / SHOW PODIUM
- Hall of Fame management — view, delete, reset
- Share cards for all drivers after race

### ⚙️ Backend
- 15+ REST API endpoints
- Socket.io real-time engine
- JWT authentication
- Accurate lap time calculation from timestamps
- Automatic position recalculation after every lap
- Lap race mode and time race mode
- Hall of Fame — Top 5 fastest laps globally
- CORS configured for production
- PostgreSQL with connection pooling

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│                                                          │
│   ┌─────────────────────┐    ┌─────────────────────┐    │
│   │   Display Screen    │    │    Admin Panel       │    │
│   │   (TV/Projector)    │    │   (Phone/Tablet)     │    │
│   │   /                 │    │   /admin             │    │
│   └──────────┬──────────┘    └──────────┬──────────┘    │
│              │                          │                 │
└──────────────┼──────────────────────────┼─────────────────┘
               │      WebSocket           │
               │   (Socket.io realtime)   │
┌──────────────┼──────────────────────────┼─────────────────┐
│              ▼                          ▼                 │
│                    SERVER LAYER                           │
│            Node.js + Express + Socket.io                  │
│                                                          │
│     /api/auth   /api/races   /api/drivers   /api/laps    │
│                                                          │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                   DATABASE LAYER                         │
│               PostgreSQL (Supabase)                      │
│                                                          │
│       drivers | races | race_entries | laps              │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | TailwindCSS + Inline styles |
| Real-time | Socket.io |
| HTTP | Axios |
| Routing | React Router v6 |
| Auth | JWT |
| QR Code | qrcode.react |
| Share Card | html2canvas |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| DB Host | Supabase (free) |
| Frontend Host | Vercel |
| Backend Host | Render |

---

## 📁 Project Structure

```
racezone/
├── client/                          # React frontend → Vercel
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── DriverSetup.jsx
│   │   │   │   ├── LapEntry.jsx
│   │   │   │   ├── RaceControl.jsx
│   │   │   │   ├── SessionManager.jsx
│   │   │   │   └── HallOfFameAdmin.jsx
│   │   │   ├── display/
│   │   │   │   ├── HallOfFame.jsx
│   │   │   │   ├── ShareCard.jsx
│   │   │   │   ├── DriverOfTheDay.jsx
│   │   │   │   └── RacingBackground.jsx
│   │   │   └── shared/
│   │   │       └── ThemeSwitcher.jsx
│   │   ├── context/
│   │   │   └── RaceContext.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   ├── useAuth.js
│   │   │   └── useKeyboardLap.js
│   │   ├── pages/
│   │   │   ├── DisplayScreen.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   └── Login.jsx
│   │   ├── styles/
│   │   │   └── themes.js
│   │   └── utils/
│   │       ├── formatTime.js
│   │       ├── calcGaps.js
│   │       └── constants.js
│   ├── vercel.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                          # Node.js backend → Render
    ├── src/
    │   ├── config/
    │   │   └── db.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── driverController.js
    │   │   ├── raceController.js
    │   │   └── lapController.js
    │   ├── middleware/
    │   │   ├── authMiddleware.js
    │   │   └── errorHandler.js
    │   ├── routes/
    │   │   ├── auth.js
    │   │   ├── drivers.js
    │   │   ├── races.js
    │   │   └── laps.js
    │   └── socket/
    │       └── raceSocket.js
    └── server.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 15+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/mashood17/racezone.git
cd racezone
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/racezone
JWT_SECRET=your_super_secret_jwt_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=racezone2024
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Create the database:

```bash
psql -U postgres
CREATE DATABASE racezone;
\q
```

Start the server:

```bash
npm run dev
```

Server runs on `http://localhost:4000`
Health check: `http://localhost:4000/health`

### 3. Set up the frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_BOOKING_URL=https://yourwebsite.com/book
```

Start the frontend:

```bash
npm run dev
```

App runs on `http://localhost:5173`

### 4. Open both screens

| URL | Purpose |
|---|---|
| `http://localhost:5173/` | Display screen (open on TV) |
| `http://localhost:5173/admin/login` | Admin panel (open on phone) |

---

## 🗄️ Database Schema

```sql
CREATE TABLE drivers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  avatar      VARCHAR(10)  DEFAULT '🏎️',
  car_number  VARCHAR(5)   DEFAULT '00',
  color       VARCHAR(20)  DEFAULT '#e10600',
  created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE races (
  id               SERIAL PRIMARY KEY,
  venue_name       VARCHAR(200) DEFAULT 'RaceZone Arena',
  venue_logo_url   TEXT,
  duration_seconds INTEGER      DEFAULT 180,
  total_laps       INTEGER      DEFAULT NULL,
  status           VARCHAR(20)  DEFAULT 'waiting',
  started_at       TIMESTAMP,
  ended_at         TIMESTAMP,
  created_at       TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE race_entries (
  id            SERIAL PRIMARY KEY,
  race_id       INTEGER REFERENCES races(id)   ON DELETE CASCADE,
  driver_id     INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
  position      INTEGER DEFAULT 0,
  lap_count     INTEGER DEFAULT 0,
  best_lap_ms   INTEGER,
  total_time_ms INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE laps (
  id             SERIAL PRIMARY KEY,
  race_entry_id  INTEGER REFERENCES race_entries(id) ON DELETE CASCADE,
  lap_number     INTEGER NOT NULL,
  lap_time_ms    INTEGER NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Admin login → returns JWT |

### Drivers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/drivers` | None | List all drivers |
| POST | `/api/drivers` | JWT | Create driver |
| PUT | `/api/drivers/:id` | JWT | Update driver |
| DELETE | `/api/drivers/:id` | JWT | Delete driver |

### Races
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/races` | None | Race history |
| GET | `/api/races/active` | None | Current active race |
| GET | `/api/races/hall-of-fame` | None | Top 5 fastest laps |
| GET | `/api/races/:id` | None | Race + entries detail |
| POST | `/api/races` | JWT | Create race session |
| PATCH | `/api/races/:id/status` | JWT | Update race status |
| POST | `/api/races/:id/drivers` | JWT | Add driver to race |
| DELETE | `/api/races/hall-of-fame` | JWT | Reset Hall of Fame |
| DELETE | `/api/races/hall-of-fame/:id` | JWT | Delete HOF entry |

### Laps
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/laps` | JWT | Log a lap |
| GET | `/api/laps/entry/:id` | None | Get laps for entry |
| DELETE | `/api/laps/entry/:id/last` | JWT | Undo last lap |

---

## ⚡ Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `join_race` | Client → Server | Join a race room |
| `lap_logged` | Admin → Server | Trigger leaderboard refresh |
| `leaderboard_update` | Server → Display | Push updated standings |
| `race_start` | Admin → Server | Trigger 3-2-1 countdown |
| `race_started` | Server → Display | Show countdown on TV |
| `race_end` | Admin → Server | End the race |
| `race_ended` | Server → Display | Show race complete |
| `show_podium` | Admin → Server | Trigger podium screen |
| `podium_show` | Server → Display | Show P1/P2/P3 podium |

---

## 🎮 How to Run a Race

```
1. Open display URL on TV browser (full screen)
2. Open admin URL on your phone
3. Login → admin / racezone2024
4. SESSION tab → enter venue name → choose lap or time race → CREATE
5. DRIVERS tab → add 2-8 drivers with names, avatars, colors → SAVE
6. CONTROL tab → press START RACE
   └── TV shows 3-2-1 GO! countdown
7. LAPS tab → tap driver button each time they cross finish line
   └── TV leaderboard updates instantly
8. CONTROL tab → END RACE → SHOW PODIUM
   └── TV shows P1/P2/P3 celebration screen
9. Share result cards for each driver (PNG download)
```

---

## ☁️ Deployment

### Frontend → Vercel

```bash
# In Vercel dashboard:
# Framework: Vite
# Root Directory: client
# Build Command: npm run build
# Output Directory: dist

# Environment Variables:
VITE_API_URL=https://your-render-url.onrender.com/api
VITE_SOCKET_URL=https://your-render-url.onrender.com
VITE_BOOKING_URL=https://yourwebsite.com
```

### Backend → Render

```bash
# In Render dashboard:
# Runtime: Node
# Root Directory: server
# Build Command: npm install
# Start Command: node server.js

# Environment Variables:
PORT=10000
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourpassword
NODE_ENV=production
CLIENT_URL=https://your-vercel-url.vercel.app
```

### Database → Supabase (free)

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → copy Connection String (URI)
3. Paste as `DATABASE_URL` in Render environment variables
4. Tables are created automatically on first server start

> ⚠️ **Note:** Render free tier sleeps after 15 minutes of inactivity. First request after idle takes ~30 seconds. Open the health URL before events to wake the server: `https://your-render-url.onrender.com/health`

---

## 🎨 Themes

| Theme | Colors | Best For |
|---|---|---|
| Premium Blue | Royal blue + purple | Default — premium feel |
| Night Race | Dark + red accents | Classic F1 look |
| F1 Blue | Deep blue + cyan | Professional venues |
| Neon City | Dark + neon green | Gaming zones |

Switch themes live from the display screen top bar.

---

## 💰 Business Model

| Revenue Stream | Description |
|---|---|
| Venue placement | Weekly/monthly fee from cafes to host your RC track |
| Event booking | Per-event fee from parties and corporate events |
| Venue logo add-on | Sell the venue logo slot on the display screen as premium |

> The venue logo appears on the display screen throughout the entire event — this is genuinely valuable advertising for the cafe and justifies a higher placement fee.

---

## 🔮 Roadmap

- [ ] Custom domain (`racezone.in`)
- [ ] WhatsApp result sharing
- [ ] IR/RFID sensor integration for automatic lap logging
- [ ] Multi-venue management dashboard
- [ ] Analytics — races per venue, revenue tracking
- [ ] Race replay system
- [ ] White-label version for other operators
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Mashood**
- GitHub: [@mashood17](https://github.com/mashood17)
- Project: [RaceZone](https://racezone.vercel.app)

---

<div align="center">


[🏁 Live Display](https://racezone.vercel.app) · [🎮 Admin Panel](https://racezone.vercel.app/admin) · 

</div>