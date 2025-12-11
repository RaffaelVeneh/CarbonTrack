'use client';

import { Sparkles } from 'lucide-react';

export default function EcoPlant({ completedCount }) {
  
  // 1. Logika Tahapan (0 - 4)
  const getStage = (count) => {
    if (count === 0) return 0; // Pot Kosong
    if (count <= 2) return 1;  // Benih Muncul
    if (count <= 5) return 2;  // Tunas Berdaun
    if (count <= 9) return 3;  // Kuncup Bunga
    return 4;                  // Bunga Mekar (Sunflower)
  };

  const stage = getStage(completedCount);
  
  // Target Misi Berikutnya
  const getNextGoal = () => {
    if (stage === 0) return 1;
    if (stage === 1) return 3;
    if (stage === 2) return 6;
    if (stage === 3) return 10;
    return 10;
  };

  const nextGoal = getNextGoal();
  const progressPercent = Math.min(100, (completedCount / nextGoal) * 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100 flex flex-col h-full relative overflow-hidden">
      
      {/* Background Langit */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-white pointer-events-none"></div>

      {/* --- HEADER TEKS --- */}
      <div className="relative z-10 text-center mb-4">
        <h3 className="font-extrabold text-gray-800 text-lg">
            {stage === 0 && "Pot Kosong"}
            {stage === 1 && "Benih Kecil"}
            {stage === 2 && "Tunas Hijau"}
            {stage === 3 && "Siap Berbunga"}
            {stage === 4 && "Bunga Matahari"}
        </h3>
        <p className="text-xs text-gray-500">
            {stage < 4 ? "Selesaikan misi agar aku tumbuh!" : "Kamu hebat! Panen berhasil."}
        </p>
      </div>

      {/* --- AREA GAMBAR (SVG TUNGGAL - PRESISI) --- */}
      <div className="relative z-10 flex-1 flex items-end justify-center pb-2">
        
        {/* Kanvas SVG Ukuran 200x200 (Agar proporsional) */}
        <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-lg transition-all duration-500">
            
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

            {/* STAGE 4: BUNGA MEKAR */}
            <g className={`transition-all duration-1000 ease-elastic delay-300 ${stage >= 4 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} transform="translate(100, 70)">
                {/* Kelopak Bunga Matahari (Berputar pelan) */}
                <g className="animate-spin-slow origin-center">
                    <circle cx="0" cy="-25" r="10" fill="#FBBF24" />
                    <circle cx="18" cy="-18" r="10" fill="#FBBF24" />
                    <circle cx="25" cy="0" r="10" fill="#FBBF24" />
                    <circle cx="18" cy="18" r="10" fill="#FBBF24" />
                    <circle cx="0" cy="25" r="10" fill="#FBBF24" />
                    <circle cx="-18" cy="18" r="10" fill="#FBBF24" />
                    <circle cx="-25" cy="0" r="10" fill="#FBBF24" />
                    <circle cx="-18" cy="-18" r="10" fill="#FBBF24" />
                </g>
                {/* Pusat Bunga */}
                <circle cx="0" cy="0" r="15" fill="#78350F" stroke="#92400E" strokeWidth="2" />
                
                {/* Efek Kilau */}
                <circle cx="5" cy="-5" r="3" fill="white" opacity="0.3" />
            </g>

            {/* 3. POT (Paling Depan - Selalu Ada) */}
            <path d="M70,160 L130,160 L120,190 L80,190 Z" fill="#D84315" /> {/* Badan Bawah */}
            <rect x="65" y="150" width="70" height="15" rx="3" fill="#BF360C" /> {/* Bibir Pot */}

        </svg>

        {/* Partikel Sparkles (Jika sudah panen) */}
        {stage === 4 && (
            <div className="absolute top-10 right-10 animate-pulse">
                <Sparkles className="text-yellow-400" size={24} />
            </div>
        )}
      </div>

      {/* --- FOOTER: PROGRESS BAR --- */}
      <div className="relative z-10 mt-auto">
        {stage < 4 ? (
            <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <span>Exp Tanaman</span>
                    <span>{completedCount}/{nextGoal}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                    <div 
                        className="bg-emerald-500 h-full transition-all duration-700 ease-out" 
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
        ) : (
            <div className="text-center bg-yellow-100/50 p-2 rounded-xl border border-yellow-200">
                <p className="text-xs font-bold text-yellow-700">🌻 Siap Panen!</p>
            </div>
        )}
      </div>

    </div>
  );
}