const db = require('../config/db');

// 1. Ambil Semua Misi (dan statusnya buat user yang login)
exports.getMissions = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Query agak kompleks: Mengambil misi + cek apakah user sudah klaim HARI INI
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
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. Klaim Misi (Dapat XP + Cek Level Up)
exports.claimMission = async (req, res) => {
    try {
        const { userId, missionId } = req.body;

        // A. Cek apakah misi valid
        const [missionRows] = await db.execute('SELECT * FROM missions WHERE id = ?', [missionId]);
        if (missionRows.length === 0) return res.status(404).json({ message: 'Misi tidak ditemukan' });
        const mission = missionRows[0];

        // B. Cek apakah sudah diklaim hari ini (biar gak curang spam klik)
        const [checkRows] = await db.execute(
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND DATE(completed_at) = CURDATE()',
            [userId, missionId]
        );
        if (checkRows.length > 0) return res.status(400).json({ message: 'Misi sudah diklaim hari ini!' });

        // C. Catat di user_missions
        await db.execute(
            'INSERT INTO user_missions (user_id, mission_id, status, completed_at) VALUES (?, ?, "claimed", NOW())',
            [userId, missionId]
        );

        // D. Update XP User & Cek Level
        // Kita ambil data user dulu
        const [userRows] = await db.execute('SELECT total_xp, current_level FROM users WHERE id = ?', [userId]);
        const currentUser = userRows[0];
        
        const newXP = currentUser.total_xp + mission.xp_reward;
        let newLevel = currentUser.current_level;
        let leveledUp = false;

        // RUMUS LEVEL UP: Setiap 100 XP naik 1 level (Sederhana untuk lomba)
        const calculatedLevel = Math.floor(newXP / 100) + 1;

        if (calculatedLevel > newLevel) {
            newLevel = calculatedLevel;
            leveledUp = true;
        }

        // Simpan perubahan ke tabel users
        await db.execute(
            'UPDATE users SET total_xp = ?, current_level = ? WHERE id = ?',
            [newXP, newLevel, userId]
        );

        res.json({
            message: 'Misi berhasil diklaim!',
            xpAdded: mission.xp_reward,
            newTotalXP: newXP,
            newLevel: newLevel,
            leveledUp: leveledUp // Flag penting untuk Frontend
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal klaim misi' });
    }
};