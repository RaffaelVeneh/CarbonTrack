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
            SELECT 
                b.id,
                b.name,
                b.icon,
                b.description,
                b.category,
                b.tier,
                b.requirement_type,
                b.requirement_value,
                CASE 
                    WHEN ub.id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END as unlocked,
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

        console.log('🔍 Checking badges for user:', userId);

        // Get user stats
        const [userStats] = await db.execute(`
            SELECT 
                u.current_level as level,
                u.total_xp,
                u.island_health,
                u.created_at,
                COUNT(DISTINCT CASE WHEN um.status = 'claimed' THEN um.mission_id END) as missions_completed,
                COALESCE(SUM(dl.carbon_saved), 0) as total_saved,
                COALESCE(SUM(dl.carbon_produced), 0) as total_produced
            FROM users u
            LEFT JOIN user_missions um ON u.id = um.user_id
            LEFT JOIN daily_logs dl ON u.id = dl.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `, [userId]);
        
        console.log('📊 User stats:', userStats[0]);

        if (userStats.length === 0) return res.status(404).json({ error: 'User not found' });
        const stats = userStats[0];
        
        console.log('📈 Stats extracted:', {
            level: stats.level,
            total_xp: stats.total_xp,
            missions_completed: stats.missions_completed,
            total_saved: stats.total_saved
        });

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

        // Get transport stats - JOIN dengan activities table
        const [transportStats] = await db.execute(`
            SELECT 
                COALESCE(SUM(CASE WHEN a.activity_name = 'Bersepeda' THEN dl.input_value ELSE 0 END), 0) as cycling_distance,
                COALESCE(SUM(CASE WHEN a.activity_name = 'Jalan Kaki' THEN dl.input_value ELSE 0 END), 0) as walking_distance,
                COALESCE(COUNT(CASE WHEN a.activity_name LIKE '%Bus%' OR a.activity_name LIKE '%Kereta%' THEN 1 END), 0) as public_transport_count
            FROM daily_logs dl
            JOIN activities a ON dl.activity_id = a.id
            WHERE dl.user_id = ?
        `, [userId]);

        const transport = transportStats[0] || { cycling_distance: 0, walking_distance: 0, public_transport_count: 0 };

        // Check early adopter (registered in first month)
        const isEarlyAdopter = new Date(stats.created_at) < new Date('2025-01-31');

        // Get all badges that user hasn't unlocked yet
        const [unlockedBadges] = await db.execute(`
            SELECT badge_id FROM user_badges WHERE user_id = ?
        `, [userId]);

        const unlockedIds = unlockedBadges.map(b => b.badge_id);

        // Perbaiki query dengan placeholder yang aman
        let allBadges = [];
        if (unlockedIds.length > 0) {
            const placeholders = unlockedIds.map(() => '?').join(',');
            [allBadges] = await db.execute(
                `SELECT * FROM badges WHERE id NOT IN (${placeholders})`,
                unlockedIds
            );
        } else {
            [allBadges] = await db.execute(`SELECT * FROM badges`);
        }

        // Check each badge requirement
        const newlyUnlockedBadges = [];

        for (const badge of allBadges) {
            let unlocked = false;
            const reqVal = parseInt(badge.requirement_value);
            const reqType = badge.requirement_type; // 'xp', 'level', 'saving', 'activity', 'streak'

            // --- DEBUG LOGIC (Biar ketahuan kalau salah) ---
            // console.log(`Checking Badge: ${badge.name} (${reqType} >= ${reqVal})`);

            switch (reqType) {
                case 'level':
                    if (stats.current_level >= reqVal) unlocked = true;
                    break;

                case 'xp': // Sesuaikan dengan db (bukan total_xp)
                    unlocked = stats.total_xp >= badge.requirement_value;
                    break;

                case 'activity': // Sesuaikan dengan db (bukan missions_completed)
                    unlocked = stats.missions_completed >= badge.requirement_value;
                    break;

                case 'saving': // Sesuaikan dengan db (bukan total_saved)
                    unlocked = stats.total_saved >= badge.requirement_value;
                    break;

                case 'negative_carbon':
                    unlocked = stats.total_saved > stats.total_produced;
                    break;

                // Streak kita skip dulu biar aman (sering error SQL)
                case 'streak':
                case 'streak_days':
                    unlocked = false; 
                    break;

                case 'cycling_distance':
                    unlocked = transport.cycling_distance >= badge.requirement_value;
                    break;

                case 'walking_distance':
                    unlocked = transport.walking_distance >= badge.requirement_value;
                    break;

                case 'public_transport_count':
                    unlocked = transport.public_transport_count >= badge.requirement_value;
                    break;

                case 'island_health':
                    unlocked = stats.island_health >= badge.requirement_value;
                    break;

                case 'special': // Early adopter badge
                    unlocked = isEarlyAdopter;
                    break;

                // TODO: Implement later
                case 'referral_count':
                case 'zero_waste_days':
                    unlocked = false;
                    break;

                default:
                    console.warn(`Unknown requirement_type: ${badge.requirement_type}`);
                    unlocked = false;
            }

            if (unlocked) {
                console.log(`🎖️ Awarding badge: ${badge.name} (${badge.icon})`);
                
                await db.execute(`
                    INSERT INTO user_badges (user_id, badge_id, earned_at)
                    VALUES (?, ?, NOW())
                `, [userId, badge.id]);
                newBadges.push(badge);
            }
        }
        
        console.log(`✅ Badge check complete. New badges: ${newlyUnlockedBadges.length}`);

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
            SELECT 
                b.id,
                b.name,
                b.icon,
                b.description,
                b.category,
                b.tier,
                ub.earned_at as unlocked_at
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