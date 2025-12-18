'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; 
import { Leaf, ArrowRight, Activity, Award, Zap } from 'lucide-react';
import { isAuthenticated, getUserData } from '@/utils/auth';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in with JWT
    if (isAuthenticated()) {
      const user = getUserData();
      if (user && user.id) {
        console.log('User authenticated with JWT, redirecting to dashboard...');
        router.push('/dashboard');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        
        {/* LOGO */}
        <div className="flex items-center gap-3">
           <Image 
              src="/logo-icon.jpg"   
              alt="CarbonTrack Icon"
              width={50}        
              height={50}
              className="object-contain"
           />
           <div className="flex items-baseline leading-none select-none">
                <span className="text-2xl font-extrabold text-gray-700 tracking-tight">
                    Carbon
                </span>
                <span className="text-2xl font-medium text-emerald-500 ml-0.5">
                    Tracker
                </span>
           </div>
        </div>

        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-2 text-gray-600 font-semibold hover:text-emerald-600 transition">
            Masuk
          </Link>
          {/* UBAH DI SINI: Tambahkan ?mode=register */}
          <Link href="/login?mode=register" className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
            Daftar Sekarang
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="max-w-7xl mx-auto px-8 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <div className="inline-block px-4 py-1.5 bg-green-50 text-emerald-700 font-bold rounded-full text-sm border border-emerald-100">
            🌱 #1 Aplikasi Pelacak Jejak Karbon Gen Z
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight">
            Ubah Kebiasaan,<br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Selamatkan Bumi.
            </span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
            Pantau emisi harianmu, selesaikan misi lingkungan, dan rawat pulau virtualmu agar tetap subur. Langkah kecilmu berdampak besar!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            
            {/* PERBAIKAN: Ubah href="/register" jadi "/login" */}
            <Link href="/login?mode=register" className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-2">
              Mulai Petualangan <ArrowRight size={20}/>
            </Link>
            
            <Link href="/login" className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition text-center">
              Sudah Punya Akun?
            </Link>
          </div>
        </div>

        {/* Ilustrasi Hero (Kanan) */}
        <div className="flex-1 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -left-4 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="relative bg-white/50 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-2xl">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">🌳</div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Status Pulau: Subur</h3>
                        <div className="w-48 h-3 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-emerald-500 w-4/5"></div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <Activity className="text-orange-500"/>
                        <div>
                            <p className="text-xs text-gray-400">Emisi Hari Ini</p>
                            <p className="font-bold text-gray-800">2.4 kg CO2</p>
                        </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Aman</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-gray-500">Kenapa Carbon Tracker beda dari yang lain?</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity size={32} className="text-blue-500"/>}
              title="Pelacak Real-time"
              desc="Hitung jejak karbon dari transportasi, listrik, hingga makanan secara otomatis."
            />
            <FeatureCard 
              icon={<Award size={32} className="text-yellow-500"/>}
              title="Gamifikasi Seru"
              desc="Rawat pohon virtualmu. Jika emisimu tinggi, pohon akan layu. Jika rendah, ia berbunga!"
            />
            <FeatureCard 
              icon={<Zap size={32} className="text-purple-500"/>}
              title="AI Eco Assistant"
              desc="Bingung cara hemat energi? Tanya EcoBot dan dapatkan tips instan."
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-100 py-12 text-center">
        <p className="text-gray-400 font-medium">© 2025 Carbon Tracker Project. Dibuat oleh Tim "nama timnya apa ya".</p>
      </footer>
    </div>
  );
}

// Komponen Kecil untuk Card Fitur
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition hover:-translate-y-1">
      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}