// Token blacklist and user status caching service using Redis
const redisClient = require('../config/redis');
const db = require('../config/db');

// Key prefixes for Redis
const BLACKLIST_PREFIX = 'blacklist:token:';
const USER_STATUS_PREFIX = 'user:status:';
const USER_DATA_PREFIX = 'user:data:'; // For XP, Level, CO2 saved
const USER_CO2_PREFIX = 'user:co2:'; // For total CO2 saved

/**
 * Add refresh token to blacklist
 * Token will be automatically removed after expiration (7 days)
 * @param {string} token - Refresh token to blacklist
 * @param {number} expiresIn - TTL in seconds (default: 7 days)
 */
const addToBlacklist = async (token, expiresIn = 7 * 24 * 60 * 60) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, cannot blacklist token');
            return false;
        }

        const key = BLACKLIST_PREFIX + token;
        await redisClient.setEx(key, expiresIn, 'revoked');
        console.log('✅ Token added to blacklist');
        return true;
    } catch (error) {
        console.error('❌ Error adding token to blacklist:', error.message);
        return false;
    }
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {boolean} - True if blacklisted
 */
const isBlacklisted = async (token) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, assuming token is valid');
            return false;
        }

        const key = BLACKLIST_PREFIX + token;
        const result = await redisClient.get(key);
        return result !== null;
    } catch (error) {
        console.error('❌ Error checking blacklist:', error.message);
        return false;
    }
};

/**
 * Cache user status in Redis for immediate ban enforcement
 * @param {number} userId - User ID
 * @param {string} status - User status (online, idle, offline, banned)
 * @param {number} ttl - Cache TTL in seconds (default: 1 hour)
 */
const cacheUserStatus = async (userId, status, ttl = 3600) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, cannot cache user status');
            return false;
        }

        const key = USER_STATUS_PREFIX + userId;
        await redisClient.setEx(key, ttl, status);
        console.log(`✅ User ${userId} status cached: ${status}`);
        return true;
    } catch (error) {
        console.error('❌ Error caching user status:', error.message);
        return false;
    }
};

/**
 * Get user status from Redis cache
 * Falls back to database if not cached
 * @param {number} userId - User ID
 * @returns {string|null} - User status or null if not found
 */
const getUserStatus = async (userId) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, checking database...');
            return await getUserStatusFromDB(userId);
        }

        const key = USER_STATUS_PREFIX + userId;
        let status = await redisClient.get(key);

        // Cache miss - fetch from database and cache it
        if (status === null) {
            console.log(`📦 Cache miss for user ${userId}, fetching from database...`);
            status = await getUserStatusFromDB(userId);
            if (status) {
                await cacheUserStatus(userId, status);
            }
        } else {
            console.log(`⚡ Cache hit for user ${userId}: ${status}`);
        }

        return status;
    } catch (error) {
        console.error('❌ Error getting user status:', error.message);
        return await getUserStatusFromDB(userId);
    }
};

/**
 * Helper: Get user status from database
 * @param {number} userId - User ID
 * @returns {string|null} - User status or null
 */
const getUserStatusFromDB = async (userId) => {
    try {
        const [rows] = await db.execute(
            'SELECT status FROM users WHERE id = ?',
            [userId]
        );
        return rows.length > 0 ? rows[0].status : null;
    } catch (error) {
        console.error('❌ Error fetching user status from database:', error.message);
        return null;
    }
};

/**
 * Update user status in both database and Redis cache
 * @param {number} userId - User ID
 * @param {string} status - New status (online, idle, offline, banned)
 */
