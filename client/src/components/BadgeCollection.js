'use client';

import { Lock, HelpCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const TIER_COLORS = {
  bronze: 'bg-orange-100 text-orange-700 border-orange-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-200',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  diamond: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  legendary: 'bg-purple-100 text-purple-700 border-purple-200',
};

const TIER_COLORS_POPUP = {
  bronze: 'from-orange-500 to-orange-600',
  silver: 'from-slate-500 to-slate-600',
  gold: 'from-yellow-500 to-yellow-600',
  diamond: 'from-cyan-500 to-cyan-600',
  legendary: 'from-purple-500 to-purple-600',
};

export default function BadgeCollection({ badges }) {
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  if (!badges || badges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
        <Lock size={48} className="mb-2 opacity-50" />
        <p>Belum ada data badge.</p>
      </div>
    );
  }

  const handleMouseEnter = (badge, event) => {
    if (!badge.unlocked) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top - 10,
      left: rect.left + rect.width / 2
    });
    setHoveredBadge(badge.id);
  };

  const currentBadge = badges.find(b => b.id === hoveredBadge);

  return (
    <div className="relative">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-visible">
      {badges.map((badge) => (
        <div 
          key={badge.id}
          className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 overflow-visible
            ${badge.unlocked 
                ? 'bg-white border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-400 hover:-translate-y-1 cursor-pointer' 
                : 'bg-gray-50 border-gray-200' 
            }`}
          onMouseEnter={(e) => handleMouseEnter(badge, e)}
          onMouseLeave={() => setHoveredBadge(null)}
        >
          
          {/* LAYER GEMBOK (Overlay HANYA pada icon & nama - tidak semua konten) */}
          {!badge.unlocked ? (
            <div className="absolute top-0 left-0 right-0 h-32 bg-gray-100/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-t-2xl transition-opacity group-hover:bg-gray-100/30">
               <div className="bg-white p-3 rounded-full text-gray-400 mb-2 shadow-sm">
                  <Lock size={20} />
               </div>
               <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest bg-white/80 px-2 py-1 rounded">Terkunci</span>
            </div>
          ) : null}

          {/* KONTEN BADGE */}
          <div className="flex flex-col items-center text-center">
            
            {/* Icon Besar - Grayscale jika terkunci */}
            <div className={`text-5xl mb-4 drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300 ${!badge.unlocked ? 'grayscale opacity-40' : ''}`}>
                {badge.icon}
            </div>

            {/* Nama Badge */}
            <h3 className={`font-bold text-sm mb-2 line-clamp-1 ${badge.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                {badge.name}
            </h3>

            {/* Label Tier */}
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 
                ${badge.unlocked 
                    ? TIER_COLORS[badge.tier] || 'bg-gray-100 text-gray-500'
                    : 'bg-gray-200 text-gray-500'
                }
            `}>
                {badge.tier}
            </span>

            {/* Deskripsi / Tanggal - TIDAK BLUR untuk badge terkunci */}
            <div className="text-xs leading-snug w-full pt-3 border-t border-dashed border-gray-200 relative z-20">
                {badge.unlocked 
                    ? <span className="text-emerald-600 font-semibold block">
                        ✓ Didapat: {new Date(badge.unlocked_at || badge.earned_at).toLocaleDateString('id-ID')}
                      </span>
                    : <span className="block text-gray-600 font-medium">
                        🎯 Syarat: {badge.description}
                      </span>
                }
            </div>

          </div>

        </div>
      ))}
      </div>

      {/* TOOLTIP POPUP - Fixed position di luar grid untuk z-index tertinggi */}
      {hoveredBadge && currentBadge && (
        <div 
          className="fixed z-[99999] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className={`bg-gradient-to-r ${TIER_COLORS_POPUP[currentBadge.tier] || 'from-gray-500 to-gray-600'} text-white px-4 py-3 rounded-xl shadow-2xl min-w-[250px] max-w-[300px]`}>
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm mb-1">Syarat Pencapaian:</p>
                <p className="text-xs leading-relaxed opacity-95">{currentBadge.description}</p>
              </div>
            </div>
            {/* Arrow */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent ${currentBadge.tier === 'bronze' ? 'border-t-orange-600' : currentBadge.tier === 'silver' ? 'border-t-slate-600' : currentBadge.tier === 'gold' ? 'border-t-yellow-600' : currentBadge.tier === 'diamond' ? 'border-t-cyan-600' : 'border-t-purple-600'}`}></div>
          </div>
        </div>
      )}
    </div>
  );
}