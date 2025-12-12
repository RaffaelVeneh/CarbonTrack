const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail App Password (not regular password!)
    }
});

// Send verification code email (6-digit)
exports.sendVerificationCode = async (email, code, username) => {
    const mailOptions = {
        from: `"CarbonTracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '✅ Kode Verifikasi Email Anda - CarbonTracker',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🌱 CarbonTracker</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #1f2937; margin-top: 0;">Halo, ${username}! 👋</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Terima kasih telah mendaftar di CarbonTracker! Masukkan kode verifikasi berikut untuk mengaktifkan akun Anda:
                    </p>
                    <div style="text-align: center; margin: 30px 0; background: #f3f4f6; padding: 20px; border-radius: 10px;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">KODE VERIFIKASI</p>
                        <p style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #10b981; margin: 0; font-family: 'Courier New', monospace;">
                            ${code}
                        </p>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                        Kode ini berlaku selama <strong>10 menit</strong>
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        Jika Anda tidak mendaftar, abaikan email ini. Jangan bagikan kode ini kepada siapapun!
                    </p>
                </div>
                <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                    <p>© 2025 CarbonTracker. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Verification code sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending verification code:', error);
        throw error;
    }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, token, username) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: `"CarbonTracker" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Reset Password Anda - CarbonTracker',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Reset Password</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #1f2937; margin-top: 0;">Halo, ${username}! 👋</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Anda menerima email ini karena ada permintaan untuk reset password akun CarbonTracker Anda.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Atau copy link ini ke browser Anda:<br>
                        <a href="${resetUrl}" style="color: #ef4444; word-break: break-all;">${resetUrl}</a>
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        Link ini akan kadaluarsa dalam 1 jam. Jika Anda tidak meminta reset password, abaikan email ini dan password Anda tetap aman.
                    </p>
                </div>
                <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                    <p>© 2025 CarbonTracker. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending reset email:', error);
        throw error;
    }
};

// Test email configuration
exports.testEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email server is ready');
        return true;
    } catch (error) {
        console.error('❌ Email server error:', error);
        return false;
    }
};
