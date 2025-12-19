/**
 * 🙈 ERROR HIDING TESTER
 * Tests error response behavior in production vs development mode
 * 
 * Usage:
 * 1. Start server in DEVELOPMENT mode: npm run dev
 *    - Should see stack traces in error responses
 * 2. Start server in PRODUCTION mode: NODE_ENV=production npm start
 *    - Should see generic messages only (no stack traces)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

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
    test: (msg) => console.log(`\n${colors.yellow}🧪 TEST: ${msg}${colors.reset}`),
    pass: (msg) => console.log(`${colors.green}✅ PASS: ${msg}${colors.reset}`),
    fail: (msg) => console.log(`${colors.red}❌ FAIL: ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  INFO: ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.magenta}⚠️  WARN: ${msg}${colors.reset}`)
};

/**
 * Test 404 Error (Route Not Found)
 */
async function test404Error() {
    log.test('404 Error - Invalid Route');
    
    try {
        await axios.get(`${BASE_URL}/api/nonexistent-route`);
        log.fail('Should have returned 404 error');
    } catch (error) {
        if (error.response && error.response.status === 404) {
            const data = error.response.data;
            
            log.pass(`Returned 404 status code`);
            log.info(`Message: "${data.message}"`);
            
            // Check if error contains sensitive information
            if (data.stack || data.path) {
                log.warn('DEVELOPMENT MODE: Stack trace exposed (normal for dev)');
            } else {
                log.pass('PRODUCTION MODE: No stack trace (secure)');
            }
        } else {
            log.fail(`Unexpected error: ${error.message}`);
        }
    }
}

/**
 * Test Invalid Request (Validation Error)
 */
async function testValidationError() {
    log.test('Validation Error - Invalid Input');
    
    try {
        // Try to register with invalid data (should trigger validation error)
        await axios.post(`${BASE_URL}/api/auth/register`, {
            username: 'ab', // Too short (minimum 3 chars)
            email: 'not-an-email', // Invalid email format
            password: '123' // Too short (minimum 8 chars)
        });
        log.fail('Should have returned validation error');
    } catch (error) {
        if (error.response && error.response.status === 400) {
            const data = error.response.data;
            
            log.pass(`Returned 400 status code`);
            log.info(`Message: "${data.message || 'Validation failed'}"`);
            
            // Check error details
            if (data.errors && Array.isArray(data.errors)) {
                log.info(`Validation errors: ${data.errors.length} issues found`);
                data.errors.forEach((err, i) => {
                    console.log(`   ${i + 1}. ${err.msg || err.message}`);
                });
            }
            
            // Check for sensitive info
            if (data.stack) {
                log.warn('DEVELOPMENT MODE: Stack trace exposed');
            } else {
                log.pass('PRODUCTION MODE: No stack trace');
            }
        } else {
            log.fail(`Unexpected error: ${error.message}`);
        }
    }
}

/**
 * Test Server Error (500 - simulated by triggering database error)
 */
async function testServerError() {
    log.test('500 Server Error - Database/Internal Error');
    
    try {
        // Try to login with long/malformed data that might cause DB error
        await axios.post(`${BASE_URL}/api/auth/login`, {
            usernameOrEmail: 'A'.repeat(10000), // Extremely long string
            password: 'test'
        });
        log.info('Request succeeded (validation caught it before DB error)');
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 500) {
                log.pass(`Returned 500 status code`);
                log.info(`Message: "${data.message}"`);
                
                // Check for sensitive info
                if (data.stack || data.error || data.details) {
                    log.warn('DEVELOPMENT MODE: Error details exposed');
                    console.log('   Stack preview:', data.stack ? data.stack.substring(0, 100) + '...' : 'N/A');
                } else {
                    log.pass('PRODUCTION MODE: Generic error message only');
                }
            } else if (status === 400) {
                log.info('Validation caught the error (expected behavior)');
            } else {
                log.info(`Status ${status}: ${data.message || 'Unknown error'}`);
            }
        } else {
            log.fail(`Network error: ${error.message}`);
        }
    }
}

/**
 * Test Unauthorized Error (401)
 */
async function testUnauthorizedError() {
    log.test('401 Unauthorized - Invalid Token');
    
    try {
        // Try to access protected endpoint without token
        await axios.get(`${BASE_URL}/api/logs/summary/1`);
        log.fail('Should have returned 401 error');
    } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const data = error.response.data;
            
            log.pass(`Returned ${error.response.status} status code`);
            log.info(`Message: "${data.message}"`);
            
            // Check for sensitive info
            if (data.stack || data.token) {
                log.warn('DEVELOPMENT MODE: Token/stack details exposed');
            } else {
                log.pass('PRODUCTION MODE: Generic auth error only');
            }
        } else {
            log.fail(`Unexpected status: ${error.response?.status || 'Network error'} - ${error.response?.data?.message || error.message}`);
        }
    }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
    log.title('🙈 ERROR HIDING SECURITY TEST');
    log.info('Testing error responses in current environment...');
    log.info(`Server: ${BASE_URL}`);
    
    // Detect environment from first test
    try {
        await axios.get(`${BASE_URL}/`);
        log.pass('Server is running and responsive');
    } catch (error) {
        log.fail(`Cannot connect to server at ${BASE_URL}`);
        log.warn('Make sure the server is running: npm run dev');
        process.exit(1);
    }
    
    // Run all error tests
    await test404Error();
    await testValidationError();
    await testServerError();
    await testUnauthorizedError();
    
    // Final summary
    log.title('📊 TEST SUMMARY');
    console.log(`
${colors.cyan}Expected Behavior:${colors.reset}

${colors.bold}DEVELOPMENT MODE (NODE_ENV=development or not set):${colors.reset}
  ✅ Stack traces should be visible in error responses
  ✅ Full error details for debugging
  ✅ Helpful for developers during testing

${colors.bold}PRODUCTION MODE (NODE_ENV=production):${colors.reset}
  ✅ Generic error messages only ("Terjadi kesalahan server")
  ✅ No stack traces or sensitive information
  ✅ Safe for external users/hackers

${colors.yellow}To test PRODUCTION mode:${colors.reset}
  1. Stop the current server
  2. Start with: ${colors.cyan}NODE_ENV=production npm start${colors.reset}
  3. Run this test again

${colors.yellow}To test DEVELOPMENT mode:${colors.reset}
  1. Stop the current server
  2. Start with: ${colors.cyan}npm run dev${colors.reset} (or just ${colors.cyan}npm start${colors.reset})
  3. Run this test again
    `);
}

// Run tests
runAllTests().catch(error => {
    log.fail(`Test runner failed: ${error.message}`);
    process.exit(1);
});
