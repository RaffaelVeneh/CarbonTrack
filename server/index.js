const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
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

// ==============================================
// 🛡️ RATE LIMITING CONFIGURATION
// ==============================================

/**
 * GENERAL API RATE LIMITER
 * Proteksi umum untuk semua endpoint
 * Limit: 100 requests per 15 menit
 * Use case: Mencegah spam & DDoS attack
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // 100 requests
    message: {
        success: false,
        message: 'Terlalu banyak request dari IP ini, coba lagi dalam 15 menit'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Skip successful requests (optional)
    // skipSuccessfulRequests: true
});

/**
 * STRICT AUTH LIMITER
 * Proteksi ketat untuk login/register
 * Limit: 5 attempts per 15 menit
 * Use case: Prevent brute force password attack
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // Hanya 5 percobaan
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true, // Reset counter kalau login berhasil
    standardHeaders: true
});

/**
 * AI ENDPOINT LIMITER
 * Proteksi untuk AI chat (Groq API abuse)
 * Limit: 20 requests per 10 menit
 * Use case: Prevent Groq API credit drain
 */
const aiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 menit
    max: 20, // 20 requests (2 requests/menit)
    message: {
        success: false,
        message: 'Terlalu banyak pertanyaan ke AI. Tunggu 10 menit ya! 🤖'
    },
    standardHeaders: true
});

/**
 * MISSION CLAIM LIMITER
 * Proteksi untuk claim mission rewards
 * Limit: 30 claims per 15 menit
 * Use case: Prevent mission reward spam/exploit
 */
const missionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 30, // 30 claims
    message: {
        success: false,
        message: 'Terlalu banyak claim mission. Istirahat dulu 15 menit! 🎯'
    },
    standardHeaders: true
});

/**
 * ADMIN ACTION LIMITER
 * Proteksi untuk admin actions (ban/unban)
 * Limit: 50 actions per hour
 * Use case: Prevent admin panel abuse
 */
const adminLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 50, // 50 actions
    message: {
        success: false,
        message: 'Terlalu banyak aksi admin. Tunggu 1 jam'
    },
    standardHeaders: true
});

// ==============================================
// 🪖 SECURITY HEADERS (HELMET.JS)
// ==============================================

/**
 * Helmet adds secure HTTP headers to protect against:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking (iframe embedding)
 * - MIME type sniffing
 * - DNS prefetch control
 * - IE No Open (download security)
 * 
 * Headers added:
 * - Content-Security-Policy (CSP)
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-DNS-Prefetch-Control: off
 * - Strict-Transport-Security (HSTS)
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for iframe if needed
}));

console.log('🪖 Helmet security headers enabled');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 🔒 Limit request body size to 10MB (prevent JSON bomb attack)

// ==============================================
// 🚦 APPLY RATE LIMITERS TO ROUTES
// ==============================================

// 🔐 AUTH ROUTES - Strict limiting (prevent brute force)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// 🤖 AI ROUTES - Moderate limiting (prevent API abuse)
app.use('/api/ai', aiLimiter);

// 🎯 MISSION ROUTES - Moderate limiting (prevent spam claims)
app.use('/api/missions/claim', missionLimiter);
app.use('/api/missions/daily/claim', missionLimiter);
app.use('/api/missions/weekly/claim', missionLimiter);

// 👨‍💼 ADMIN ROUTES - Moderate limiting (prevent admin abuse)
app.use('/api/admin', adminLimiter);

// 🌐 GENERAL RATE LIMIT - Apply to all other API routes
app.use('/api/', generalLimiter);

console.log('🛡️ Rate limiting enabled on all endpoints');

// ==============================================
// 📡 ROUTE REGISTRATION
// ==============================================

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

// ==============================================
// 🙈 ERROR HANDLING (MUST BE LAST!)
// ==============================================

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Handle 404 - Not Found (for undefined routes)
app.use(notFoundHandler);

// Global error handler (catches all errors)
app.use(errorHandler);

console.log('🙈 Error handling middleware enabled');

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