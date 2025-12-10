const db = require('../config/db');

// 1. Ambil Misi + Info Progress Level
exports.getMissions = async (req, res) => {
    try {
        const { userId } = req.params;

        const [userRows] = await db.execute('SELECT total_xp, current_level FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const user = userRows[0];
        const currentXP = user.total_xp;
        const currentLevel = user.current_level;
        
        const xpPerLevel = 100; 
        const nextLevelXP = currentLevel * xpPerLevel; 
        const xpProgress = currentXP - ((currentLevel - 1) * xpPerLevel); 

        // FIX: Ubah 'DATE(log_date)' menjadi 'DATE(date)'
        const query = `
            SELECT 
                m.*,
                CASE WHEN m.min_level > ? THEN 1 ELSE 0 END as is_locked,
                CASE WHEN um.id IS NOT NULL THEN 1 ELSE 0 END as is_claimed,
                (SELECT SUM(input_value) FROM daily_logs 
                 WHERE user_id = ? 
                 AND activity_id = m.required_activity_id 
                 AND DATE(date) = CURDATE()
                ) as today_activity_value
            FROM missions m
            LEFT JOIN user_missions um ON m.id = um.mission_id 
                AND um.user_id = ? 
                AND DATE(um.completed_at) = CURDATE()
            ORDER BY m.min_level ASC, m.id ASC
        `;

        const [missions] = await db.execute(query, [currentLevel, userId, userId]);

        const formattedMissions = missions.map(mission => {
            let isCompletable = true;
            let progressText = "Siap klaim";

            if (mission.required_activity_id) {
                const currentVal = parseFloat(mission.today_activity_value || 0);
                const targetVal = mission.required_value;
                isCompletable = currentVal >= targetVal;
                progressText = `${currentVal} / ${targetVal} tercapai`;
            }

            return {
                ...mission,
                is_completable: isCompletable && !mission.is_locked && !mission.is_claimed,
                progress_text: progressText
            };
        });

        res.json({
            levelInfo: {
                currentLevel,
                currentXP,
                nextLevelXP,
                xpProgress,
                xpPerLevel
            },
            missions: formattedMissions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. Klaim Misi
exports.claimMission = async (req, res) => {
    try {
        const { userId, missionId } = req.body;

        const [missionRows] = await db.execute('SELECT * FROM missions WHERE id = ?', [missionId]);
        if (missionRows.length === 0) return res.status(404).json({ message: 'Misi tidak ditemukan' });
        const mission = missionRows[0];

        const [userRows] = await db.execute('SELECT current_level, total_xp, island_health FROM users WHERE id = ?', [userId]);
        const user = userRows[0];

        if (user.current_level < mission.min_level) {
            return res.status(403).json({ message: `Level ${mission.min_level} diperlukan!` });
        }

        if (mission.required_activity_id) {
            // FIX: Ubah 'log_date' menjadi 'date'
            const [logCheck] = await db.execute(`
                SELECT SUM(input_value) as total 
                FROM daily_logs 
                WHERE user_id = ? 
                AND activity_id = ? 
                AND DATE(date) = CURDATE()
            `, [userId, mission.required_activity_id]);

            const totalDone = parseFloat(logCheck[0].total || 0);
            if (totalDone < mission.required_value) {
                return res.status(400).json({ 
                    message: `Belum memenuhi syarat! Kamu baru melakukan ${totalDone}/${mission.required_value}.` 
                });
            }
        }

        const [checkRows] = await db.execute(
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND DATE(completed_at) = CURDATE()',
            [userId, missionId]
        );
        if (checkRows.length > 0) return res.status(400).json({ message: 'Sudah diklaim hari ini!' });

        await db.execute('INSERT INTO user_missions (user_id, mission_id, status, completed_at) VALUES (?, ?, "claimed", NOW())', [userId, missionId]);

        const newXP = user.total_xp + mission.xp_reward;
        let newLevel = user.current_level;
        let leveledUp = false;
        
        if (Math.floor(newXP / 100) + 1 > newLevel) {
            newLevel = Math.floor(newXP / 100) + 1;
            leveledUp = true;
        }

        const HEALTH_REWARD = 10;
        let newHealth = Math.min(100, user.island_health + HEALTH_REWARD);

        await db.execute(
            'UPDATE users SET total_xp = ?, current_level = ?, island_health = ? WHERE id = ?',
            [newXP, newLevel, newHealth, userId]
        );

        res.json({
            message: 'Misi Sukses!',
            xpAdded: mission.xp_reward,
            newLevel,
            leveledUp
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal klaim misi' });
    }
};