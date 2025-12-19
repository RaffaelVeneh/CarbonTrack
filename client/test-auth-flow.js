/**
 * 🔐 COMPLETE MIDDLEWARE PROTECTION TEST
 * Tests authentication flow with real login
 * 
 * Steps:
 * 1. Try to access protected page without login (should redirect)
 * 2. Login to get cookies
 * 3. Try to access protected page again (should succeed)
 * 4. Logout
 * 5. Try to access again (should redirect)
 */

const axios = require('axios');

const CLIENT_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5000';

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    title: (msg) => console.log(`\n${colors.cyan}${colors.bold}${msg}${colors.reset}`),
    test: (msg) => console.log(`\n${colors.yellow}🧪 ${msg}${colors.reset}`),
    pass: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    fail: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
};

/**
 * Test step-by-step authentication flow
 */
async function testCompleteFlow() {
    log.title('🔐 COMPLETE AUTHENTICATION FLOW TEST');
    
    // Check servers
    try {
        await axios.get(CLIENT_URL, { timeout: 5000 });
        log.pass('Next.js client is running');
    } catch (error) {
        log.fail(`Cannot connect to Next.js client at ${CLIENT_URL}`);
        log.info('Start client: cd client && npm run dev');
        process.exit(1);
    }
    
    try {
        await axios.get(API_URL, { timeout: 5000 });
        log.pass('Backend API is running');
    } catch (error) {
        log.fail(`Cannot connect to backend API at ${API_URL}`);
        log.info('Start server: cd server && npx nodemon index.js');
        process.exit(1);
    }
    
    // STEP 1: Try to access protected page WITHOUT login
    log.test('STEP 1: Access /leaderboard without authentication');
    try {
        const response = await axios.get(`${CLIENT_URL}/leaderboard`, {
            maxRedirects: 0,
            validateStatus: () => true
        });
        
        if (response.status === 307 || response.status === 308) {
            const location = response.headers.location;
            if (location && location.includes('/login')) {
                log.pass('Redirected to login page ✓');
                if (location.includes('from=')) {
                    log.info(`Return URL preserved: ${location}`);
                }
            } else {
                log.fail(`Redirected but not to login: ${location}`);
            }
        } else if (response.status === 200) {
            log.fail('Page accessible without login! SECURITY BREACH!');
            log.info('Middleware is not working. Check if:');
            log.info('1. middleware.js is in src/ folder');
            log.info('2. Next.js has been restarted after adding middleware');
            log.info('3. Cookies are being set properly after login');
        }
    } catch (error) {
        log.fail(`Error: ${error.message}`);
    }
    
    // STEP 2: Login to get authentication cookies
    log.test('STEP 2: Login with test credentials');
    log.info('Please enter credentials:');
    
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => readline.question(query, resolve));
    
    const email = await question('Email: ');
    const password = await question('Password: ');
    readline.close();
    
    try {
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password
        });
        
        if (loginResponse.data.accessToken) {
            log.pass('Login successful!');
            log.info('Access Token received');
            log.info('Refresh Token received');
            
            // STEP 3: Now try to access protected page with cookies
            log.test('STEP 3: Access /leaderboard WITH authentication');
            log.info('Open browser and check:');
            log.info('1. Login at http://localhost:3000/login');
            log.info('2. Try to access http://localhost:3000/leaderboard');
            log.info('3. You should see the leaderboard page (not redirected)');
            log.info('4. Try to access http://localhost:3000/login again');
            log.info('5. You should be redirected to /dashboard');
            
        } else {
            log.fail('Login failed: ' + (loginResponse.data.message || 'Unknown error'));
        }
    } catch (error) {
        if (error.response) {
            log.fail(`Login failed: ${error.response.data.message || 'Unknown error'}`);
        } else {
            log.fail(`Network error: ${error.message}`);
        }
    }
    
    log.title('📋 MANUAL TESTING CHECKLIST');
    console.log(`
${colors.bold}To verify middleware is working:${colors.reset}

${colors.yellow}1. WITHOUT LOGIN:${colors.reset}
   - Open incognito/private browser window
   - Navigate to: ${colors.cyan}http://localhost:3000/leaderboard${colors.reset}
   - Expected: ${colors.green}Redirect to /login?from=/leaderboard${colors.reset}
   - Actual: ${colors.red}If you see leaderboard, middleware NOT WORKING${colors.reset}

${colors.yellow}2. WITH LOGIN:${colors.reset}
   - In same incognito window, login at: ${colors.cyan}http://localhost:3000/login${colors.reset}
   - After login, you should be at: ${colors.cyan}http://localhost:3000/leaderboard${colors.reset}
   - Expected: ${colors.green}Leaderboard page visible${colors.reset}

${colors.yellow}3. LOGOUT:${colors.reset}
   - Logout from the app
   - Try to access: ${colors.cyan}http://localhost:3000/dashboard${colors.reset}
   - Expected: ${colors.green}Redirect to /login?from=/dashboard${colors.reset}

${colors.yellow}4. ALREADY LOGGED IN:${colors.reset}
   - While logged in, navigate to: ${colors.cyan}http://localhost:3000/login${colors.reset}
   - Expected: ${colors.green}Redirect to /dashboard${colors.reset}

${colors.bold}Why automated test might fail:${colors.reset}
- Axios doesn't preserve cookies between requests like a browser does
- Middleware works on server-side, test tool is client-side
- Need to test in actual browser to see real behavior

${colors.bold}If middleware still not working:${colors.reset}
1. Check browser console for errors
2. Check Network tab -> Response Headers for redirects
3. Check Application tab -> Cookies for 'token' cookie
4. Restart Next.js dev server: ${colors.cyan}npm run dev${colors.reset}
    `);
}

testCompleteFlow().catch(error => {
    log.fail(`Test failed: ${error.message}`);
    process.exit(1);
});
