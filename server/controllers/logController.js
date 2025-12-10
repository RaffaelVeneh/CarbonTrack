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

// 2. SIMPAN LOG BARU
exports.createLog = async (req, res) => {
    try {
        const { user_id, activity_id, input_value, date } = req.body;

        // Ambil emission factor
        const [actRows] = await db.execute('SELECT emission_factor FROM activities WHERE id = ?', [activity_id]);
        if (actRows.length === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });
        
        const factor = actRows[0].emission_factor;
        const carbonProduced = (input_value * factor).toFixed(2); 

        // Simpan ke tabel daily_logs (Sesuai database kamu)
        await db.execute(
            'INSERT INTO daily_logs (user_id, activity_id, input_value, carbon_produced, log_date) VALUES (?, ?, ?, ?, ?)',
            [user_id, activity_id, input_value, carbonProduced, date]
        );

        // Update Health Pohon
        const damage = Math.ceil(carbonProduced * 2); 
        await db.execute('UPDATE users SET island_health = GREATEST(0, island_health - ?) WHERE id = ?', [damage, user_id]);
        
        // Cek Badge (Logic 'Carbon Warrior')
        const [countRows] = await db.execute('SELECT COUNT(*) as total FROM daily_logs WHERE user_id = ?', [user_id]);
        const totalLogs = countRows[0].total;
        
        // Berikan badge jika eligible (Sederhana)
        // ... (Logic badge dipersingkat agar fokus ke perbaikan error utama dulu)

        res.status(201).json({ 
            message: 'Log disimpan!', 
            co2: carbonProduced 
        });

    } catch (error) {
        console.error("Gagal createLog:", error);
        res.status(500).json({ message: 'Gagal menyimpan log' });
    }
};

// 3. DASHBOARD SUMMARY
exports.getDashboardSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        // Total Hari Ini
        const [todayRows] = await db.execute(
            'SELECT SUM(carbon_produced) as total FROM daily_logs WHERE user_id = ? AND log_date = ?',
            [userId, today]
        );

        // Total Seumur Hidup
        const [totalRows] = await db.execute(
            'SELECT SUM(carbon_produced) as total FROM daily_logs WHERE user_id = ?',
            [userId]
        );

        // Data Grafik 7 Hari Terakhir
        const [graphRows] = await db.execute(
            `SELECT log_date, SUM(carbon_produced) as total FROM daily_logs WHERE user_id = ? GROUP BY log_date ORDER BY log_date DESC LIMIT 7`,
            [userId]
        );

        const formattedGraph = graphRows.map(row => ({
            name: new Date(row.log_date).toLocaleDateString('id-ID', { weekday: 'short' }),
            co2: parseFloat(row.total)
        })).reverse();

        res.json({
            todayEmission: parseFloat(todayRows[0].total || 0).toFixed(2),
            totalEmission: parseFloat(totalRows[0].total || 0).toFixed(2),
            graphData: formattedGraph
        });

    } catch (error) {
        console.error("Gagal getSummary:", error);
        res.status(500).json({ message: 'Gagal ambil summary' });
    }
};

// 4. RIWAYAT LOG (History Page) - INI YANG KEMARIN BIKIN ERROR
exports.getHistoryLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const { filter } = req.query;

        let dateCondition = "";
        
        // Gunakan 'log_date' bukan 'date'
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
            case 'yearly':
                dateCondition = "AND YEAR(log_date) = YEAR(CURDATE())";
                break;
            default:
                dateCondition = ""; 
                break;
        }

        // Query JOIN ke daily_logs
        // Kita gunakan ALIAS (AS) supaya frontend tidak perlu diubah
        // log_date -> jadi date
        // carbon_produced -> jadi carbon_emission
        const query = `
            SELECT 
                daily_logs.id, 
                daily_logs.log_date as date, 
                daily_logs.input_value, 
                daily_logs.carbon_produced as carbon_emission,
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