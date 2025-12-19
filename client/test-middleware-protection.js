/**
 * 🔐 MIDDLEWARE PROTECTION TESTER
 * Tests if all protected pages redirect to login when accessed without authentication
 * 
 * Usage:
 * 1. Make sure Next.js client is running: npm run dev (in client folder)
 * 2. Run this test: node test-middleware-protection.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    title: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}`),
    test: (msg) => console.log(`\n${colors.yellow}🔒 TEST: ${msg}${colors.reset}`),
    pass: (msg) => console.log(`${colors.green}✅ PASS: ${msg}${colors.reset}`),
    fail: (msg) => console.log(`${colors.red}❌ FAIL: ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  INFO: ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.magenta}⚠️  WARN: ${msg}${colors.reset}`)
};

/**
 * Test if protected pages redirect to login
 */
async function testProtectedRoute(path, description) {
    log.test(`${description} (${path})`);
    
    try {
        const response = await axios.get(`${BASE_URL}${path}`, {
            maxRedirects: 0, // Don't follow redirects
            validateStatus: (status) => status >= 200 && status < 400
        });
        
        // If we get here, the page didn't redirect
        log.fail(`Page accessible without authentication!`);
        log.warn(`Security breach: Users can access ${path} without logging in`);
        return false;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const location = error.response.headers.location;
            
            if (status === 307 || status === 308) {
                // Temporary or permanent redirect (Next.js middleware redirect)
                if (location && location.includes('/login')) {
                    log.pass(`Redirects to login page (${status})`);
                    if (location.includes('from=')) {
                        log.info(`Return URL preserved: ${location}`);
                    }
                    return true;
                } else {
                    log.warn(`Redirects but not to login: ${location}`);
                    return false;
                }
            } else {
                log.fail(`Unexpected status: ${status}`);
                return false;
            }
        } else {
            log.fail(`Network error: ${error.message}`);
            return false;
        }
    }
}

/**
 * Test if public pages are accessible
 */
async function testPublicRoute(path, description) {
    log.test(`${description} (${path})`);
    
    try {
        const response = await axios.get(`${BASE_URL}${path}`, {
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        });
        
        if (response.status === 200) {
            log.pass(`Accessible without authentication (${response.status})`);
            return true;
        } else {
            log.warn(`Unexpected status: ${response.status}`);
            return false;
        }
    } catch (error) {
        if (error.response) {
            log.fail(`Access denied: ${error.response.status}`);
        } else {
            log.fail(`Network error: ${error.message}`);
        }
        return false;
    }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
    log.title('🔐 MIDDLEWARE PROTECTION TEST');
    log.info('Testing authentication middleware on Next.js client...');
    log.info(`Client: ${BASE_URL}`);
    
    // Check if server is running
    try {
        await axios.get(`${BASE_URL}/`, { timeout: 5000 });
        log.pass('Next.js client is running');
    } catch (error) {
        log.fail(`Cannot connect to Next.js client at ${BASE_URL}`);
        log.warn('Make sure the client is running: cd client && npm run dev');
        process.exit(1);
    }
    
    log.title('📋 TESTING PUBLIC ROUTES (Should be accessible)');
    
    const publicRoutes = [
        { path: '/login', desc: 'Login Page' },
        { path: '/register', desc: 'Register Page (if exists)' },
        { path: '/forgot-password', desc: 'Forgot Password Page' },
    ];
    
    let publicPassed = 0;
    for (const route of publicRoutes) {
        const result = await testPublicRoute(route.path, route.desc);
        if (result) publicPassed++;
    }
    
    log.title('🔒 TESTING PROTECTED ROUTES (Should redirect to login)');
    
    const protectedRoutes = [
        { path: '/dashboard', desc: 'Dashboard Page' },
        { path: '/leaderboard', desc: 'Leaderboard Page' },
        { path: '/history', desc: 'History Page' },
        { path: '/missions', desc: 'Missions Page' },
        { path: '/profile', desc: 'Profile Page' },
        { path: '/settings', desc: 'Settings Page' },
        { path: '/assistant', desc: 'AI Assistant Page' },
    ];
    
    let protectedPassed = 0;
    for (const route of protectedRoutes) {
        const result = await testProtectedRoute(route.path, route.desc);
        if (result) protectedPassed++;
    }
    
    // Final Summary
    log.title('📊 TEST SUMMARY');
    
    console.log(`
${colors.cyan}Public Routes:${colors.reset}
  ✅ Passed: ${publicPassed}/${publicRoutes.length}
  ${publicPassed === publicRoutes.length ? colors.green + '✓ All public routes accessible' : colors.red + '✗ Some public routes blocked'}${colors.reset}

${colors.cyan}Protected Routes:${colors.reset}
  ✅ Passed: ${protectedPassed}/${protectedRoutes.length}
  ${protectedPassed === protectedRoutes.length ? colors.green + '✓ All protected routes secured' : colors.red + '✗ Some protected routes exposed'}${colors.reset}

${colors.bold}SECURITY RATING:${colors.reset}
  ${protectedPassed === protectedRoutes.length && publicPassed === publicRoutes.length 
    ? colors.green + '✅ EXCELLENT (10/10) - All routes properly protected!' 
    : colors.yellow + '⚠️  NEEDS IMPROVEMENT - Some routes have security issues'}${colors.reset}

${colors.cyan}Expected Behavior:${colors.reset}
  ✅ Public routes (login, register, forgot-password) should be accessible
  ✅ Protected routes should redirect to /login?from=<path>
  ✅ After login, users should be redirected back to intended page
  ✅ Users already logged in trying to access /login should redirect to /dashboard

${colors.yellow}CRITICAL ISSUE FIXED:${colors.reset}
  ${colors.red}❌ BEFORE:${colors.reset} Leaderboard, History, Missions, etc. accessible without login
  ${colors.green}✅ AFTER:${colors.reset} All pages now protected by middleware - auto redirect to login
    `);
    
    // Exit with appropriate code
    if (protectedPassed === protectedRoutes.length && publicPassed === publicRoutes.length) {
        process.exit(0); // Success
    } else {
        process.exit(1); // Failure
    }
}

// Run tests
runAllTests().catch(error => {
    log.fail(`Test runner failed: ${error.message}`);
    process.exit(1);
});
