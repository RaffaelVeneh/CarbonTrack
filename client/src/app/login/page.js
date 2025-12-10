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
  const searchParams = useSearchParams();
  const [isFlipped, setIsFlipped] = useState(false);

  // LOGIKA BARU: Cek URL saat halaman dibuka
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsFlipped(true); // Langsung balik kartu ke Register
    }
  }, [searchParams]);

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
          <input name="email" type="email" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="nama@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition" placeholder="••••••••" />
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
// 2. KOMPONEN REGISTER (Tetap Sama)
// ==========================================
function RegisterForm({ onSwitch }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) setShowSuccessModal(true);
      else setError(data.message || 'Terjadi kesalahan');
    } catch (err) { setError('Gagal menghubungi server'); } finally { setLoading(false); }
  };

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
          <input name="username" type="text" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="Username" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="nama@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition duration-200 mt-2">
          {loading ? 'Memproses...' : 'Daftar Akun'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <button onClick={onSwitch} className="text-emerald-600 font-semibold hover:underline bg-transparent border-none cursor-pointer">
          Masuk disini
        </button>
      </p>

      {/* MODAL SUKSES */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-300 [transform:rotateY(0deg)]">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Registrasi Berhasil! 🎉</h3>
            <p className="text-gray-500 mb-6 text-sm">Akunmu telah dibuat. Silakan login.</p>
            <button onClick={() => { setShowSuccessModal(false); onSwitch(); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition">
              Lanjut Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}