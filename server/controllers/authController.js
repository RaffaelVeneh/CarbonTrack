const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// LOGIKA REGISTER
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Cek apakah email sudah terdaftar
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email sudah terdaftar!' });
        }

        // 2. Enkripsi Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Simpan ke Database
        await User.create(username, email, hashedPassword);

        res.status(201).json({ message: 'Registrasi berhasil! Silakan login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// LOGIKA LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Cek user ada atau tidak
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Email atau password salah' });
        }

        // 2. Cek password cocok atau tidak
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email atau password salah' });
        }

        // 3. Buat Token (JWT)
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '1d' // Token berlaku 1 hari
        });

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                level: user.current_level
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};