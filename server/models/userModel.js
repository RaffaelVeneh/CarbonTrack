const db = require('../config/db');

class User {
    // Cari user berdasarkan email
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    // Buat user baru
    static async create(username, email, passwordHash) {
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );
        return result.insertId;
    }

    // Cari user berdasarkan ID (untuk profil nanti)
    static async findById(id) {
        const [rows] = await db.execute('SELECT id, username, email, total_xp, current_level FROM users WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = User;