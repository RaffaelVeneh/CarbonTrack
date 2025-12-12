const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const db = require('../config/db');

// CHECK AVAILABILITY (Username & Email)
exports.checkAvailability = async (req, res) => {
    try {
        const { username, email } = req.query;

        if (!username && !email) {
            return res.status(400).json({ message: 'Username atau email harus diisi!' });
        }

        const results = {};

        // Check username
        if (username) {
            const [rows] = await db.execute(
                'SELECT id, email_verified FROM users WHERE username = ?',
                [username]
            );
            // Username available if not found OR found but not verified
            results.usernameAvailable = rows.length === 0 || !rows[0].email_verified;
            results.usernameExists = rows.length > 0;
            results.usernameVerified = rows.length > 0 ? rows[0].email_verified : false;
        }

        // Check email
        if (email) {
            const [rows] = await db.execute(
                'SELECT id, email_verified FROM users WHERE email = ?',
                [email]
            );
            // Email available if not found OR found but not verified
            results.emailAvailable = rows.length === 0 || !rows[0].email_verified;
            results.emailExists = rows.length > 0;
            results.emailVerified = rows.length > 0 ? rows[0].email_verified : false;
        }

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// LOGIKA REGISTER (with 6-digit Code)
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Semua field harus diisi!' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password minimal 6 karakter!' });
        }

        // 2. Cek apakah email sudah terdaftar dan verified
        const existingEmail = await User.findByEmail(email);
        if (existingEmail && existingEmail.email_verified) {
            return res.status(400).json({ message: 'Email sudah terdaftar dan terverifikasi!' });
        }

        // 3. Cek apakah username sudah dipakai oleh user yang terverifikasi
        const [usernameCheck] = await db.execute(
            'SELECT id, email_verified FROM users WHERE username = ? AND email != ?',
            [username, email]
        );
        if (usernameCheck.length > 0 && usernameCheck[0].email_verified) {
            return res.status(400).json({ message: 'Username sudah dipakai!' });
        }

        // 4. Enkripsi Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 10 * 60000); // 10 minutes

        // 6. If user exists but not verified, update; otherwise create new
        if (existingEmail && !existingEmail.email_verified) {
            // Update existing unverified user
            await db.execute(
                'UPDATE users SET username = ?, password_hash = ?, verification_code = ?, verification_code_expires = ? WHERE email = ?',
                [username, hashedPassword, verificationCode, codeExpires, email]
            );
        } else {
            // Create new user
            await User.create(username, email, hashedPassword);
            await db.execute(
                'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE email = ?',
                [verificationCode, codeExpires, email]
            );
        }

        // 7. Send verification code email
        try {
            await emailService.sendVerificationCode(email, verificationCode, username);
            res.status(201).json({ 
                message: 'Kode verifikasi telah dikirim ke email Anda!',
                email: email,
                requiresVerification: true 
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            res.status(500).json({ 
                message: 'Gagal mengirim kode verifikasi. Silakan coba lagi.'
            });
        }
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

        // 2. Cek apakah email sudah terverifikasi
        if (!user.email_verified) {
            return res.status(403).json({ 
                message: 'Email belum terverifikasi! Silakan cek email Anda untuk kode verifikasi.',
                requiresVerification: true,
                email: user.email
            });
        }

        // 3. Cek password cocok atau tidak
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email atau password salah' });
        }

        // 4. Buat Token (JWT)
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d' // Token berlaku 7 hari
        });

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                level: user.current_level,
                island_health: user.island_health,
                email_verified: user.email_verified
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// VERIFY EMAIL with 6-digit code + AUTO LOGIN
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'Email dan kode harus diisi!' });
        }

        // Find user by email and verification code
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_code_expires > NOW()',
            [email, code]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Kode verifikasi tidak valid atau sudah kadaluarsa!' });
        }

        const user = users[0];

        // Check if already verified
        if (user.email_verified) {
            return res.status(400).json({ message: 'Email sudah terverifikasi sebelumnya!' });
        }

        // Update user as verified
        await db.execute(
            'UPDATE users SET email_verified = TRUE, verification_code = NULL, verification_code_expires = NULL WHERE id = ?',
            [user.id]
        );

        // Generate JWT token for auto-login
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d' // Token berlaku 7 hari
        });

        // Return user data + token (auto login)
        res.json({
            message: 'Email berhasil diverifikasi! Selamat datang di CarbonTracker! 🎉',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                level: user.current_level,
                island_health: user.island_health,
                email_verified: true
            },
            autoLogin: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// FORGOT PASSWORD - Request Reset
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email harus diisi!' });
        }

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists or not (security best practice)
            return res.json({ message: 'Jika email terdaftar, link reset password akan dikirim.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await db.execute(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, resetTokenExpires, user.id]
        );

        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(email, resetToken, user.username);
            res.json({ message: 'Jika email terdaftar, link reset password akan dikirim.' });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            res.status(500).json({ message: 'Gagal mengirim email. Silakan coba lagi.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token dan password baru harus diisi!' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password minimal 8 karakter!' });
        }

        // Find user by reset token
        const [users] = await db.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluarsa!' });
        }

        const user = users[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        await db.execute(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Password berhasil direset! Silakan login dengan password baru.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// RESEND VERIFICATION CODE
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email harus diisi!' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'Email tidak ditemukan!' });
        }

        if (user.email_verified) {
            return res.status(400).json({ message: 'Email sudah terverifikasi!' });
        }

        // Generate new 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 10 * 60000); // 10 minutes

        // Update code
        await db.execute(
            'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE id = ?',
            [verificationCode, codeExpires, user.id]
        );

        // Resend email
        try {
            await emailService.sendVerificationCode(email, verificationCode, user.username);
            res.json({ message: 'Kode verifikasi berhasil dikirim ulang!' });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            res.status(500).json({ message: 'Gagal mengirim kode. Silakan coba lagi.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};