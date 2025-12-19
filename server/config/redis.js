// Redis configuration for token blacklist and user status caching
const redis = require('redis');

// Detect if using Upstash (cloud) or local Redis
const isUpstash = process.env.REDIS_URL && process.env.REDIS_URL.includes('upstash.io');

// Create Redis client with SSL support for Upstash
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
        // Enable TLS/SSL for Upstash
        tls: isUpstash,
        reconnectStrategy: (retries) => {
            // Reconnect after 500ms, max 10 retries
            if (retries > 10) {
                console.error('❌ Redis: Max reconnection attempts reached');
                return new Error('Redis max reconnection attempts reached');
            }
            console.log(`🔄 Redis: Reconnecting... (attempt ${retries})`);
            return 500;
        }
    }
});

// Connection events
redisClient.on('connect', () => {
    console.log('🔗 Redis: Connecting...');
});

redisClient.on('ready', () => {
    console.log('✅ Redis: Connected and ready');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
});

redisClient.on('end', () => {
    console.log('🔌 Redis: Connection closed');
});

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Redis: Failed to connect:', error.message);
        console.warn('⚠️ Application will continue without Redis (blacklist disabled)');
    }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Redis connection...');
    await redisClient.quit();
    process.exit(0);
});

module.exports = redisClient;
