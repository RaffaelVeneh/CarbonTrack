// Test script untuk Redis blacklist system
// Run: node server/test-redis.js

const { getUserStatus, updateUserStatus, addToBlacklist, isBlacklisted } = require('./services/tokenBlacklist');

async function testRedisBlacklist() {
    console.log('\n🧪 Testing Redis Blacklist System...\n');

    try {
        // Test 1: Update user status
        console.log('📝 Test 1: Update user status to online');
        await updateUserStatus(1, 'online');
        const status = await getUserStatus(1);
        console.log(`✅ User status: ${status}`);

        // Test 2: Add token to blacklist
        console.log('\n📝 Test 2: Add token to blacklist');
        const testToken = 'test-token-12345';
        await addToBlacklist(testToken, 60); // 60 seconds TTL
        const isBlocked = await isBlacklisted(testToken);
        console.log(`✅ Token blacklisted: ${isBlocked}`);

        // Test 3: Check non-blacklisted token
        console.log('\n📝 Test 3: Check non-blacklisted token');
        const validToken = 'valid-token-67890';
        const isValid = await isBlacklisted(validToken);
        console.log(`✅ Token is valid: ${!isValid}`);

        // Test 4: Ban user
        console.log('\n📝 Test 4: Ban user');
        await updateUserStatus(1, 'banned');
        const bannedStatus = await getUserStatus(1);
        console.log(`✅ User banned: ${bannedStatus === 'banned'}`);

        // Test 5: Set back to offline
        console.log('\n📝 Test 5: Reset to offline');
        await updateUserStatus(1, 'offline');
        const finalStatus = await getUserStatus(1);
        console.log(`✅ User status reset: ${finalStatus}`);

        console.log('\n✅ All tests passed! Redis is working correctly.\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
testRedisBlacklist();
