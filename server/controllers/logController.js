const db = require('../config/db');

// 1. Ambil Daftar Aktivitas (untuk Dropdown)
exports.getActivities = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM activities');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. Simpan Log & Hitung Emisi
exports.createLog = async (req, res) => {
    try {
        const { user_id, activity_id, input_value, date } = req.body;

        // A. Cari tahu faktor emisi dari aktivitas yang dipilih
        const [actRows] = await db.execute('SELECT emission_factor FROM activities WHERE id = ?', [activity_id]);
        
        if (actRows.length === 0) return res.status(404).json({ message: 'Aktivitas tidak ditemukan' });

        const factor = actRows[0].emission_factor;

        // B. Hitung Emisi (Rumus: Input * Faktor)
        // Contoh: 10 km * 0.192 = 1.92 kg CO2
        const carbonProduced = (input_value * factor).toFixed(2); 

        // C. Simpan ke Database
        await db.execute(
            'INSERT INTO daily_logs (user_id, activity_id, input_value, carbon_produced, log_date) VALUES (?, ?, ?, ?, ?)',
            [user_id, activity_id, input_value, carbonProduced, date]
        );

        res.status(201).json({ message: 'Log berhasil disimpan!', co2: carbonProduced });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menyimpan log' });
    }
};

exports.getDashboardSummary = async (req, res) => {
    try {
        const { userId } = req.params;

        // A. Hitung Total Emisi Hari Ini
        const today = new Date().toISOString().split('T')[0];
        const [todayRows] = await db.execute(
            'SELECT SUM(carbon_produced) as total FROM daily_logs WHERE user_id = ? AND log_date = ?',
            [userId, today]
        );
        const todayEmission = todayRows[0].total || 0;

        // B. Hitung Total Emisi Keseluruhan (All Time)
        const [totalRows] = await db.execute(
            'SELECT SUM(carbon_produced) as total FROM daily_logs WHERE user_id = ?',
            [userId]
        );
        const totalEmission = totalRows[0].total || 0;

        // C. Data Grafik (7 Hari Terakhir)
        // Query ini mengelompokkan data berdasarkan tanggal
        const [graphRows] = await db.execute(
            `SELECT log_date, SUM(carbon_produced) as total 
             FROM daily_logs 
             WHERE user_id = ? 
             GROUP BY log_date 
             ORDER BY log_date DESC 
             LIMIT 7`,
            [userId]
        );

        // Format data grafik agar urut dari hari lama ke baru (Senin -> Minggu)
        const formattedGraph = graphRows.map(row => ({
            name: new Date(row.log_date).toLocaleDateString('id-ID', { weekday: 'short' }), // "Sen", "Sel"
            co2: parseFloat(row.total)
        })).reverse();

        res.json({
            todayEmission: parseFloat(todayEmission).toFixed(2),
            totalEmission: parseFloat(totalEmission).toFixed(2),
            graphData: formattedGraph
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data dashboard' });
    }
};