const db = require('../config/db');

// ============================================
// 📋 GET ALL BADGES (with user progress)
// ============================================
const getAllBadges = async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Get all badges dengan status unlocked/locked per user
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
                ub.unlocked_at
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            ORDER BY 
                FIELD(b.tier, 'bronze', 'silver', 'gold', 'diamond', 'legendary'),
                b.category,
                b.id
        `, [userId]);

        res.json({ badges });
    } catch (error) {
        console.error('❌ Error getAllBadges:', error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
};

// ============================================
// 🎖️ CHECK & AWARD BADGES (dipanggil setiap ada aktivitas)
// ============================================
const checkAndAwardBadges = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Get user stats
        const [userStats] = await db.execute(`
            SELECT 
                u.level,
                u.total_xp,
                u.island_health,
                u.created_at,
                COUNT(DISTINCT um.mission_id) as missions_completed,
                COALESCE(SUM(dl.carbon_saved), 0) as total_saved,
                COALESCE(SUM(dl.carbon_produced), 0) as total_produced
            FROM users u
            LEFT JOIN user_missions um ON u.id = um.user_id AND um.is_completed = 1
            LEFT JOIN daily_logs dl ON u.id = dl.user_id
            WHERE u.id = ?
            GROUP BY u.id
        `, [userId]);

        if (userStats.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const stats = userStats[0];

        // Get streak info
        const [streakData] = await db.execute(`
            SELECT 
                MAX(consecutive_days) as max_streak
            FROM (
                SELECT 
                    COUNT(*) as consecutive_days
                FROM (
                    SELECT 
                        log_date,
                        DATE_SUB(log_date, INTERVAL ROW_NUMBER() OVER (ORDER BY log_date) DAY) as grp
                    FROM daily_logs
                    WHERE user_id = ?
                    GROUP BY log_date
                ) grouped
                GROUP BY grp
            ) streaks
        `, [userId]);

        const currentStreak = streakData[0]?.max_streak || 0;

        // Get transport stats
        const [transportStats] = await db.execute(`
            SELECT 
                SUM(CASE WHEN activity_type = 'Bersepeda' THEN distance ELSE 0 END) as cycling_distance,
                SUM(CASE WHEN activity_type = 'Jalan Kaki' THEN distance ELSE 0 END) as walking_distance,
                COUNT(CASE WHEN activity_type LIKE '%Transportasi Umum%' THEN 1 END) as public_transport_count
            FROM daily_logs
            WHERE user_id = ?
        `, [userId]);

        const transport = transportStats[0] || { cycling_distance: 0, walking_distance: 0, public_transport_count: 0 };

        // Check early adopter (registered in first month)
        const isEarlyAdopter = new Date(stats.created_at) < new Date('2025-01-31');

        // Get all badges that user hasn't unlocked yet
        const [unlockedBadges] = await db.execute(`
            SELECT badge_id FROM user_badges WHERE user_id = ?
        `, [userId]);

        const unlockedIds = unlockedBadges.map(b => b.badge_id);

        const [allBadges] = await db.execute(`
            SELECT * FROM badges WHERE id NOT IN (${unlockedIds.length > 0 ? unlockedIds.join(',') : '0'})
        `);

        // Check each badge requirement
        const newlyUnlockedBadges = [];

        for (const badge of allBadges) {
            let unlocked = false;

            switch (badge.requirement_type) {
                case 'level':
                    unlocked = stats.level >= badge.requirement_value;
                    break;

                case 'total_xp':
                    unlocked = stats.total_xp >= badge.requirement_value;
                    break;

                case 'missions_completed':
                    unlocked = stats.missions_completed >= badge.requirement_value;
                    break;

                case 'total_saved':
                    unlocked = stats.total_saved >= badge.requirement_value;
                    break;

                case 'negative_carbon':
                    unlocked = stats.total_saved > stats.total_produced;
                    break;

                case 'streak_days':
                    unlocked = currentStreak >= badge.requirement_value;
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

                case 'early_user':
                    unlocked = isEarlyAdopter;
                    break;

                // TODO: Implement later
                case 'referral_count':
                case 'zero_waste_days':
                    unlocked = false;
                    break;

                default:
                    unlocked = false;
            }

            // Award badge if unlocked
            if (unlocked) {
                await db.execute(`
                    INSERT INTO user_badges (user_id, badge_id, unlocked_at)
                    VALUES (?, ?, NOW())
                `, [userId, badge.id]);

                newlyUnlockedBadges.push({
                    id: badge.id,
                    name: badge.name,
                    icon: badge.icon,
                    description: badge.description,
                    category: badge.category,
                    tier: badge.tier
                });
            }
        }

        res.json({ 
            newBadges: newlyUnlockedBadges,
            hasNewBadges: newlyUnlockedBadges.length > 0
        });

    } catch (error) {
        console.error('❌ Error checkAndAwardBadges:', error);
        res.status(500).json({ error: 'Failed to check badges' });
    }
};

// ============================================
// 📊 GET USER BADGES (untuk profile/badge page)
// ============================================
const getUserBadges = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;

        const [badges] = await db.execute(`
            SELECT 
                b.id,
                b.name,
                b.icon,
                b.description,
                b.category,
                b.tier,
                ub.unlocked_at
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ?
            ORDER BY ub.unlocked_at DESC
        `, [userId]);

        res.json({ badges, count: badges.length });
    } catch (error) {
        console.error('❌ Error getUserBadges:', error);
        res.status(500).json({ error: 'Failed to fetch user badges' });
    }
};

module.exports = {
    getAllBadges,
    checkAndAwardBadges,
    getUserBadges
};
