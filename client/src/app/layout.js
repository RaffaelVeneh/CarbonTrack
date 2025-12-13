'use client'; // Ubah jadi client component agar bisa cek pathname (untuk hide sidebar di login)

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";     // <--- 1. Import Sidebar
import { usePathname } from "next/navigation";  // <--- 2. Import usePathname
import { BadgeProvider } from "@/contexts/BadgeContext"; // <--- 3. Import BadgeProvider
import { SessionProvider } from "next-auth/react"; // <--- 4. Import SessionProvider
import { ThemeProvider } from "@/contexts/ThemeContext"; // <--- 5. Import ThemeProvider
import Script from "next/script";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('dark');
                  const theme = localStorage.getItem('carbontrack_theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `
          }}
        />
        <SessionProvider>
          <ThemeProvider>
            <BadgeProvider>
              <div className="flex min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
              
              {/* Tampilkan Sidebar KECUALI di halaman Login/Register */}
              {!disableSidebar.includes(pathname) && <Sidebar />}

              {/* Area Konten Utama */}
              {/* Tambahkan margin kiri (ml-64) jika Sidebar aktif agar konten tidak tertutup */}
              {/* Khusus /assistant dan /login tidak pakai padding */}
              <main className={`flex-1 transition-all duration-300 ${!disableSidebar.includes(pathname) ? "md:ml-0" : ""} ${pathname === '/assistant' || pathname === '/login' ? '' : 'p-8'}`}>
                {children}
              </main>
              
              </div>
            </BadgeProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}