const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./config/db'); // Panggil koneksi database
const { scheduleDailyHealthDecay } = require('./config/scheduler'); // Cron job

// --- 1. IMPORT ROUTES (YANG LAMA) ---
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const missionRoutes = require('./routes/missionRoutes');

// --- 2. IMPORT ROUTES (YANG BARU DITAMBAHKAN) ---
const userRoutes = require('./routes/userRoutes'); // <-- TAMBAHAN BARU (Untuk Leaderboard & Profil)
const aiRoutes = require('./routes/aiRoutes');     // <-- TAMBAHAN BARU (Untuk AI Assistant)
const badgeRoutes = require('./routes/badgeRoutes'); // <-- TAMBAHAN BARU (Untuk Badge System)
const dailyMissionRoutes = require('./routes/dailyMissionRoutes'); // <-- TAMBAHAN BARU (Untuk Daily Missions)

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- 3. GUNAKAN ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/missions', missionRoutes);

// --- 4. GUNAKAN ROUTES BARU ---
app.use('/api/users', userRoutes); // <-- TAMBAHAN BARU (Akses: /api/users/leaderboard)
app.use('/api/ai', aiRoutes);       // <-- TAMBAHAN BARU (Akses: /api/ai/ask)
app.use('/api/badges', badgeRoutes); // <-- TAMBAHAN BARU (Akses: /api/badges)
app.use('/api/missions/daily', dailyMissionRoutes); // <-- TAMBAHAN BARU (Akses: /api/missions/daily/:userId)

// Test Route
app.get('/', (req, res) => {
    res.send('🚀 CarbonTrack Backend is Running!');
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

const PORT = process.env.PORT || 5000;

// Jika dijalankan di local (bukan Vercel), tetap jalan pakai port
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        
        // Start cron job scheduler
        scheduleDailyHealthDecay();
    });
}

module.exports = app;