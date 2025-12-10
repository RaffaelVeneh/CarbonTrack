const db = require('../config/db');

// 1. Ambil Misi + Info Progress Level
exports.getMissions = async (req, res) => {
    try {
        const { userId } = req.params;

        // A. Ambil Data User untuk Hitung Level & XP
        const [userRows] = await db.execute('SELECT total_xp, current_level FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const user = userRows[0];
        const currentXP = user.total_xp;
        const currentLevel = user.current_level;
        
        // Rumus Level: Level 1 (0-100 XP), Level 2 (101-200 XP), dst.
        const xpPerLevel = 100; 
        const nextLevelXP = currentLevel * xpPerLevel; // Target XP untuk naik level berikutnya
        const xpProgress = currentXP - ((currentLevel - 1) * xpPerLevel); // XP yang didapat di level ini

        // B. Ambil Misi dengan Status 'Locked' & 'Completed' (Validasi Log)
        // Kita join ke daily_logs untuk cek apakah user SUDAH melakukan aktivitas yang diminta misi hari ini
        const query = `
            SELECT 
                m.*,
                CASE WHEN m.min_level > ? THEN 1 ELSE 0 END as is_locked,
                CASE WHEN um.id IS NOT NULL THEN 1 ELSE 0 END as is_claimed,
                -- Cek apakah user sudah log aktivitas yang sesuai hari ini (untuk validasi)
                (SELECT SUM(input_value) FROM daily_logs 
                 WHERE user_id = ? 
                 AND activity_id = m.required_activity_id 
                 AND DATE(log_date) = CURDATE()
                ) as today_activity_value
            FROM missions m
            LEFT JOIN user_missions um ON m.id = um.mission_id 
                AND um.user_id = ? 
                AND DATE(um.completed_at) = CURDATE()
            ORDER BY m.min_level ASC, m.id ASC
        `;

        const [missions] = await db.execute(query, [currentLevel, userId, userId]);

        // C. Format Data untuk Frontend
        const formattedMissions = missions.map(mission => {
            // Logika Validasi Otomatis
            // Jika required_activity_id NULL, anggap misi manual (selalu bisa diklaim jika tidak locked)
            // Jika ada ID, cek apakah today_activity_value >= required_value
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

// 2. Klaim Misi (Dengan Validasi Server-Side)
exports.claimMission = async (req, res) => {
    try {
        const { userId, missionId } = req.body;

        // A. Ambil Info Misi
        const [missionRows] = await db.execute('SELECT * FROM missions WHERE id = ?', [missionId]);
        if (missionRows.length === 0) return res.status(404).json({ message: 'Misi tidak ditemukan' });
        const mission = missionRows[0];

        // B. Cek Level User (Server-side guard)
        const [userRows] = await db.execute('SELECT current_level, total_xp, island_health, total_co2_saved FROM users WHERE id = ?', [userId]);
        const user = userRows[0];

        if (user.current_level < mission.min_level) {
            return res.status(403).json({ message: `Level ${mission.min_level} diperlukan!` });
        }

        // C. Cek Apakah Sudah Input Log Aktivitas (Validasi Anti-Curang)
        if (mission.required_activity_id) {
            const [logCheck] = await db.execute(`
                SELECT SUM(input_value) as total 
                FROM daily_logs 
                WHERE user_id = ? 
                AND activity_id = ? 
                AND DATE(log_date) = CURDATE()
            `, [userId, mission.required_activity_id]);

            const totalDone = parseFloat(logCheck[0].total || 0);
            if (totalDone < mission.required_value) {
                return res.status(400).json({ 
                    message: `Belum memenuhi syarat! Kamu baru melakukan ${totalDone}/${mission.required_value}.` 
                });
            }
        }

        // D. Cek Klaim Ganda
        const [checkRows] = await db.execute(
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND DATE(completed_at) = CURDATE()',
            [userId, missionId]
        );
        if (checkRows.length > 0) return res.status(400).json({ message: 'Sudah diklaim hari ini!' });

        // E. Proses Reward (Sama seperti sebelumnya)
        await db.execute('INSERT INTO user_missions (user_id, mission_id, status, completed_at) VALUES (?, ?, "claimed", NOW())', [userId, missionId]);

        const newXP = user.total_xp + mission.xp_reward;
        let newLevel = user.current_level;
        let leveledUp = false;
        
        // Cek Level Up
        if (Math.floor(newXP / 100) + 1 > newLevel) {
            newLevel = Math.floor(newXP / 100) + 1;
            leveledUp = true;
        }

        // Update User
        const HEALTH_REWARD = 10;
        let newHealth = Math.min(100, user.island_health + HEALTH_REWARD);
        // Asumsi kolom co2_reward sudah ditambahkan di tabel missions
        const missionCO2 = parseFloat(mission.co2_reward || 0); 
        const newTotalCO2 = parseFloat(user.total_co2_saved || 0) + missionCO2;

        await db.execute(
            'UPDATE users SET total_xp = ?, current_level = ?, island_health = ?, total_co2_saved = ? WHERE id = ?',
            [newXP, newLevel, newHealth, newTotalCO2, userId]
        );

        // --- SISTEM BADGE (Sama seperti sebelumnya) ---
        let newBadge = null;
        // ... (Kode badge tetap sama, user bisa copy paste dari versi sebelumnya atau pakai yg simple)

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