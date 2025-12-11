'use client';

import { Lock, HelpCircle } from 'lucide-react';

const TIER_COLORS = {
  bronze: 'bg-orange-100 text-orange-700 border-orange-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  diamond: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  legendary: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function BadgeCollection({ badges }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
        <Lock size={48} className="mb-2 opacity-50" />
        <p>Belum ada data badge.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map((badge) => (
        <div 
          key={badge.id}
          className={`relative group p-5 rounded-2xl border-2 transition-all duration-300
            ${badge.unlocked 
                ? 'bg-white border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-400 hover:-translate-y-1' 
                : 'bg-gray-50 border-gray-200' 
            }`}
        >
          
          {/* LAYER GEMBOK (Overlay jika terkunci) */}
          {!badge.unlocked && (
            <div className="absolute inset-0 bg-gray-100/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl transition-opacity group-hover:bg-gray-100/30">
               <div className="bg-white p-3 rounded-full text-gray-400 mb-2 shadow-sm">
                  <Lock size={20} />
               </div>
               <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest bg-white/80 px-2 py-1 rounded">Terkunci</span>
            </div>
          )}

          {/* KONTEN BADGE */}
          <div className={`flex flex-col items-center text-center ${!badge.unlocked ? 'grayscale opacity-60' : ''}`}>
            
            {/* Icon Besar */}
            <div className="text-5xl mb-4 drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300">
                {badge.icon}
            </div>

            {/* Nama Badge */}
            <h3 className={`font-bold text-sm mb-2 line-clamp-1 ${badge.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                {badge.name}
            </h3>

            {/* Label Tier */}
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 
                ${TIER_COLORS[badge.tier] || 'bg-gray-100 text-gray-500'}
            `}>
                {badge.tier}
            </span>

            {/* Deskripsi / Tanggal */}
            <div className="text-xs text-gray-500 leading-snug w-full pt-3 border-t border-dashed border-gray-200">
                {badge.unlocked 
                    ? <span className="text-emerald-600 font-semibold block">
                        Didapat: {new Date(badge.unlocked_at || badge.earned_at).toLocaleDateString('id-ID')}
                      </span>
                    : <span className="block italic">Syarat: {badge.description}</span>
                }
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}