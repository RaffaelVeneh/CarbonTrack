'use client';

import { useState, useEffect, Suspense } from 'react'; // Tambah useEffect & Suspense
import { useRouter, useSearchParams } from 'next/navigation'; // Tambah useSearchParams
import { signIn } from 'next-auth/react';
import { CheckCircle, Eye, EyeOff } from 'lucide-react'; 

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
    <div className="min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden relative pb-16">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* CONTAINER 3D */}
      <div className="w-full max-w-md min-h-[640px] [perspective:1000px] relative z-10">
        
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

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
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
  const [showPassword, setShowPassword] = useState(false);

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
        // If email not verified, redirect to register page for verification
        if (data.requiresVerification) {
          setError(data.message + ' Silakan verifikasi email terlebih dahulu.');
          setTimeout(() => {
            router.push('/login?mode=register');
          }, 2000);
        } else {
          setError(data.message || 'Email atau password salah');
        }
      }
    } catch (err) { setError('Gagal menghubungi server'); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full border border-white/20 flex flex-col justify-center relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
      
      {/* Logo or Icon Section */}
      <div className="text-center mb-8">
        <img src="/logo-icon.jpg" alt="CarbonTrack Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Welcome Back!
        </h1>
        <p className="text-gray-600 text-sm">Lanjutkan perjalanan hijau kamu</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input 
              name="email" 
              type="email" 
              value={formData.email} 
              required 
              onChange={handleChange} 
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-gray-50 hover:bg-white" 
              placeholder="nama@email.com" 
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input 
              name="password" 
              type={showPassword ? "text" : "password"}
              value={formData.password} 
              required 
              onChange={handleChange} 
              className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-gray-50 hover:bg-white" 
              placeholder="••••••••" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="text-right mt-2">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-transparent border-none cursor-pointer transition"
            >
              Lupa Password?
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </span>
          ) : 'Masuk'}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/80 text-gray-500 font-medium">Atau</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/auth/google-callback' })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition duration-200 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-semibold text-gray-700">Lanjutkan dengan Google</span>
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <button 
          onClick={onSwitch} 
          className="text-emerald-600 font-bold hover:text-emerald-700 bg-transparent border-none cursor-pointer transition hover:underline"
        >
          Daftar sekarang
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
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation states
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const [emailStatus, setEmailStatus] = useState({ checking: false, available: null, message: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Real-time username check
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null, message: '' });
      try {
        const res = await fetch(`${API_URL}/auth/check-availability?username=${encodeURIComponent(formData.username)}`);
        const data = await res.json();
        
        if (data.usernameAvailable) {
          setUsernameStatus({ checking: false, available: true, message: '✓ Username tersedia' });
        } else {
          setUsernameStatus({ checking: false, available: false, message: '✗ Username sudah dipakai' });
        }
      } catch (err) {
        setUsernameStatus({ checking: false, available: null, message: '' });
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [formData.username, API_URL]);

  // Real-time email check
  useEffect(() => {
    if (!formData.email || !formData.email.includes('@')) {
      setEmailStatus({ checking: false, available: null, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setEmailStatus({ checking: true, available: null, message: '' });
      try {
        const res = await fetch(`${API_URL}/auth/check-availability?email=${encodeURIComponent(formData.email)}`);
        const data = await res.json();
        
        if (data.emailAvailable) {
          setEmailStatus({ checking: false, available: true, message: '✓ Email tersedia' });
        } else if (data.emailVerified) {
          setEmailStatus({ checking: false, available: false, message: '✗ Email sudah terdaftar' });
        } else {
          setEmailStatus({ checking: false, available: true, message: '⚠ Email belum terverifikasi, bisa digunakan' });
        }
      } catch (err) {
        setEmailStatus({ checking: false, available: null, message: '' });
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [formData.email, API_URL]);
  
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
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full border border-white/20 flex flex-col justify-center relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500"></div>
        
        {/* Logo or Icon Section */}
        <div className="text-center mb-6">
          <img src="/logo-icon.jpg" alt="CarbonTrack Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Mulai Sekarang!
          </h1>
          <p className="text-gray-600 text-sm">Bergabung dengan komunitas hijau</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input 
                name="username" 
                type="text" 
                value={formData.username} 
                required 
                onChange={handleChange} 
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition ${
                  usernameStatus.available === true ? 'border-emerald-500 bg-emerald-50/50 focus:ring-emerald-500' :
                  usernameStatus.available === false ? 'border-red-500 bg-red-50/50 focus:ring-red-500' :
                  'border-gray-200 bg-gray-50 hover:bg-white focus:ring-emerald-500'
                }`}
                placeholder="Username unik" 
              />
              {usernameStatus.available === true && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
            {usernameStatus.message && (
              <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${
                usernameStatus.available ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {usernameStatus.checking ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengecek...
                  </>
                ) : usernameStatus.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input 
                name="email" 
                type="email" 
                value={formData.email} 
                required 
                onChange={handleChange} 
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition ${
                  emailStatus.available === true ? 'border-emerald-500 bg-emerald-50/50 focus:ring-emerald-500' :
                  emailStatus.available === false ? 'border-red-500 bg-red-50/50 focus:ring-red-500' :
                  'border-gray-200 bg-gray-50 hover:bg-white focus:ring-emerald-500'
                }`}
                placeholder="nama@email.com" 
              />
              {emailStatus.available === true && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
            {emailStatus.message && (
              <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${
                emailStatus.available ? 'text-emerald-600' : 
                emailStatus.message.includes('⚠') ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {emailStatus.checking ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengecek...
                  </>
                ) : emailStatus.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                name="password" 
                type={showPassword ? "text" : "password"}
                value={formData.password} 
                required 
                onChange={handleChange} 
                className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-gray-50 hover:bg-white" 
                placeholder="Min. 6 karakter" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || usernameStatus.available === false || emailStatus.available === false} 
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3.5 rounded-xl font-bold hover:from-teal-700 hover:to-emerald-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transform hover:-translate-y-0.5 disabled:hover:translate-y-0 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : 'Buat Akun'}
          </button>
        </form>

        <div className="mt-5 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500 font-medium">Atau</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/auth/google-callback' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition duration-200 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-700">Daftar dengan Google</span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <button 
            onClick={onSwitch} 
            className="text-teal-600 font-bold hover:text-teal-700 bg-transparent border-none cursor-pointer transition hover:underline"
          >
            Masuk sekarang
          </button>
        </p>
      </div>
    );
  }

  // UI untuk verifikasi kode
  return (
    <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full border border-white/20 flex flex-col justify-center relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"></div>
      
      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
          Verifikasi Email
        </h1>
        <p className="text-gray-600 text-sm mb-1">
          Kode verifikasi telah dikirim ke
        </p>
        <p className="font-bold text-purple-600 text-sm">{formData.email}</p>
        <p className="text-xs text-gray-500 mt-2">Cek inbox atau folder spam</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
            Masukkan Kode 6 Digit
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            required
            autoFocus
            className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition text-center text-4xl font-black tracking-[0.5em] bg-gradient-to-br from-gray-50 to-white"
            placeholder="○ ○ ○ ○ ○ ○"
            style={{ letterSpacing: '0.5em' }}
          />
          <p className="text-xs text-center text-gray-500 mt-2">
            {verificationCode.length}/6 digit
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || verificationCode.length !== 6}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-0.5 disabled:hover:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memverifikasi...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verifikasi & Masuk
            </span>
          )}
        </button>
      </form>

      <div className="mt-6 bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl p-4 border border-purple-100">
        <div className="flex items-center justify-center gap-2 mb-3">
          <svg className={`w-5 h-5 ${countdown > 0 ? 'text-purple-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-700 font-medium">
            {countdown > 0 ? (
              <>Kadaluarsa dalam <span className="font-bold text-purple-600 text-lg">{formatTime(countdown)}</span></>
            ) : (
              <span className="text-red-600 font-bold">Kode telah kadaluarsa</span>
            )}
          </p>
        </div>
        
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white border-2 border-purple-200 text-purple-600 rounded-lg font-bold hover:border-purple-300 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mengirim...' : 'Kirim Ulang Kode'}
          </button>
        ) : (
          <p className="text-center text-xs text-gray-500">
            Kirim ulang tersedia dalam {formatTime(countdown)}
          </p>
        )}
      </div>

      <button
        onClick={() => setShowVerification(false)}
        className="mt-6 flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer font-medium transition group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Kembali ke form registrasi
      </button>
    </div>
  );
}