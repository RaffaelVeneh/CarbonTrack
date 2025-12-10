const db = require('../config/db');

// 1. AMBIL DAFTAR AKTIVITAS (Dropdown)
exports.getActivities = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM activities');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. SIMPAN LOG BARU (DENGAN LOGIC HEMAT VS EMISI)
exports.createLog = async (req, res) => {
    try {
        const { user_id, activity_id, input_value, date } = req.body;

        // Ambil info aktivitas
        const [actRows] = await db.execute('SELECT * FROM activities WHERE id = ?', [activity_id]);
        if (actRows.length === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });
        
        const activity = actRows[0];
        const factor = parseFloat(activity.emission_factor);
        
        // HITUNG EMISI (Merah)
        // Jika factor > 0, berarti menghasilkan emisi.
        const carbonProduced = (parseFloat(input_value) * factor).toFixed(2); 

        // HITUNG PENGHEMATAN (Hijau)
        // Logika: Jika aktivitas ini "Transportasi Hijau" (Sepeda/Jalan), 
        // kita anggap user MENGHINDARI emisi kendaraan bermotor.
        // Asumsi: Menggantikan Mobil Bensin (0.192 kg/km). 
        // (Mirip dengan 1 Liter Bensin ~2.3kg CO2 untuk jarak 12km)
        let carbonSaved = 0;

        // ID 101 = Bersepeda, ID 102 = Jalan Kaki
        if (parseInt(activity_id) === 101 || parseInt(activity_id) === 102) {
             // Faktor penghematan: Setara emisi mobil per km
             const SAVING_FACTOR = 0.192; 
             carbonSaved = (parseFloat(input_value) * SAVING_FACTOR).toFixed(2);
        }
        
        // Bisa tambahkan logika lain, misal Tumbler (ID 104) hemat 1 botol plastik (0.05kg)
        if (parseInt(activity_id) === 104) {
            carbonSaved = (parseFloat(input_value) * 0.05).toFixed(2);
        }

        // Simpan ke database (Kolom carbon_saved harus sudah dibuat!)
        await db.execute(
            'INSERT INTO daily_logs (user_id, activity_id, input_value, carbon_produced, carbon_saved, log_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, activity_id, input_value, carbonProduced, carbonSaved, date]
        );

        // Update Health Pohon (Hanya berkurang jika ada Carbon Produced)
        if (carbonProduced > 0) {
            const damage = Math.ceil(carbonProduced * 2); 
            await db.execute('UPDATE users SET island_health = GREATEST(0, island_health - ?) WHERE id = ?', [damage, user_id]);
        } 
        // Opsional: Jika saving, bisa nambah health (Reward)
        else if (carbonSaved > 0) {
             const heal = Math.ceil(carbonSaved * 1); // 1 Health per kg saved
             await db.execute('UPDATE users SET island_health = LEAST(100, island_health + ?) WHERE id = ?', [heal, user_id]);
        }

        res.status(201).json({ 
            message: 'Log disimpan!', 
            co2_produced: carbonProduced,
            co2_saved: carbonSaved
        });

    } catch (error) {
        console.error("Gagal createLog:", error);
        res.status(500).json({ message: 'Gagal menyimpan log' });
    }
};

// 3. DASHBOARD SUMMARY (UPDATE GRAFIK HIJAU & MERAH)
exports.getDashboardSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        // Total Hari Ini
        const [todayRows] = await db.execute(
            'SELECT SUM(carbon_produced) as emission, SUM(carbon_saved) as saved FROM daily_logs WHERE user_id = ? AND log_date = ?',
            [userId, today]
        );

        // Total Seumur Hidup
        const [totalRows] = await db.execute(
            'SELECT SUM(carbon_produced) as total_emission, SUM(carbon_saved) as total_saved FROM daily_logs WHERE user_id = ?',
            [userId]
        );

        // Data Grafik 7 Hari Terakhir (Gabungan Emission & Saved)
        const [graphRows] = await db.execute(
            `SELECT 
                log_date, 
                SUM(carbon_produced) as emission, 
                SUM(carbon_saved) as saved 
             FROM daily_logs 
             WHERE user_id = ? 
             GROUP BY log_date 
             ORDER BY log_date DESC 
             LIMIT 7`,
            [userId]
        );

        // Format untuk Recharts
        const formattedGraph = graphRows.map(row => ({
            name: new Date(row.log_date).toLocaleDateString('id-ID', { weekday: 'short' }),
            emission: parseFloat(row.emission || 0),
            saved: parseFloat(row.saved || 0)
        })).reverse();

        res.json({
            todayEmission: parseFloat(todayRows[0].emission || 0).toFixed(2),
            todaySaved: parseFloat(todayRows[0].saved || 0).toFixed(2),
            totalEmission: parseFloat(totalRows[0].total_emission || 0).toFixed(2),
            totalSaved: parseFloat(totalRows[0].total_saved || 0).toFixed(2),
            graphData: formattedGraph
        });

    } catch (error) {
        console.error("Gagal getSummary:", error);
        res.status(500).json({ message: 'Gagal ambil summary' });
    }
};

// 4. RIWAYAT LOG
exports.getHistoryLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const { filter } = req.query;

        let dateCondition = "";
        
        switch (filter) {
            case 'daily':
                dateCondition = "AND DATE(log_date) = CURDATE()";
                break;
            case 'weekly':
                dateCondition = "AND YEARWEEK(log_date, 1) = YEARWEEK(CURDATE(), 1)";
                break;
            case 'monthly':
                dateCondition = "AND MONTH(log_date) = MONTH(CURDATE()) AND YEAR(log_date) = YEAR(CURDATE())";
                break;
            default:
                dateCondition = ""; 
                break;
        }

        const query = `
            SELECT 
                daily_logs.id, 
                daily_logs.log_date as date, 
                daily_logs.input_value, 
                daily_logs.carbon_produced as carbon_emission,
                daily_logs.carbon_saved,
                activities.activity_name,
                activities.category,
                activities.unit
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