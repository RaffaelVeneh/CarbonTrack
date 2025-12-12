const db = require('../config/db');

// 1. AMBIL DAFTAR AKTIVITAS
exports.getActivities = async (req, res) => {
    try {
        const { type } = req.query; // optional filter: 'positive' atau 'negative'
        
        let query = 'SELECT * FROM activities';
        let params = [];
        
        if (type === 'positive' || type === 'negative') {
            query += ' WHERE impact_type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY category, activity_name';
        
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. SIMPAN LOG BARU (LOGIC STREAK BERDASARKAN TANGGAL INPUT REALTIME 🛠️)
exports.createLog = async (req, res) => {
    try {
        const { user_id, activity_id, input_value, date } = req.body;

        // Dapatkan tanggal server SAAT INI untuk streak
        const serverToday = new Date().toISOString().split('T')[0];

        console.log(`\n--- MULAI INPUT LOG ---`);
        console.log(`User: ${user_id} | Tanggal Aktivitas: ${date} | Tanggal Input (Server): ${serverToday}`);

        // A. CEK AKTIVITAS
        const [actRows] = await db.execute('SELECT * FROM activities WHERE id = ?', [activity_id]);
        if (actRows.length === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });
        
        const activity = actRows[0];
        const factor = parseFloat(activity.emission_factor);
        const impactType = activity.impact_type;
        
        // HITUNG EMISI/HEMAT BERDASARKAN IMPACT_TYPE
        let carbonProduced = 0;
        let carbonSaved = 0;
        
        if (impactType === 'negative') {
            // Aktivitas buruk = menghasilkan emisi
            carbonProduced = (parseFloat(input_value) * factor).toFixed(2);
        } else if (impactType === 'positive') {
            // Aktivitas baik = menghemat emisi (equivalent dari aktivitas buruk yang dihindari)
            // Untuk transportasi: gunakan baseline motor (0.103 kg/km) atau mobil (0.192 kg/km)
            if (activity.category === 'transportation') {
                // Asumsi: menggantikan mobil (0.192 kg/km) - kecuali jika ada emission_factor kecil
                const baseline = factor > 0 ? 0.192 - factor : 0.192; // Selisih dari baseline
                carbonSaved = (parseFloat(input_value) * baseline).toFixed(2);
            } else if (activity.category === 'waste') {
                // Daur ulang = menghemat emisi produksi baru (plastik ~2.5, kertas ~1.8)
                const wasteBaseline = activity_id === 160 ? 2.5 : activity_id === 161 ? 1.8 : 1.0;
                carbonSaved = (parseFloat(input_value) * wasteBaseline).toFixed(2);
            } else if (activity.category === 'energy') {
                // Hemat energi = menghemat emisi listrik (0.85 kg/kWh)
                const energyBaseline = 0.85;
                carbonSaved = (parseFloat(input_value) * energyBaseline).toFixed(2);
            } else {
                // Default: gunakan faktor kecil untuk aktivitas positif lainnya
                carbonSaved = (parseFloat(input_value) * 0.5).toFixed(2);
            }
        }

        // B. SIMPAN KE LOG HARIAN
        await db.execute(
            'INSERT INTO daily_logs (user_id, activity_id, input_value, carbon_produced, carbon_saved, log_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, activity_id, input_value, carbonProduced, carbonSaved, date]
        );
        console.log('✅ Log harian tersimpan');

        // C. HITUNG STREAK DARI DAILY_LOGS (BERDASARKAN created_at) 🔥
        console.log(`\n=== STREAK CALCULATION FROM DAILY_LOGS ===`);
        
        // Ambil tanggal unik kapan user input data (dari created_at), diurutkan dari yang terbaru
        const [logDates] = await db.execute(`
            SELECT DISTINCT DATE(created_at) as input_date
            FROM daily_logs
            WHERE user_id = ?
            ORDER BY input_date DESC
        `, [user_id]);

        console.log(`📊 Total unique input dates: ${logDates.length}`);
        
        if (logDates.length === 0) {
            console.log('⚠️ No logs found (impossible case)');
            return res.status(500).json({ message: 'Error calculating streak' });
        }

        // Hitung streak dengan melihat consecutive days
        let newStreak = 1; // Minimal 1 (karena baru saja input)
        const today = new Date(serverToday);
        
        console.log(`📅 Checking dates for streak calculation:`);
        logDates.forEach((log, idx) => console.log(`   ${idx}: ${log.input_date}`));

        // Mulai dari tanggal terbaru (index 0)
        for (let i = 0; i < logDates.length - 1; i++) {
            const currentDate = new Date(logDates[i].input_date);
            const nextDate = new Date(logDates[i + 1].input_date);
            
            // Hitung selisih hari
            const diffTime = currentDate.getTime() - nextDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            console.log(`   🔍 Compare: ${logDates[i].input_date} vs ${logDates[i + 1].input_date} = ${diffDays} days apart`);
            
            if (diffDays === 1) {
                // Consecutive days! Tambah streak
                newStreak++;
                console.log(`   ✅ Consecutive! Streak now: ${newStreak}`);
            } else {
                // Not consecutive, stop counting
                console.log(`   ❌ Gap detected (${diffDays} days). Stop counting.`);
                break;
            }
        }

        console.log(`🔥 Final Calculated Streak: ${newStreak}`);
        
        // Ambil last_log_date untuk update (tanggal terbaru dari daily_logs)
        const latestInputDate = logDates[0].input_date;
        
        let shouldUpdateStreak = true; // Selalu update karena kita hitung ulang dari daily_logs

        console.log(`✅ Streak calculation complete!`);
        console.log(`=========================\n`);

        // D. UPDATE USER (Update Streak & Health)
        let healthUpdate = 'island_health'; // Default gak berubah
        if (carbonProduced > 0) {
            healthUpdate = `GREATEST(0, island_health - ${Math.ceil(carbonProduced * 2)})`;
        } else if (carbonSaved > 0) {
            healthUpdate = `LEAST(100, island_health + ${Math.ceil(carbonSaved * 1)})`;
        }

        // Update user dengan streak yang baru dihitung dan last_log_date dari tanggal input terbaru
        console.log(`📝 Update Database:`);
        console.log(`   - New Streak: ${newStreak}`);
        console.log(`   - Last Input Date: ${latestInputDate}`);
        
        const updateQuery = `
            UPDATE users 
            SET 
                island_health = ${healthUpdate},
                current_streak = ?,
                last_log_date = ? 
            WHERE id = ?
        `;

        await db.execute(updateQuery, [newStreak, latestInputDate, user_id]);
        console.log(`✅ User Updated Successfully!\n`);

        // CLEAR MISSION CACHE agar progress langsung update
        try {
            const missionController = require('./missionControllerV2');
            if (missionController.clearUserCache) {
                missionController.clearUserCache(user_id);
            }
        } catch (err) {
            console.log('⚠️  Could not clear mission cache:', err.message);
        }

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