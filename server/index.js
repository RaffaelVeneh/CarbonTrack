const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('./config/db'); // Panggil koneksi database
require('./config/redis'); // Panggil koneksi Redis untuk blacklist
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
const weeklyMissionRoutes = require('./routes/weeklyMissionRoutes'); // <-- TAMBAHAN BARU (Untuk Weekly Missions)
const adminRoutes = require('./routes/adminRoutes'); // <-- TAMBAHAN BARU (Untuk Admin Panel)

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- 3. GUNAKAN ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);

// --- 4. GUNAKAN ROUTES BARU ---
app.use('/api/users', userRoutes); // <-- TAMBAHAN BARU (Akses: /api/users/leaderboard)
app.use('/api/ai', aiRoutes);       // <-- TAMBAHAN BARU (Akses: /api/ai/ask)
app.use('/api/badges', badgeRoutes); // <-- TAMBAHAN BARU (Akses: /api/badges)

// PENTING: Daily missions dan weekly missions route harus SEBELUM missions route (lebih spesifik)
app.use('/api/missions/daily', dailyMissionRoutes); // <-- Harus di atas /api/missions
app.use('/api/missions/weekly', weeklyMissionRoutes); // <-- Harus di atas /api/missions
app.use('/api/missions', missionRoutes); // <-- Wildcard route terakhir

// Admin routes (protected with JWT)
app.use('/api/admin', adminRoutes); // <-- Admin panel endpoints

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
    const http = require('http');
    const { Server } = require('socket.io');
    
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        }
    });

    // Socket.io connection handler
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // User joins their own room (identified by userId)
        socket.on('join', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`👤 User ${userId} joined their room`);
        });

        // Admin joins admin room to receive user status updates
        socket.on('join_admin', (roomName) => {
            socket.join(roomName);
            console.log(`🔐 Admin joined ${roomName} for real-time updates`);
        });

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    // Make io accessible to controllers
    app.set('io', io);
    
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔌 WebSocket server ready`);
        
        // Start cron job scheduler
        scheduleDailyHealthDecay();
    });
}

module.exports = app;