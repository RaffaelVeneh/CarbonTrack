'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Target, Award, Users, Bot, LogOut, Settings } from 'lucide-react'; 
// Note: Icon FileText dihapus karena menu sertifikat tidak dipakai

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Misi & Poin', href: '/missions', icon: Target },
    { name: 'Leaderboard', href: '/leaderboard', icon: Award },
    { name: 'Profil', href: '/profile', icon: Users },
    { name: 'Eco AI', href: '/assistant', icon: Bot },
    { name: 'Pengaturan', href: '/settings', icon: Settings }
    // Menu Sertifikat sudah dihapus dari sini
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
          🌿 CarbonTrack
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-lg font-medium transition"
        >
          <LogOut size={20} />
          Keluar
        </button>
      </div>
    </div>
  );
}