const updateUserStatus = async (userId, status) => {
    try {
        // Update database
        await db.execute(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, userId]
        );

        // Update cache
        await cacheUserStatus(userId, status);
        
        console.log(`✅ User ${userId} status updated to: ${status}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating user status:', error.message);
        return false;
    }
};

/**
 * Invalidate user status cache (force refresh from database)
 * @param {number} userId - User ID
 */
const invalidateUserStatus = async (userId) => {
    try {
        if (!redisClient.isOpen) {
            return false;
        }

        const key = USER_STATUS_PREFIX + userId;
        await redisClient.del(key);
        console.log(`🗑️ User ${userId} status cache invalidated`);
        return true;
    } catch (error) {
        console.error('❌ Error invalidating user status:', error.message);
        return false;
    }
};

/**
 * Cache user data (XP, Level, Island Health) in Redis
 * @param {number} userId - User ID
 * @param {object} data - { total_xp, current_level, island_health }
 * @param {number} ttl - Cache TTL in seconds (default: 30 minutes)
 */
const cacheUserData = async (userId, data, ttl = 1800) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, cannot cache user data');
            return false;
        }

        const key = USER_DATA_PREFIX + userId;
        const cacheData = JSON.stringify({
            total_xp: data.total_xp,
            current_level: data.current_level,
            island_health: data.island_health,
            cached_at: new Date().toISOString()
        });
        
        await redisClient.setEx(key, ttl, cacheData);
        console.log(`✅ User ${userId} data cached (XP: ${data.total_xp}, Level: ${data.current_level}, Health: ${data.island_health})`);
        return true;
    } catch (error) {
        console.error('❌ Error caching user data:', error.message);
        return false;
    }
};

/**
 * Get user data from Redis cache
 * Falls back to database if not cached
 * @param {number} userId - User ID
 * @returns {object|null} - User data or null if not found
 */
const getUserData = async (userId) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, checking database...');
            return await getUserDataFromDB(userId);
        }

        const key = USER_DATA_PREFIX + userId;
        let data = await redisClient.get(key);

        // Cache miss - fetch from database and cache it
        if (data === null) {
            console.log(`📦 Cache miss for user ${userId} data, fetching from database...`);
            data = await getUserDataFromDB(userId);
            if (data) {
                await cacheUserData(userId, data);
            }
            return data;
        } else {
            const parsed = JSON.parse(data);
            console.log(`⚡ Cache hit for user ${userId} data: XP=${parsed.total_xp}, Level=${parsed.current_level}`);
            return parsed;
        }
    } catch (error) {
        console.error('❌ Error getting user data:', error.message);
        return await getUserDataFromDB(userId);
    }
};

/**
 * Helper: Get user data from database
 * @param {number} userId - User ID
 * @returns {object|null} - User data or null
 */
const getUserDataFromDB = async (userId) => {
    try {
        const [rows] = await db.execute(
            'SELECT total_xp, current_level, island_health FROM users WHERE id = ?',
            [userId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching user data from database:', error.message);
        return null;
    }
};

/**
 * Update user data (XP, Level, Health) in both database and Redis cache
 * @param {number} userId - User ID
 * @param {object} data - { total_xp, current_level, island_health }
 */
const updateUserData = async (userId, data) => {
    try {
        // Update database
        await db.execute(
            'UPDATE users SET total_xp = ?, current_level = ?, island_health = ? WHERE id = ?',
            [data.total_xp, data.current_level, data.island_health, userId]
        );

        // Update cache
        await cacheUserData(userId, data);
        
        console.log(`✅ User ${userId} data updated: XP=${data.total_xp}, Level=${data.current_level}, Health=${data.island_health}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating user data:', error.message);
        return false;
    }
};

/**
 * Cache total CO2 saved for a user
 * @param {number} userId - User ID
 * @param {number} co2Saved - Total CO2 saved in kg
 * @param {number} ttl - Cache TTL in seconds (default: 30 minutes)
 */
const cacheUserCO2 = async (userId, co2Saved, ttl = 1800) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, cannot cache CO2 data');
            return false;
        }

        const key = USER_CO2_PREFIX + userId;
        await redisClient.setEx(key, ttl, co2Saved.toString());
        console.log(`✅ User ${userId} CO2 saved cached: ${co2Saved} kg`);
        return true;
    } catch (error) {
        console.error('❌ Error caching CO2 data:', error.message);
        return false;
    }
};

/**
 * Get total CO2 saved from Redis cache
 * Falls back to database if not cached
 * @param {number} userId - User ID
 * @returns {number} - Total CO2 saved in kg
 */
const getUserCO2 = async (userId) => {
    try {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not available, checking database...');
            return await getUserCO2FromDB(userId);
        }

        const key = USER_CO2_PREFIX + userId;
        let co2 = await redisClient.get(key);

        // Cache miss - fetch from database and cache it
        if (co2 === null) {
            console.log(`📦 Cache miss for user ${userId} CO2, fetching from database...`);
            co2 = await getUserCO2FromDB(userId);
            if (co2 !== null) {
                await cacheUserCO2(userId, co2);
            }
            return co2;
        } else {
            const co2Value = parseFloat(co2);
            console.log(`⚡ Cache hit for user ${userId} CO2: ${co2Value} kg`);
            return co2Value;
        }
    } catch (error) {
        console.error('❌ Error getting CO2 data:', error.message);
        return await getUserCO2FromDB(userId);
    }
};

/**
 * Helper: Get total CO2 saved from database
 * @param {number} userId - User ID
 * @returns {number} - Total CO2 saved
 */
const getUserCO2FromDB = async (userId) => {
    try {
        const [rows] = await db.execute(
            'SELECT COALESCE(SUM(carbon_saved), 0) as total_co2 FROM daily_logs WHERE user_id = ?',
            [userId]
        );
        const co2Value = rows.length > 0 ? parseFloat(rows[0].total_co2) : 0;
        console.log(`🔍 DB query for user ${userId} CO2: ${co2Value} kg`);
        return co2Value;
    } catch (error) {
        console.error('❌ Error fetching CO2 from database:', error.message);
        return 0;
    }
};

/**
 * Invalidate user data cache (force refresh from database)
 * @param {number} userId - User ID
 */
const invalidateUserData = async (userId) => {
    try {
        if (!redisClient.isOpen) {
            return false;
        }

        const dataKey = USER_DATA_PREFIX + userId;
        const co2Key = USER_CO2_PREFIX + userId;
        
        await redisClient.del(dataKey);
        await redisClient.del(co2Key);
        
        console.log(`🗑️ User ${userId} data cache invalidated (XP, Level, CO2)`);
        return true;
    } catch (error) {
        console.error('❌ Error invalidating user data:', error.message);
        return false;
    }
};

module.exports = {
    addToBlacklist,
    isBlacklisted,
    cacheUserStatus,
    getUserStatus,
    updateUserStatus,
    invalidateUserStatus,
    // New functions for user data caching
    cacheUserData,
    getUserData,
    updateUserData,
    cacheUserCO2,
    getUserCO2,
    invalidateUserData
};
