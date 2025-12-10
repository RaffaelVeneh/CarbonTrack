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
        const carbonEmitted = (input_value * factor).toFixed(2); // Variabel diperbaiki

        // FIX: Gunakan 'date' dan 'carbon_emitted' sesuai database
        await db.execute(
            'INSERT INTO daily_logs (user_id, activity_id, input_value, carbon_emitted, date) VALUES (?, ?, ?, ?, ?)',
            [user_id, activity_id, input_value, carbonEmitted, date]
        );

        // Update Health Pohon
        const damage = Math.ceil(carbonEmitted * 2); 
        await db.execute('UPDATE users SET island_health = GREATEST(0, island_health - ?) WHERE id = ?', [damage, user_id]);
        
        res.status(201).json({ 
            message: 'Log disimpan!', 
            co2: carbonEmitted 
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

        // FIX: Gunakan 'carbon_emitted' dan 'date'
        const [todayRows] = await db.execute(
            'SELECT SUM(carbon_emitted) as total FROM daily_logs WHERE user_id = ? AND date = ?',
            [userId, today]
        );

        // FIX: Gunakan 'carbon_emitted'
        const [totalRows] = await db.execute(
            'SELECT SUM(carbon_emitted) as total FROM daily_logs WHERE user_id = ?',
            [userId]
        );

        // FIX: Gunakan 'date' dan 'carbon_emitted'
        const [graphRows] = await db.execute(
            `SELECT date, SUM(carbon_emitted) as total FROM daily_logs WHERE user_id = ? GROUP BY date ORDER BY date DESC LIMIT 7`,
            [userId]
        );

        const formattedGraph = graphRows.map(row => ({
            name: new Date(row.date).toLocaleDateString('id-ID', { weekday: 'short' }),
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

// 4. RIWAYAT LOG
exports.getHistoryLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const { filter } = req.query;

        let dateCondition = "";
        
        // FIX: Gunakan kolom 'date' untuk filter
        switch (filter) {
            case 'daily':
                dateCondition = "AND date = CURDATE()";
                break;
            case 'weekly':
                dateCondition = "AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)";
                break;
            case 'monthly':
                dateCondition = "AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())";
                break;
            case 'yearly':
                dateCondition = "AND YEAR(date) = YEAR(CURDATE())";
                break;
            default:
                dateCondition = ""; 
                break;
        }

        // FIX: Query disesuaikan dengan nama kolom database
        const query = `
            SELECT 
                daily_logs.id, 
                daily_logs.date, 
                daily_logs.input_value, 
                daily_logs.carbon_emitted as carbon_emission,
                activities.activity_name,
                activities.category,
                activities.unit
            FROM daily_logs
            JOIN activities ON daily_logs.activity_id = activities.id
            WHERE daily_logs.user_id = ? ${dateCondition}
            ORDER BY daily_logs.date DESC, daily_logs.id DESC
        `;

        const [rows] = await db.execute(query, [userId]);
        res.json(rows);

    } catch (error) {
        console.error("Gagal getHistory:", error);
        res.status(500).json({ error: error.message });
    }
};