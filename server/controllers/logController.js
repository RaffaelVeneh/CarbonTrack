const db = require('../config/db');

// 1. AMBIL DAFTAR AKTIVITAS
exports.getActivities = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM activities');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. SIMPAN LOG BARU (LOGIC STREAK JAVASCRIPT ROBUST 🛠️)
exports.createLog = async (req, res) => {
    try {
        const { user_id, activity_id, input_value, date } = req.body;

        console.log(`\n--- MULAI INPUT LOG ---`);
        console.log(`User: ${user_id} | Tanggal Input: ${date}`);

        // A. CEK AKTIVITAS
        const [actRows] = await db.execute('SELECT * FROM activities WHERE id = ?', [activity_id]);
        if (actRows.length === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });
        
        const activity = actRows[0];
        const factor = parseFloat(activity.emission_factor);
        
        // HITUNG EMISI/HEMAT
        const carbonProduced = (parseFloat(input_value) * factor).toFixed(2); 
        let carbonSaved = 0;
        
        if (parseInt(activity_id) === 101 || parseInt(activity_id) === 102) {
             carbonSaved = (parseFloat(input_value) * 0.192).toFixed(2);
        } else if (parseInt(activity_id) === 104) {
            carbonSaved = (parseFloat(input_value) * 0.05).toFixed(2);
        }

        // B. SIMPAN KE LOG HARIAN
        await db.execute(
            'INSERT INTO daily_logs (user_id, activity_id, input_value, carbon_produced, carbon_saved, log_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, activity_id, input_value, carbonProduced, carbonSaved, date]
        );
        console.log('✅ Log harian tersimpan');

        // C. HITUNG STREAK (PAKE JS BIAR AMAN) 🔥
        const [userRows] = await db.execute('SELECT current_streak, last_log_date FROM users WHERE id = ?', [user_id]);
        const userData = userRows[0];

        // Format tanggal ke YYYY-MM-DD (Hilangkan Jam/Menit biar hitungannya pas)
        const inputDateObj = new Date(date); // Dari frontend
        const lastLogObj = userData.last_log_date ? new Date(userData.last_log_date) : null; // Dari DB

        // Fungsi helper buat hitung beda hari
        const getDiffDays = (d1, d2) => {
            if (!d1 || !d2) return null;
            const date1 = new Date(d1.toISOString().split('T')[0]);
            const date2 = new Date(d2.toISOString().split('T')[0]);
            const diffTime = date1 - date2; 
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        };

        const diffDays = getDiffDays(inputDateObj, lastLogObj);
        let newStreak = userData.current_streak || 0;

        console.log(`📅 DB Last Log: ${lastLogObj} | 📅 Input Date: ${inputDateObj}`);
        console.log(`🔢 Beda Hari: ${diffDays}`);

        if (diffDays === null) {
            console.log('🚀 First Log Ever -> Streak 1');
            newStreak = 1;
        } else if (diffDays === 0) {
            console.log('⏸️ Log di hari yang sama -> Streak Tetap');
            // newStreak tetap
        } else if (diffDays === 1) {
            console.log('🔥 Log hari berturut-turut -> Streak Nambah!');
            newStreak += 1;
        } else if (diffDays > 1) {
            console.log('💔 Bolos lebih dari sehari -> Streak Reset 1');
            newStreak = 1;
        } else {
            console.log('⚠️ Input tanggal masa lalu -> Streak Tetap');
        }

        // D. UPDATE USER (Update Streak & Health)
        let healthUpdate = 'island_health'; // Default gak berubah
        if (carbonProduced > 0) {
            healthUpdate = `GREATEST(0, island_health - ${Math.ceil(carbonProduced * 2)})`;
        } else if (carbonSaved > 0) {
            healthUpdate = `LEAST(100, island_health + ${Math.ceil(carbonSaved * 1)})`;
        }

        // Kita PAKSA update last_log_date ke tanggal input (jika input >= last_log)
        // Gunakan prepared statement manual biar aman
        const updateQuery = `
            UPDATE users 
            SET 
                island_health = ${healthUpdate},
                current_streak = ?,
                last_log_date = ? 
            WHERE id = ?
        `;

        await db.execute(updateQuery, [newStreak, date, user_id]);
        console.log(`✅ User Updated: Streak ${newStreak}, Date ${date}`);

        res.status(201).json({ 
            message: 'Log disimpan!', 
            co2_produced: carbonProduced,
            co2_saved: carbonSaved,
            newStreak: newStreak
        });

    } catch (error) {
        console.error("❌ Gagal createLog:", error);
        res.status(500).json({ message: 'Gagal menyimpan log' });
    }
};

// 3. DASHBOARD SUMMARY (TETAP SAMA)
exports.getDashboardSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const [todayRows] = await db.execute(
            'SELECT SUM(carbon_produced) as emission, SUM(carbon_saved) as saved FROM daily_logs WHERE user_id = ? AND log_date = ?',
            [userId, today]
        );
        const [totalRows] = await db.execute(
            'SELECT SUM(carbon_produced) as total_emission, SUM(carbon_saved) as total_saved FROM daily_logs WHERE user_id = ?',
            [userId]
        );
        const [graphRows] = await db.execute(
            `SELECT log_date, SUM(carbon_produced) as emission, SUM(carbon_saved) as saved 
             FROM daily_logs WHERE user_id = ? GROUP BY log_date ORDER BY log_date DESC LIMIT 7`,
            [userId]
        );

        const formattedGraph = graphRows.map(row => ({
            name: new Date(row.log_date).toLocaleDateString('id-ID', { weekday: 'short' }),
            emission: parseFloat(row.emission || 0),
            saved: parseFloat(row.saved || 0)
        })).reverse();

        res.json({
            todayEmission: parseFloat(todayRows[0]?.emission || 0).toFixed(2),
            todaySaved: parseFloat(todayRows[0]?.saved || 0).toFixed(2),
            totalEmission: parseFloat(totalRows[0]?.total_emission || 0).toFixed(2),
            totalSaved: parseFloat(totalRows[0]?.total_saved || 0).toFixed(2),
            graphData: formattedGraph
        });

    } catch (error) {
        console.error("Gagal getSummary:", error);
        res.status(500).json({ message: 'Gagal ambil summary', graphData: [] });
    }
};

// 4. RIWAYAT LOG (TETAP SAMA)
exports.getHistoryLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const { filter } = req.query;
        let dateCondition = "";
        
        switch (filter) {
            case 'daily': dateCondition = "AND DATE(log_date) = CURDATE()"; break;
            case 'weekly': dateCondition = "AND YEARWEEK(log_date, 1) = YEARWEEK(CURDATE(), 1)"; break;
            case 'monthly': dateCondition = "AND MONTH(log_date) = MONTH(CURDATE()) AND YEAR(log_date) = YEAR(CURDATE())"; break;
            default: dateCondition = ""; break;
        }

        const query = `
            SELECT daily_logs.id, daily_logs.log_date as date, daily_logs.input_value, 
            daily_logs.carbon_produced as carbon_emission, daily_logs.carbon_saved,
            activities.activity_name, activities.category, activities.unit
            FROM daily_logs
            JOIN activities ON daily_logs.activity_id = activities.id
            WHERE daily_logs.user_id = ? ${dateCondition}
            ORDER BY daily_logs.log_date DESC, daily_logs.id DESC
        `;

        const [rows] = await db.execute(query, [userId]);
        res.json(rows);
    } catch (error) {
        console.error("Gagal getHistory:", error);
        res.status(500).json({ error: error.message });
    }
};