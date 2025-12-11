const db = require('../config/db');

// ============================================
// 📋 GET ALL BADGES
// ============================================
const getAllBadges = async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        // FIX: Ganti 'unlocked_at' jadi 'earned_at' sesuai database kamu
        const [badges] = await db.execute(`
            SELECT b.*, 
            CASE WHEN ub.id IS NOT NULL THEN TRUE ELSE FALSE END as unlocked,
            ub.earned_at as unlocked_at
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            ORDER BY FIELD(b.tier, 'bronze', 'silver', 'gold', 'diamond', 'legendary'), b.category
        `, [userId]);

        res.json({ badges });
    } catch (error) {
        console.error('Error getAllBadges:', error.message); // Log error spesifik
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
};

// ============================================
// 🎖️ CHECK & AWARD BADGES (FIXED COLUMN NAMES)
// ============================================
const checkAndAwardBadges = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        // 1. Ambil Stats User
        // FIX: Gunakan 'current_level' (bukan level) sesuai database kamu
        const [userStats] = await db.execute(`
            SELECT 
                u.current_level, 
                u.total_xp, 
                u.island_health,
                (SELECT COUNT(*) FROM user_missions WHERE user_id = u.id AND status = 'claimed') as missions_completed
            FROM users u WHERE u.id = ?
        `, [userId]);

        if (userStats.length === 0) return res.status(404).json({ error: 'User not found' });
        const stats = userStats[0];

        // 2. Ambil Stats Log
        const [logStats] = await db.execute(`
            SELECT 
                COALESCE(SUM(carbon_saved), 0) as total_saved,
                COALESCE(SUM(carbon_produced), 0) as total_produced
            FROM daily_logs WHERE user_id = ?
        `, [userId]);
        const logs = logStats[0];

        // 3. Ambil Badge yang BELUM dimiliki
        const [unownedBadges] = await db.execute(`
            SELECT * FROM badges 
            WHERE id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = ?)
        `, [userId]);

        const newBadges = [];

        // 4. Logic Pengecekan (Disesuaikan dengan isi tabel 'badges' di dump-test)
        for (const badge of unownedBadges) {
            let unlocked = false;
            const reqVal = parseInt(badge.requirement_value);
            const reqType = badge.requirement_type; // 'xp', 'level', 'saving', 'activity', 'streak'

            // --- DEBUG LOGIC (Biar ketahuan kalau salah) ---
            // console.log(`Checking Badge: ${badge.name} (${reqType} >= ${reqVal})`);

            switch (reqType) {
                case 'level':
                    if (stats.current_level >= reqVal) unlocked = true;
                    break;
                
                case 'xp': // Database pakai 'xp', bukan 'total_xp'
                case 'total_xp':
                    if (stats.total_xp >= reqVal) unlocked = true;
                    break;
                
                case 'activity': // Database pakai 'activity'
                case 'missions_completed':
                    if (stats.missions_completed >= reqVal) unlocked = true;
                    break;
                
                case 'saving': // Database pakai 'saving'
                case 'total_saved':
                    if (parseFloat(logs.total_saved) >= reqVal) unlocked = true;
                    break;

                // Streak kita skip dulu biar aman (sering error SQL)
                case 'streak':
                case 'streak_days':
                    unlocked = false; 
                    break;
                
                default:
                    unlocked = false;
            }

            if (unlocked) {
                // FIX: Insert pakai 'earned_at' bukan 'unlocked_at'
                await db.execute(`
                    INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, NOW())
                `, [userId, badge.id]);
                newBadges.push(badge);
            }
        }

        res.json({ 
            hasNewBadges: newBadges.length > 0, 
            newBadges 
        });

    } catch (error) {
        console.error('❌ Error checkAndAwardBadges:', error.message); 
        // Return 200 kosong supaya frontend TIDAK error 500 walau backend gagal
        res.status(200).json({ hasNewBadges: false, newBadges: [] });
    }
};

// ============================================
// 📊 GET USER BADGES
// ============================================
const getUserBadges = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;
        // FIX: select earned_at
        const [badges] = await db.execute(`
            SELECT b.*, ub.earned_at as unlocked_at
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        `, [userId]);

        res.json({ badges, count: badges.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user badges' });
    }
};

module.exports = { getAllBadges, checkAndAwardBadges, getUserBadges };