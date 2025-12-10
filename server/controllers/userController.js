const db = require('../config/db');

// Ambil Leaderboard (Top 10 XP Tertinggi)
exports.getLeaderboard = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT id, username, current_level, total_xp, island_health 
            FROM users 
            ORDER BY total_xp DESC 
            LIMIT 10
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Data User (Username & Email)
exports.updateProfile = async (req, res) => {
    try {
        const { userId, username, email } = req.body;
        
        await db.execute(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, userId]
        );

        res.json({ message: 'Profil berhasil diperbarui!', user: { id: userId, username, email } });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update profil' });
    }
};

// Ambil Profil Lengkap (User + Stats + Badges)
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Data User
        const [userRows] = await db.execute('SELECT id, username, email, current_level, total_xp, island_health, created_at FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

        // 2. Statistik Total Emisi
        // PERBAIKAN 1: 'carbon_produced' -> 'carbon_emitted'
        const [logRows] = await db.execute('SELECT SUM(carbon_emitted) as total_emission, COUNT(*) as total_logs FROM daily_logs WHERE user_id = ?', [userId]);

        // 3. Daftar Badge
        // PERBAIKAN 2: 'b.icon' -> 'b.icon_url'
        const [badgeRows] = await db.execute(`
            SELECT b.name, b.icon_url as icon, b.description 
            FROM user_badges ub 
            JOIN badges b ON ub.badge_id = b.id 
            WHERE ub.user_id = ?
        `, [userId]);

        res.json({
            user: userRows[0],
            stats: {
                totalEmission: logRows[0].total_emission || 0,
                totalLogs: logRows[0].total_logs || 0
            },
            badges: badgeRows
        });

    } catch (error) {
        console.error("Error Profile:", error); // Tambahkan log biar gampang debug
        res.status(500).json({ message: 'Server Error' });
    }
};