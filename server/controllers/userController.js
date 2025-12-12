const db = require('../config/db');

// Ambil Leaderboard dengan Pagination
exports.getLeaderboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM users');
        const totalUsers = countResult[0].total;

        // Get paginated data
        const query = `
            SELECT 
                u.id, 
                u.username, 
                u.current_level, 
                u.total_xp, 
                u.island_health,
                COALESCE(SUM(dl.carbon_saved), 0) as total_co2_saved
            FROM users u
            LEFT JOIN daily_logs dl ON u.id = dl.user_id
            GROUP BY u.id, u.username, u.current_level, u.total_xp, u.island_health
            ORDER BY u.total_xp DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;
        const [rows] = await db.execute(query);

        res.json({
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers: totalUsers,
                hasMore: offset + rows.length < totalUsers
            }
        });
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Data User (Username & Email)
exports.updateProfile = async (req, res) => {
    try {
        const { userId, username, email } = req.body;
        
        // Cek apakah username/email baru sudah dipakai orang lain (opsional tapi bagus)
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
// Ambil Profil Lengkap (User + Stats + Badges)
// Ambil Profil Lengkap (User + Stats + Badges)
exports.getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Data User (UPDATE PENTING DI SINI 👇)
        // Kita tambahkan 'current_streak' dan 'last_log_date' ke dalam SELECT
        const [userRows] = await db.execute(
            'SELECT id, username, email, current_level, total_xp, island_health, created_at, current_streak, last_log_date FROM users WHERE id = ?', 
            [userId]
        );

        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

        // 2. Statistik Total Emisi
        const [logRows] = await db.execute('SELECT SUM(carbon_produced) as total_emission, COUNT(*) as total_logs FROM daily_logs WHERE user_id = ?', [userId]);

        // 3. Semua Badge dengan status unlocked/locked
        const [badgeRows] = await db.execute(`
            SELECT 
                b.id,
                b.name, 
                b.icon, 
                b.description,
                b.tier,
                b.category,
                b.requirement_type,
                b.requirement_value,
                CASE 
                    WHEN ub.id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END as unlocked,
                ub.earned_at
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            ORDER BY 
                FIELD(b.tier, 'bronze', 'silver', 'gold', 'diamond', 'legendary'),
                b.id
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
        console.error("Error getUserProfile:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};