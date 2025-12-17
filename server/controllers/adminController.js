const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ 
                message: 'Username dan password harus diisi' 
            });
        }

        // Check if admin exists
        const [admins] = await db.execute(
            'SELECT * FROM admins WHERE username = ? OR email = ?',
            [username, username]
        );

        if (admins.length === 0) {
            return res.status(401).json({ 
                message: 'Username atau password salah' 
            });
        }

        const admin = admins[0];

        // Check if admin is active
        if (!admin.is_active) {
            return res.status(403).json({ 
                message: 'Akun admin telah dinonaktifkan' 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Username atau password salah' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin.id, 
                username: admin.username,
                email: admin.email,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        // Update last login
        await db.execute(
            'UPDATE admins SET last_login = NOW() WHERE id = ?',
            [admin.id]
        );

        console.log(`✅ Admin login successful: ${admin.username}`);

        res.json({
            message: 'Login berhasil',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                full_name: admin.full_name
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            message: 'Terjadi kesalahan saat login',
            error: error.message 
        });
    }
};

// Get Admin Profile
exports.getProfile = async (req, res) => {
    try {
        const adminId = req.admin.id;

        const [admins] = await db.execute(
            'SELECT id, username, email, full_name, last_login, created_at FROM admins WHERE id = ?',
            [adminId]
        );

        if (admins.length === 0) {
            return res.status(404).json({ 
                message: 'Admin tidak ditemukan' 
            });
        }

        res.json({ admin: admins[0] });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ 
            message: 'Gagal mengambil profil admin',
            error: error.message 
        });
    }
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Total users
        const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        
        // Total activities logged today
        const [todayActivities] = await db.execute(
            'SELECT COUNT(*) as total FROM daily_logs WHERE DATE(log_date) = CURDATE()'
        );
        
        // Total CO2 saved (all time)
        const [totalCO2] = await db.execute(
            'SELECT SUM(carbon_saved) as total FROM daily_logs'
        );
        
        // Active users (logged in last 7 days)
        const [activeUsers] = await db.execute(
            'SELECT COUNT(DISTINCT user_id) as total FROM daily_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        );

        // New users today
        const [newUsersToday] = await db.execute(
            'SELECT COUNT(*) as total FROM users WHERE DATE(created_at) = CURDATE()'
        );

        // Total missions completed
        const [completedMissions] = await db.execute(
            'SELECT COUNT(*) as total FROM user_missions WHERE status = "claimed"'
        );

        // Daily missions completed today
        const [dailyMissionsToday] = await db.execute(
            'SELECT COUNT(*) as total FROM daily_missions WHERE DATE(claimed_at) = CURDATE()'
        );

        // Weekly missions completed this week
        const [weeklyMissionsThisWeek] = await db.execute(
            'SELECT COUNT(*) as total FROM weekly_missions WHERE YEARWEEK(claimed_at, 1) = YEARWEEK(CURDATE(), 1)'
        );

        res.json({
            stats: {
                totalUsers: userCount[0].total,
                activeUsers: activeUsers[0].total,
                newUsersToday: newUsersToday[0].total,
                todayActivities: todayActivities[0].total,
                totalCO2Saved: parseFloat(totalCO2[0].total || 0).toFixed(2),
                completedMissions: completedMissions[0].total,
                dailyMissionsToday: dailyMissionsToday[0].total,
                weeklyMissionsThisWeek: weeklyMissionsThisWeek[0].total
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ 
            message: 'Gagal mengambil statistik dashboard',
            error: error.message 
        });
    }
};

// Get All Users (with pagination)
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search condition
        let searchCondition = '';
        let searchParams = [];
        
        if (search) {
            searchCondition = 'WHERE username LIKE ? OR email LIKE ?';
            searchParams = [`%${search}%`, `%${search}%`];
        }

        // Get total count
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total FROM users ${searchCondition}`,
            searchParams
        );
        const totalUsers = countResult[0].total;

        // Get paginated users
        const [users] = await db.execute(
            `SELECT id, username, email, current_level, total_xp, island_health, 
                    created_at, last_login, is_verified, show_in_leaderboard
             FROM users 
             ${searchCondition}
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...searchParams, limit, offset]
        );

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                limit
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ 
            message: 'Gagal mengambil data users',
            error: error.message 
        });
    }
};

// Get User Details
exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user info
        const [users] = await db.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                message: 'User tidak ditemukan' 
            });
        }

        const user = users[0];

        // Get user's total CO2 saved
        const [co2Data] = await db.execute(
            'SELECT SUM(carbon_saved) as total_co2_saved FROM daily_logs WHERE user_id = ?',
            [userId]
        );

        // Get user's badges
        const [badges] = await db.execute(
            `SELECT b.*, ub.earned_at 
             FROM user_badges ub
             JOIN badges b ON ub.badge_id = b.id
             WHERE ub.user_id = ?
             ORDER BY ub.earned_at DESC`,
            [userId]
        );

        // Get recent activities
        const [recentActivities] = await db.execute(
            `SELECT dl.*, a.activity_name, a.category 
             FROM daily_logs dl
             JOIN activities a ON dl.activity_id = a.id
             WHERE dl.user_id = ?
             ORDER BY dl.log_date DESC, dl.created_at DESC
             LIMIT 10`,
            [userId]
        );

        res.json({
            user: {
                ...user,
                total_co2_saved: parseFloat(co2Data[0].total_co2_saved || 0).toFixed(2)
            },
            badges,
            recentActivities
        });
    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ 
            message: 'Gagal mengambil detail user',
            error: error.message 
        });
    }
};

// Change Admin Password
exports.changePassword = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: 'Password lama dan password baru harus diisi' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'Password baru minimal 6 karakter' 
            });
        }

        // Get admin data
        const [admins] = await db.execute(
            'SELECT * FROM admins WHERE id = ?',
            [adminId]
        );

        if (admins.length === 0) {
            return res.status(404).json({ 
                message: 'Admin tidak ditemukan' 
            });
        }

        const admin = admins[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Password lama salah' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.execute(
            'UPDATE admins SET password = ? WHERE id = ?',
            [hashedPassword, adminId]
        );

        res.json({ 
            message: 'Password berhasil diubah' 
        });
    } catch (error) {
        console.error('Change admin password error:', error);
        res.status(500).json({ 
            message: 'Gagal mengubah password',
            error: error.message 
        });
    }
};

module.exports = exports;
