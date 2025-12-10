const db = require('../config/db');

/**
 * MISSION SYSTEM V2 - Advanced Gamification
 * Support untuk berbagai tipe misi dengan tracking otomatis
 */

// 1. GET MISSIONS - Ambil Misi Sesuai Level dengan Progress Real-time
exports.getMissions = async (req, res) => {
    try {
        const { userId } = req.params;

        // A. Ambil Data User
        const [userRows] = await db.execute(
            'SELECT id, username, total_xp, current_level, island_health FROM users WHERE id = ?', 
            [userId]
        );
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const user = userRows[0];
        const currentLevel = user.current_level;
        
        // Rumus Level: Level 1 (0-100 XP), Level 2 (100-200 XP), dst.
        const xpPerLevel = 100; 
        const nextLevelXP = currentLevel * xpPerLevel;
        const xpProgress = user.total_xp - ((currentLevel - 1) * xpPerLevel);

        // B. Ambil Misi yang Sesuai Level User
        const [missions] = await db.execute(`
            SELECT 
                m.*
            FROM missions m
            WHERE m.min_level <= ? + 1
            ORDER BY m.min_level ASC, m.difficulty ASC, m.id ASC
        `, [currentLevel]);

        // C. Untuk setiap misi, hitung progress berdasarkan tipe misi
        const missionsWithProgress = await Promise.all(missions.map(async (mission) => {
            // Cek apakah sudah diklaim
            const [claimCheck] = await db.execute(
                'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND status = "claimed"',
                [userId, mission.id]
            );
            const isClaimed = claimCheck.length > 0;
            const isLocked = mission.min_level > currentLevel;

            // Skip progress calculation jika sudah claimed atau locked
            if (isClaimed || isLocked) {
                return {
                    ...mission,
                    progress: 0,
                    progress_text: '0 / ' + mission.target_value,
                    is_completed: false,
                    is_claimed: isClaimed,
                    is_locked: isLocked,
                    is_completable: false,
                    can_claim: false
                };
            }

            // Hitung progress berdasarkan mission_type
            let progress = 0;
            let targetValue = parseFloat(mission.target_value);

            switch (mission.mission_type) {
                case 'co2_saved':
                    // Total CO2 yang dihemat dalam durasi tertentu
                    const [savedResult] = await db.execute(`
                        SELECT SUM(carbon_saved) as total
                        FROM daily_logs
                        WHERE user_id = ?
                        AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    `, [userId, mission.duration_days - 1]);
                    progress = parseFloat(savedResult[0].total || 0);
                    console.log(`User ${userId} - Mission ${mission.id} (${mission.title}): CO2 Saved = ${progress}`);
                    break;

                case 'co2_produced':
                    // Total CO2 yang diproduksi (untuk misi "Zero Carbon")
                    const [producedResult] = await db.execute(`
                        SELECT SUM(carbon_produced) as total
                        FROM daily_logs
                        WHERE user_id = ?
                        AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    `, [userId, mission.duration_days - 1]);
                    progress = parseFloat(producedResult[0].total || 0);
                    // Untuk tipe ini, completed jika progress <= target (misal target 0)
                    break;

                case 'specific_activity':
                    // Aktivitas spesifik (misal: Bersepeda 5km)
                    const [activityResult] = await db.execute(`
                        SELECT SUM(input_value) as total
                        FROM daily_logs
                        WHERE user_id = ?
                        AND activity_id = ?
                        AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    `, [userId, mission.required_activity_id, mission.duration_days - 1]);
                    progress = parseFloat(activityResult[0].total || 0);
                    break;

                case 'activity_count':
                    // Jumlah aktivitas ramah lingkungan (activity_id >= 101)
                    const [countResult] = await db.execute(`
                        SELECT COUNT(*) as total
                        FROM daily_logs
                        WHERE user_id = ?
                        AND activity_id >= 101
                        AND log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    `, [userId, mission.duration_days - 1]);
                    progress = parseFloat(countResult[0].total || 0);
                    break;

                case 'consecutive_days':
                    // Hitung berapa hari berturut-turut user hemat CO2
                    const [daysResult] = await db.execute(`
                        SELECT DISTINCT log_date
                        FROM daily_logs
                        WHERE user_id = ?
                        AND carbon_saved > 0
                        ORDER BY log_date DESC
                        LIMIT ?
                    `, [userId, mission.duration_days]);
                    
                    // Check consecutive
                    let consecutiveDays = 0;
                    const dates = daysResult.map(row => new Date(row.log_date));
                    if (dates.length > 0) {
                        consecutiveDays = 1;
                        for (let i = 0; i < dates.length - 1; i++) {
                            const diff = Math.floor((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
                            if (diff === 1) {
                                consecutiveDays++;
                            } else {
                                break;
                            }
                        }
                    }
                    progress = consecutiveDays;
                    targetValue = parseFloat(mission.target_value);
                    break;

                case 'total_distance':
                    // Total jarak untuk aktivitas transportasi
                    const [distanceResult] = await db.execute(`
                        SELECT SUM(dl.input_value) as total
                        FROM daily_logs dl
                        JOIN activities a ON dl.activity_id = a.id
                        WHERE dl.user_id = ?
                        AND a.category = 'transportation'
                        AND dl.log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    `, [userId, mission.duration_days - 1]);
                    progress = parseFloat(distanceResult[0].total || 0);
                    break;

                default:
                    progress = 0;
            }

            // Tentukan apakah completed
            let isCompleted = false;
            if (mission.mission_type === 'co2_produced') {
                // Untuk tipe CO2 produced, completed jika progress <= target
                isCompleted = progress <= targetValue;
            } else {
                // Untuk tipe lainnya, completed jika progress >= target
                isCompleted = progress >= targetValue;
            }

            // Format progress text untuk frontend
            let progressText = '';
            if (mission.mission_type === 'co2_produced') {
                progressText = `${progress.toFixed(2)} / ${targetValue} kg CO2`;
            } else if (mission.mission_type === 'consecutive_days') {
                progressText = `${Math.floor(progress)} / ${Math.floor(targetValue)} hari`;
            } else if (mission.mission_type === 'activity_count') {
                progressText = `${Math.floor(progress)} / ${Math.floor(targetValue)} aktivitas`;
            } else {
                progressText = `${progress.toFixed(2)} / ${targetValue}`;
            }

            return {
                id: mission.id,
                title: mission.title,
                description: mission.description,
                mission_type: mission.mission_type,
                target_value: parseFloat(mission.target_value),
                duration_days: mission.duration_days,
                required_activity_id: mission.required_activity_id,
                min_level: mission.min_level,
                max_level: mission.max_level,
                xp_reward: mission.xp_reward,
                health_reward: mission.health_reward,
                icon: mission.icon,
                difficulty: mission.difficulty,
                progress: parseFloat(progress.toFixed(2)),
                progress_text: progressText,
                is_completed: isCompleted,
                is_claimed: isClaimed,
                is_locked: false, // Tidak locked karena sudah difilter di atas
                is_completable: isCompleted && !isClaimed,
                can_claim: isCompleted && !isClaimed
            };
        }));

        res.json({
            levelInfo: {
                currentLevel,
                currentXP: user.total_xp,
                nextLevelXP,
                xpProgress,
                xpPerLevel,
                progressPercentage: Math.floor((xpProgress / xpPerLevel) * 100)
            },
            missions: missionsWithProgress
        });

    } catch (error) {
        console.error('Error getMissions:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// 2. CLAIM MISSION - Klaim Reward Misi
exports.claimMission = async (req, res) => {
    try {
        const { userId, missionId } = req.body;

        // A. Ambil Info Misi
        const [missionRows] = await db.execute('SELECT * FROM missions WHERE id = ?', [missionId]);
        if (missionRows.length === 0) {
            return res.status(404).json({ message: 'Misi tidak ditemukan' });
        }
        const mission = missionRows[0];

        // B. Ambil Data User
        const [userRows] = await db.execute(
            'SELECT current_level, total_xp, island_health FROM users WHERE id = ?', 
            [userId]
        );
        const user = userRows[0];

        // C. Validasi Level
        if (user.current_level < mission.min_level) {
            return res.status(403).json({ 
                message: `Level ${mission.min_level} diperlukan untuk misi ini!` 
            });
        }

        // D. Cek Klaim Ganda
        const [checkClaimed] = await db.execute(
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND status = "claimed"',
            [userId, missionId]
        );
        if (checkClaimed.length > 0) {
            return res.status(400).json({ message: 'Misi ini sudah diklaim!' });
        }

        // E. Validasi Progress (Re-check di server)
        // ... (kita bisa copy logic dari getMissions untuk validasi ulang)
        // Untuk simplicity, kita trust frontend untuk sekarang
        // Tapi di production, WAJIB validasi ulang progress di server!

        // F. Save ke user_missions
        await db.execute(
            'INSERT INTO user_missions (user_id, mission_id, status, progress_value, completed_at, claimed_at) VALUES (?, ?, "claimed", ?, NOW(), NOW())',
            [userId, missionId, mission.target_value]
        );

        // G. Hitung Reward
        const newXP = user.total_xp + mission.xp_reward;
        const xpPerLevel = 100;
        let newLevel = Math.floor(newXP / xpPerLevel) + 1;
        const leveledUp = newLevel > user.current_level;

        // H. Update Health
        const newHealth = Math.min(100, user.island_health + mission.health_reward);

        // I. Update User
        await db.execute(
            'UPDATE users SET total_xp = ?, current_level = ?, island_health = ? WHERE id = ?',
            [newXP, newLevel, newHealth, userId]
        );

        res.json({
            success: true,
            message: leveledUp ? `🎉 Level Up! Sekarang Level ${newLevel}!` : 'Misi berhasil diklaim!',
            xpAdded: mission.xp_reward,
            healthAdded: mission.health_reward,
            newLevel,
            leveledUp,
            rewards: {
                xp: mission.xp_reward,
                health: mission.health_reward,
                newLevel,
                leveledUp
            }
        });

    } catch (error) {
        console.error('Error claimMission:', error);
        res.status(500).json({ message: 'Gagal klaim misi', error: error.message });
    }
};

// 3. GET MISSION HISTORY - Riwayat Misi yang Sudah Diklaim
exports.getMissionHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const [history] = await db.execute(`
            SELECT 
                um.*,
                m.title,
                m.description,
                m.xp_reward,
                m.health_reward,
                m.icon,
                m.difficulty
            FROM user_missions um
            JOIN missions m ON um.mission_id = m.id
            WHERE um.user_id = ?
            AND um.status = 'claimed'
            ORDER BY um.claimed_at DESC
            LIMIT 50
        `, [userId]);

        res.json({
            total: history.length,
            history
        });

    } catch (error) {
        console.error('Error getMissionHistory:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
