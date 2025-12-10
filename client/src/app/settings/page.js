'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Save, User, Mail, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setFormData({ username: storedUser.username, email: storedUser.email });
    }
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const storedUser = JSON.parse(localStorage.getItem('user'));

    try {
      const res = await fetch(`${API_URL}/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            userId: storedUser.id,
            username: formData.username,
            email: formData.email 
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Sukses! Profil diperbarui.');
        // Update localStorage biar nama di sidebar berubah
        const updatedUser = { ...storedUser, username: formData.username, email: formData.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Refresh halaman biar kelihatan
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage('Gagal memperbarui profil.');
      }
    } catch (err) {
      setMessage('Terjadi kesalahan server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Akun ⚙️</h1>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl">
          <form onSubmit={handleUpdate} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20}/>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20}/>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Password (Disable dulu biar simple) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative opacity-50 cursor-not-allowed">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20}/>
                <input 
                  type="password" 
                  value="********"
                  disabled
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Ganti password belum tersedia saat ini.</p>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('Sukses') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <Save size={20}/> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}