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

// Update Data User (Username only, email cannot be changed)
exports.updateProfile = async (req, res) => {
    try {
        const { userId, username } = req.body;
        
        // 1. Get current user data
        const [userRows] = await db.execute(
            'SELECT username, last_username_change, email FROM users WHERE id = ?',
            [userId]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        const currentUser = userRows[0];
        
        // 2. Check if username is actually changing
        if (currentUser.username === username) {
            return res.status(400).json({ message: 'Username sama dengan sebelumnya' });
        }
        
        // 3. Check username cooldown (7 days)
        if (currentUser.last_username_change) {
            const lastChange = new Date(currentUser.last_username_change);
            const now = new Date();
            const daysSinceLastChange = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastChange < 7) {
                const daysRemaining = 7 - daysSinceLastChange;
                return res.status(429).json({ 
                    message: `Username baru bisa diganti ${daysRemaining} hari lagi`,
                    canChangeIn: daysRemaining,
                    lastChanged: lastChange
                });
            }
        }
        
        // 4. Check if new username is already taken
        const [existingUser] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, userId]
        );
        
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username sudah digunakan orang lain' });
        }
        
        // 5. Update username and last_username_change
        await db.execute(
            'UPDATE users SET username = ?, last_username_change = NOW() WHERE id = ?',
            [username, userId]
        );

        res.json({ 
            message: 'Username berhasil diperbarui!', 
            user: { id: userId, username, email: currentUser.email },
            nextChangeAvailable: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Gagal update profil' });
    }
};

// Update privacy settings
exports.updatePrivacy = async (req, res) => {
    try {
        const { userId, showInLeaderboard } = req.body;
        
        await db.execute(
            'UPDATE users SET show_in_leaderboard = ? WHERE id = ?',
            [showInLeaderboard, userId]
        );

        res.json({ message: 'Pengaturan privasi berhasil diperbarui!' });
    } catch (error) {
        console.error('Update privacy error:', error);
        res.status(500).json({ message: 'Gagal update pengaturan privasi' });
    }
};

// Get account info for settings page
exports.getAccountInfo = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [userRows] = await db.execute(`
            SELECT 
                id, 
                username, 
                email, 
                email_verified,
                google_id,
                created_at,
                last_username_change,
                current_level,
                total_xp,
                current_streak,
                show_in_leaderboard,
                (SELECT MAX(current_streak) FROM users WHERE id = ?) as longest_streak
            FROM users 
            WHERE id = ?
        `, [userId, userId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        const user = userRows[0];
        
        // Calculate days until username can be changed
        let canChangeUsername = true;
        let daysUntilChange = 0;
        
        if (user.last_username_change) {
            const lastChange = new Date(user.last_username_change);
            const now = new Date();
            const daysSince = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
            
            if (daysSince < 7) {
                canChangeUsername = false;
                daysUntilChange = 7 - daysSince;
            }
        }
        
        res.json({
            ...user,
            canChangeUsername,
            daysUntilChange,
            isGoogleAccount: !!user.google_id
        });
    } catch (error) {
        console.error('Get account info error:', error);
        res.status(500).json({ message: 'Server Error' });
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

        // 2. Statistik Total Emisi & CO2 Saved
        const [logRows] = await db.execute(`
            SELECT 
                SUM(carbon_produced) as total_emission, 
                SUM(carbon_saved) as total_saved,
                COUNT(*) as total_logs 
            FROM daily_logs 
            WHERE user_id = ?
        `, [userId]);

        // 2.5 Get User Rank & Total Users
        const [rankRows] = await db.execute(`
            SELECT COUNT(*) + 1 as user_rank
            FROM users
            WHERE total_xp > (SELECT total_xp FROM users WHERE id = ?)
        `, [userId]);

        const [totalUsersRows] = await db.execute('SELECT COUNT(*) as total FROM users');

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
                totalSaved: logRows[0].total_saved || 0,
                totalLogs: logRows[0].total_logs || 0,
                rank: rankRows[0].user_rank || 0,
                totalUsers: totalUsersRows[0].total || 0
            },
            badges: badgeRows
        });

    } catch (error) {
        console.error("Error getUserProfile:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        
        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Password lama dan baru harus diisi' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
        }
        
        // Get user data
        const [userRows] = await db.execute(
            'SELECT id, password_hash, google_id FROM users WHERE id = ?',
            [userId]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        const user = userRows[0];
        
        // Check if this is a Google account
        if (user.google_id) {
            return res.status(403).json({ 
                message: 'Akun Google tidak bisa mengganti password. Gunakan Google untuk login.'
            });
        }
        
        // Verify current password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Password lama salah' });
        }
        
        // Check if new password is same as old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
        if (isSamePassword) {
            return res.status(400).json({ message: 'Password baru tidak boleh sama dengan password lama' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        await db.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, userId]
        );
        
        res.json({ message: 'Password berhasil diubah!' });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Gagal mengubah password' });
    }
};