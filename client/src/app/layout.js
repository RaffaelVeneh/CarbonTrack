'use client'; // Ubah jadi client component agar bisa cek pathname (untuk hide sidebar di login)

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";     // <--- 1. Import Sidebar
import { usePathname } from "next/navigation";  // <--- 2. Import usePathname

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Hapus export metadata jika file ini jadi 'use client'
// (Metadata bisa dipindah ke layout.js terpisah atau page.js jika perlu, 
// tapi untuk solusi cepat, hapus dulu biar gak error)

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Daftar halaman yang TIDAK boleh ada Sidebar (misal Login & Register)
  const disableSidebar = ["/", "/login", "/register"];

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex min-h-screen bg-gray-50">
          
          {/* Tampilkan Sidebar KECUALI di halaman Login/Register */}
          {!disableSidebar.includes(pathname) && <Sidebar />}

          {/* Area Konten Utama */}
          {/* Tambahkan margin kiri (ml-64) jika Sidebar aktif agar konten tidak tertutup */}
          {/* Khusus /assistant tidak pakai padding agar chat fullscreen */}
          <main className={`flex-1 transition-all duration-300 ${!disableSidebar.includes(pathname) ? "md:ml-0" : ""} ${pathname === '/assistant' ? '' : 'p-8'}`}>
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}