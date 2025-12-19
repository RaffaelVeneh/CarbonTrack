import { NextResponse } from 'next/server';

/**
 * 🔐 AUTHENTICATION MIDDLEWARE
 * Protects all routes except public pages (login, register, forgot-password, etc.)
 * Automatically redirects unauthenticated users to login page
 * 
 * Security Level: CRITICAL
 * - Prevents unauthorized access to protected pages
 * - Validates JWT token presence
 * - Preserves intended destination after login
 */

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // DEBUG: Log middleware execution
  console.log('🔐 Middleware executed for:', pathname);
  console.log('   Token present:', !!token);
  
  // =====================================
  // 🌐 PUBLIC ROUTES (No Auth Required)
  // =====================================
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/google-callback',
  ];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // =====================================
  // 🔓 Allow access to public routes
  // =====================================
  if (isPublicRoute) {
    // If user is already logged in and tries to access login/register, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // =====================================
  // 🔒 PROTECTED ROUTES (Auth Required)
  // =====================================
  // If no token, redirect to login with return URL
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Save intended destination
    return NextResponse.redirect(loginUrl);
  }
  
  // Token exists, allow access
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * Excludes static files, images, and Next.js internal routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
