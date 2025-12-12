'use client';

import { Sparkles, Heart } from 'lucide-react';

export default function EcoPlant({ plantHealth = 0 }) {
  
  // 1. Logika Tahapan berdasarkan health (0-20, 21-40, 41-60, 61-80, 81-100+)
  const getStage = (health) => {
    if (health === 0) return 0;      // Pot Kosong (0)
    if (health <= 20) return 1;      // Benih Muncul (1-20)
    if (health <= 40) return 2;      // Tunas Hijau (21-40)
    if (health <= 60) return 3;      // Kuncup Bunga (41-60)
    if (health <= 80) return 4;      // Siap Berbunga (61-80)
    return 5;                        // Bunga Mekar (81+)
  };

  const stage = getStage(plantHealth);
  
  // Health range untuk setiap stage
  const getHealthRange = () => {
    if (stage === 0) return { min: 0, max: 0, next: 20 };
    if (stage === 1) return { min: 0, max: 20, next: 20 };
    if (stage === 2) return { min: 21, max: 40, next: 40 };
    if (stage === 3) return { min: 41, max: 60, next: 60 };
    if (stage === 4) return { min: 61, max: 80, next: 80 };
    return { min: 81, max: 100, next: 100 };
  };

  const healthRange = getHealthRange();
  const progressPercent = stage === 0 ? 0 : Math.min(100, ((plantHealth - healthRange.min) / (healthRange.max - healthRange.min)) * 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100 flex flex-col h-full relative overflow-hidden">
      
      {/* Background Langit */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-white pointer-events-none"></div>

      {/* --- HEADER TEKS --- */}
      <div className="relative z-10 text-center mb-2">
        <h3 className="font-extrabold text-gray-800 text-lg">
            {stage === 0 && "Pot Kosong"}
            {stage === 1 && "Benih Kecil"}
            {stage === 2 && "Tunas Hijau"}
            {stage === 3 && "Kuncup Bunga"}
            {stage === 4 && "Siap Berbunga"}
            {stage === 5 && "Bunga Matahari"}
        </h3>
        <p className="text-xs text-gray-500">
            {stage < 5 ? "Selesaikan misi harian untuk tumbuh!" : "Kamu hebat! Panen berhasil."}
        </p>
        
        {/* Progress Stage Bar - PINDAH KE ATAS (Jadi kecil & pendek) */}
        <div className="mt-3 flex justify-center">
          {stage < 5 ? (
              <div className="max-w-[180px] w-full">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <span>Stage</span>
                      <span>{plantHealth}/{healthRange.next}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                      <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-700 ease-out" 
                          style={{ width: `${progressPercent}%` }}
                      ></div>
                  </div>
              </div>
          ) : (
              <div className="text-center bg-yellow-100/50 px-4 py-1.5 rounded-lg border border-yellow-200">
                  <p className="text-xs font-bold text-yellow-700">🌻 Mekar!</p>
              </div>
          )}
        </div>
      </div>

      {/* --- AREA GAMBAR (SVG TUNGGAL - PRESISI) --- */}
      <div className="relative z-10 flex-1 flex items-end justify-center pb-2 overflow-hidden">
        
        {/* Kanvas SVG Ukuran 200x200 (Agar proporsional) */}
        <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-lg transition-all duration-500" style={{ overflow: 'visible' }}>
            
            {/* 1. TANAH (Paling Belakang - Selalu Ada) */}
            <ellipse cx="100" cy="160" rx="35" ry="10" fill="#5D4037" />

            {/* 2. LOGIKA TUMBUH (Layer Tengah - Semua Tanaman) */}
            
            {/* STAGE 1: Benih Kecil (Muncul sedikit) */}
            <g className={`transition-all duration-700 ease-out origin-bottom ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} transform="translate(100, 155)">
                <path d="M0,0 Q0,-15 -10,-20" stroke="#4ADE80" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M0,0 Q0,-15 10,-18" stroke="#4ADE80" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>

            {/* STAGE 2: Tunas Tinggi (Batang + Daun Besar) */}
            <g className={`transition-all duration-700 ease-out origin-bottom delay-100 ${stage >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} transform="translate(100, 155)">
                {/* Batang Utama */}
                <path d="M0,0 L0,-50" stroke="#16A34A" strokeWidth="5" strokeLinecap="round" />
                {/* Daun Kiri */}
                <path d="M0,-30 Q-20,-40 -25,-25 Q-15,-20 0,-30" fill="#22C55E" />
                {/* Daun Kanan */}
                <path d="M0,-40 Q20,-50 25,-35 Q15,-30 0,-40" fill="#22C55E" />
            </g>

            {/* STAGE 3: Kuncup & Daun Rimbun */}
            <g className={`transition-all duration-700 ease-out origin-bottom delay-200 ${stage >= 3 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} transform="translate(100, 155)">
                {/* Perpanjang Batang */}
                <path d="M0,-50 L0,-80" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
                {/* Daun Tambahan */}
                <path d="M0,-60 Q-30,-70 -35,-55 Q-20,-50 0,-60" fill="#16A34A" />
                <path d="M0,-70 Q30,-80 35,-65 Q20,-60 0,-70" fill="#16A34A" />
                {/* Kuncup Hijau */}
                <circle cx="0" cy="-85" r="8" fill="#86EFAC" />
            </g>

            {/* STAGE 4: Bunga Setengah Mekar */}
            <g className={`transition-all duration-700 ease-out delay-250 ${stage >= 4 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} transform="translate(100, 75)" style={{ transformOrigin: '100px 155px' }}>
                <circle cx="0" cy="-25" r="8" fill="#FBBF24" opacity="0.7" />
                <circle cx="15" cy="-15" r="8" fill="#FBBF24" opacity="0.7" />
                <circle cx="20" cy="0" r="8" fill="#FBBF24" opacity="0.7" />
                <circle cx="-15" cy="-15" r="8" fill="#FBBF24" opacity="0.7" />
                <circle cx="-20" cy="0" r="8" fill="#FBBF24" opacity="0.7" />
                <circle cx="0" cy="0" r="12" fill="#78350F" />
            </g>

            {/* STAGE 5: BUNGA MEKAR PENUH */}
            <g className={`transition-all duration-700 ease-out delay-250 ${stage >= 5 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} transform="translate(100, 70)" style={{ transformOrigin: '100px 155px' }}>
                {/* Kelopak Bunga Matahari (Animasi float lebih halus tanpa rotate) */}
                <g>
                        <circle cx="0" cy="-25" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" repeatCount="indefinite" additive="sum" />
                        </circle>
                        <circle cx="18" cy="-18" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" begin="0.2s" repeatCount="indefinite" additive="sum" />
                        </circle>
                        <circle cx="25" cy="0" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" begin="0.4s" repeatCount="indefinite" additive="sum" />
                        </circle>
                        <circle cx="18" cy="18" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" begin="0.6s" repeatCount="indefinite" additive="sum" />
                        </circle>
                        <circle cx="0" cy="25" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" begin="0.8s" repeatCount="indefinite" additive="sum" />
                        </circle>
                        <circle cx="-18" cy="18" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" begin="1s" repeatCount="indefinite" additive="sum" />
                        </circle>
                        <circle cx="-25" cy="0" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" begin="1.2s" repeatCount="indefinite" additive="sum" />
                        </circle>
                        <circle cx="-18" cy="-18" r="10" fill="#FBBF24">
                            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="2s" begin="1.4s" repeatCount="indefinite" additive="sum" />
                        </circle>
                    </g>
                {/* Pusat Bunga */}
                <circle cx="0" cy="0" r="15" fill="#78350F" stroke="#92400E" strokeWidth="2" />
                
                {/* Efek Kilau */}
                <circle cx="5" cy="-5" r="3" fill="white" opacity="0.3">
                    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                </circle>
            </g>

            {/* 3. POT (Paling Depan - Selalu Ada) */}
            <path d="M70,160 L130,160 L120,190 L80,190 Z" fill="#D84315" /> {/* Badan Bawah */}
            <rect x="65" y="150" width="70" height="15" rx="3" fill="#BF360C" /> {/* Bibir Pot */}

        </svg>

        {/* Partikel Sparkles (Jika sudah mekar penuh) */}
        {stage === 5 && (
            <div className="absolute top-10 right-10 animate-pulse">
                <Sparkles className="text-yellow-400" size={24} />
            </div>
        )}
      </div>

      {/* --- FOOTER: HEALTH BAR --- PINDAH KE BAWAH (Jadi panjang) */}
      <div className="relative z-10 mt-auto">
        <div className="flex items-center gap-2">
          <Heart className="text-red-500 flex-shrink-0" size={18} fill="currentColor" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
              <span>Nyawa Bunga</span>
              <span className="text-red-500">{plantHealth} HP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300">
              <div 
                className="bg-gradient-to-r from-red-500 to-pink-500 h-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (plantHealth / 100) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-gray-400 mt-1 text-center">
              {plantHealth < 25 ? '⚠️ Nyawa rendah! Kerjakan misi harian.' : 
               plantHealth < 50 ? 'Jaga kesehatan bungamu!' :
               plantHealth < 75 ? 'Bunga tumbuh sehat!' :
               '💚 Bunga sangat sehat!'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}