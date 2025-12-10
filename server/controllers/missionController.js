const db = require('../config/db');

// 1. Ambil Semua Misi
exports.getMissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT m.*, 
            CASE WHEN um.id IS NOT NULL THEN 1 ELSE 0 END as is_claimed
            FROM missions m
            LEFT JOIN user_missions um ON m.id = um.mission_id 
            AND um.user_id = ? 
            AND DATE(um.completed_at) = CURDATE()
        `;
        const [rows] = await db.execute(query, [userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. Klaim Misi + CEK BADGE
exports.claimMission = async (req, res) => {
    try {
        const { userId, missionId } = req.body;

        // A. Validasi Misi
        const [missionRows] = await db.execute('SELECT * FROM missions WHERE id = ?', [missionId]);
        if (missionRows.length === 0) return res.status(404).json({ message: 'Misi tidak ditemukan' });
        const mission = missionRows[0];

        // B. Cek Klaim Harian
        const [checkRows] = await db.execute(
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND DATE(completed_at) = CURDATE()',
            [userId, missionId]
        );
        if (checkRows.length > 0) return res.status(400).json({ message: 'Sudah diklaim hari ini!' });

        // C. Simpan Klaim
        await db.execute(
            'INSERT INTO user_missions (user_id, mission_id, status, completed_at) VALUES (?, ?, "claimed", NOW())',
            [userId, missionId]
        );

        // D. Update XP, Level, Health
        const [userRows] = await db.execute('SELECT total_xp, current_level, island_health FROM users WHERE id = ?', [userId]);
        const currentUser = userRows[0];
        
        const newXP = currentUser.total_xp + mission.xp_reward;
        let newLevel = currentUser.current_level;
        let leveledUp = false;
        if (Math.floor(newXP / 100) + 1 > newLevel) {
            newLevel = Math.floor(newXP / 100) + 1;
            leveledUp = true;
        }

        const HEALTH_REWARD = 10;
        let newHealth = currentUser.island_health + HEALTH_REWARD;
        if (newHealth > 100) newHealth = 100;

        await db.execute(
            'UPDATE users SET total_xp = ?, current_level = ?, island_health = ? WHERE id = ?',
            [newXP, newLevel, newHealth, userId]
        );

        // --- LOGIKA BARU: CEK BADGE "MISSION MASTER" ---
        let newBadge = null;
        
        // 1. Hitung total misi yang sudah diselesaikan user ini
        const [countRows] = await db.execute('SELECT COUNT(*) as total FROM user_missions WHERE user_id = ?', [userId]);
        const totalMissionsDone = countRows[0].total;

        // 2. Cari Badge tipe 'mission_count' yang syaratnya sudah terpenuhi
        const [eligibleBadges] = await db.execute(
            'SELECT * FROM badges WHERE requirement_type = "mission_count" AND requirement_value <= ?', 
            [totalMissionsDone]
        );

        // 3. Loop cek apakah user sudah punya badge itu, kalau belum -> Kasih!
        for (let badge of eligibleBadges) {
            const [ownedBadge] = await db.execute(
                'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?', 
                [userId, badge.id]
            );
            
            if (ownedBadge.length === 0) {
                // HORE! Dapat Badge Baru
                await db.execute('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
                newBadge = badge; // Simpan info badge buat dikirim ke frontend
            }
        }
        // ----------------------------------------------------

        res.json({
            message: 'Misi berhasil!',
            xpAdded: mission.xp_reward,
            newLevel,
            leveledUp,
            newHealth,
            healthRestored: HEALTH_REWARD,
            newBadge // Kirim info badge baru (bisa null kalau gak dapet)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal klaim misi' });
    }
};