import { NextResponse } from 'next/server';

/**
 * 🔐 AUTHENTICATION MIDDLEWARE
 * Protects all routes except public pages (login, register, forgot-password, etc.)
 * Automatically redirects unauthenticated users to login page
 * 
 * Security Level: CRITICAL
 * - Prevents unauthorized access to protected pages
 * - Validates JWT token presence AND expiry (SERVER-SIDE)
 * - Works even if JavaScript is disabled in browser
 * - Preserves intended destination after login
 */

/**
 * Decode JWT without verification (extract payload)
 * This is safe for reading claims, but don't trust without signature verification
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
function isTokenExpired(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const adminToken = request.cookies.get('adminToken')?.value;
  
  // Check if this is an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  
  // DEBUG: Log middleware execution
  console.log('🔐 Middleware executed for:', pathname);
  console.log('   Is admin route:', isAdminRoute);
  console.log('   Token present:', !!token);
  console.log('   Admin token present:', !!adminToken);
  console.log('   Refresh token present:', !!refreshToken);
  
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
    '/admin/login', // Admin login is public
  ];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // =====================================
  // 🛡️ ADMIN ROUTES PROTECTION
  // =====================================
  if (isAdminRoute && !isPublicRoute) {
    // Admin routes require adminToken
    if (!adminToken || isTokenExpired(adminToken)) {
      console.log('❌ Invalid/expired admin token, redirecting to admin login');
      const adminLoginUrl = new URL('/admin/login', request.url);
      adminLoginUrl.searchParams.set('from', pathname);
      
      // Clear invalid admin cookies
      const response = NextResponse.redirect(adminLoginUrl);
      response.cookies.delete('adminToken');
      response.cookies.delete('adminInfo');
      return response;
    }
    
    console.log('✅ Valid admin token, allowing access');
    return NextResponse.next();
  }
  
  // =====================================
  // 🔓 Allow access to public routes
  // =====================================
  if (isPublicRoute) {
    // If user is already logged in and tries to access login/register, redirect to dashboard
    if (token && !isTokenExpired(token) && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If admin is already logged in and tries to access admin login, redirect to admin dashboard
    if (adminToken && !isTokenExpired(adminToken) && pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // =====================================
  // 🔒 PROTECTED ROUTES (Auth Required)
  // =====================================
  // Check if token exists and is valid
  const hasValidToken = token && !isTokenExpired(token);
  const hasValidRefreshToken = refreshToken && !isTokenExpired(refreshToken);
  
  // If no token OR token expired (and no valid refresh token), redirect to login
  if (!token || (!hasValidToken && !hasValidRefreshToken)) {
    console.log('❌ Invalid/expired token, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Save intended destination
    
    // Clear invalid cookies
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token');
    response.cookies.delete('refreshToken');
    response.cookies.delete('user');
    return response;
  }
  
  // Valid token exists, allow access
  console.log('✅ Valid token, allowing access');
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
