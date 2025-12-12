'use client';

import { useState, useEffect, Suspense } from 'react'; // Tambah useEffect & Suspense
import { useRouter, useSearchParams } from 'next/navigation'; // Tambah useSearchParams
import { CheckCircle } from 'lucide-react'; 

// Kita butuh komponen pembungkus (Wrapper) agar useSearchParams aman
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFlipped, setIsFlipped] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.id) {
          console.log('User already logged in, redirecting to dashboard...');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Invalid user data:', error);
        localStorage.removeItem('user');
      }
    }

    // Cek URL saat halaman dibuka
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsFlipped(true); // Langsung balik kartu ke Register
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans overflow-hidden">
      
      {/* CONTAINER 3D */}
      <div className="w-full max-w-md h-[580px] [perspective:1000px]">
        
        {/* KARTU BERPUTAR */}
        <div
          className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          
          {/* SISI DEPAN (LOGIN) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
            <LoginForm onSwitch={() => setIsFlipped(true)} />
          </div>

          {/* SISI BELAKANG (REGISTER) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <RegisterForm onSwitch={() => setIsFlipped(false)} />
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. KOMPONEN LOGIN (Tetap Sama)
// ==========================================
function LoginForm({ onSwitch }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.message || 'Email atau password salah');
      }
    } catch (err) { setError('Gagal menghubungi server'); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full h-full border border-gray-100 flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">Welcome Back! 👋</h1>
        <p className="text-gray-500">Lanjutkan progres hijaumu.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" value={formData.email} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="nama@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" value={formData.password} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="••••••••" />
          <div className="text-right mt-1">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-xs text-emerald-600 hover:underline bg-transparent border-none cursor-pointer"
            >
              Lupa Password?
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition duration-200 disabled:bg-emerald-400">
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <button onClick={onSwitch} className="text-emerald-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">
          Daftar disini
        </button>
      </p>
    </div>
  );
}

// ==========================================
// 2. KOMPONEN REGISTER (dengan Verifikasi Kode)
// ==========================================
function RegisterForm({ onSwitch }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Countdown timer untuk resend code
  useEffect(() => {
    if (showVerification && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showVerification, countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setShowVerification(true);
        setCountdown(600); // Reset countdown
        setCanResend(false);
      }
      else setError(data.message || 'Terjadi kesalahan');
    } catch (err) { setError('Gagal menghubungi server'); } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        // Auto-login: simpan token dan user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect ke dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Kode verifikasi salah');
      }
    } catch (err) { setError('Gagal menghubungi server'); } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setCountdown(600); // Reset countdown
        setCanResend(false);
        setError(''); // Clear error
        // Show success message
        setTimeout(() => setError(''), 3000);
      } else {
        setError(data.message || 'Gagal mengirim ulang kode');
      }
    } catch (err) { setError('Gagal menghubungi server'); } finally { setLoading(false); }
  };

  // UI untuk form registrasi
  if (!showVerification) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full h-full border border-gray-100 flex flex-col justify-center">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-600 mb-2">Buat Akun 🚀</h1>
          <p className="text-gray-500">Mulai langkah kecilmu.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input name="username" type="text" value={formData.username} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="Username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={formData.email} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="nama@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" value={formData.password} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="Min. 6 karakter" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition duration-200 mt-2 disabled:bg-emerald-400">
            {loading ? 'Memproses...' : 'Daftar Akun'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <button onClick={onSwitch} className="text-emerald-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">
            Masuk disini
          </button>
        </p>
      </div>
    );
  }

  // UI untuk verifikasi kode
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg w-full h-full border border-gray-100 flex flex-col justify-center">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Email 📧</h1>
        <p className="text-gray-500 text-sm">
          Kode verifikasi telah dikirim ke<br/>
          <span className="font-semibold text-emerald-600">{formData.email}</span>
        </p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-lg">{error}</div>}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Masukkan Kode 6 Digit
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-center text-2xl font-bold tracking-widest"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={loading || verificationCode.length !== 6}
          className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-3">
          {countdown > 0 ? (
            <>Kode akan kadaluarsa dalam <span className="font-bold text-emerald-600">{formatTime(countdown)}</span></>
          ) : (
            <span className="text-red-600 font-semibold">Kode telah kadaluarsa</span>
          )}
        </p>
        
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-emerald-600 font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:text-gray-400"
          >
            Kirim Ulang Kode
          </button>
        ) : (
          <span className="text-gray-400 text-sm">Kirim ulang tersedia dalam {formatTime(countdown)}</span>
        )}
      </div>

      <button
        onClick={() => setShowVerification(false)}
        className="mt-4 text-center text-sm text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer"
      >
        ← Kembali ke form registrasi
      </button>
    </div>
  );
}