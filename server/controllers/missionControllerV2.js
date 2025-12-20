const db = require('../config/db');
const { getUserData, updateUserData } = require('../services/tokenBlacklist');

/**
 * MISSION SYSTEM V2 - OPTIMIZED
 * Mengurangi N+1 queries dengan batch processing
 */

// Simple in-memory cache (5 menit)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

function getCacheKey(userId) {
    return `missions_${userId}`;
}

function getCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

// Clear cache untuk user tertentu (EXPORT untuk digunakan di controller lain)
function clearUserCache(userId) {
    const key = getCacheKey(userId);
    cache.delete(key);
    console.log(`🗑️  Cache cleared for user ${userId}`);
}

// Export clearUserCache agar bisa dipanggil dari logController
module.exports.clearUserCache = clearUserCache;

// 1. GET MISSIONS - OPTIMIZED dengan Batch Queries
exports.getMissions = async (req, res) => {
    const startTime = Date.now();
    try {
        const { userId } = req.params;
        console.log(`📊 Fetching missions for user ${userId}`);

        // Cek cache dulu
        const cacheKey = getCacheKey(userId);
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            console.log(`✅ Cache hit for user ${userId} (${Date.now() - startTime}ms)`);
            return res.json(cachedData);
        }

        // A. Ambil Data User
        console.time('⏱️ User query');
        const [userRows] = await db.execute(
            'SELECT id, username, total_xp, current_level, island_health FROM users WHERE id = ?', 
            [userId]
        );
        console.timeEnd('⏱️ User query');
        
        if (userRows.length === 0) {
            console.log(`❌ User ${userId} not found`);
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userRows[0];
        const currentLevel = user.current_level;
        
        // Rumus Level: Level 1 (0-100 XP), Level 2 (100-200 XP), dst.
        const xpPerLevel = 100; 
        const nextLevelXP = currentLevel * xpPerLevel;
        const xpProgress = user.total_xp - ((currentLevel - 1) * xpPerLevel);

        // B. Ambil Misi yang Sesuai Level User + Claimed Status (BATCH QUERY 1)
        // C-E. OPTIMIZATION: Execute all queries in parallel for faster response
        console.time('⏱️ Parallel missions queries');
        const [
            [missions],
            [progressResult],
            [consecutiveResult],
            [transportResult]
        ] = await Promise.all([
            // Query 1: Missions with claim status
            db.execute(`
                SELECT 
                    m.*,
                    CASE WHEN um.status = 'claimed' THEN 1 ELSE 0 END as is_claimed
                FROM missions m
                LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = ? AND um.status = 'claimed'
                WHERE m.min_level <= ? + 1
                ORDER BY m.min_level ASC, m.difficulty ASC, m.id ASC
            `, [userId, currentLevel]),
            
            // Query 2: Progress data (parallel execution)
            db.execute(`
                SELECT 
                    activity_id,
                    SUM(carbon_saved) as total_saved,
                    SUM(carbon_produced) as total_produced,
                    SUM(input_value) as total_input,
                    COUNT(DISTINCT log_date) as activity_days,
                    COUNT(*) as activity_count,
                    MIN(log_date) as first_date,
                    MAX(log_date) as last_date
                FROM daily_logs
                WHERE user_id = ?
                AND log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY activity_id
            `, [userId]),
            
            // Query 3: Consecutive days (parallel execution)
            db.execute(`
                SELECT DISTINCT log_date
                FROM daily_logs
                WHERE user_id = ?
                AND carbon_saved > 0
                ORDER BY log_date DESC
                LIMIT 30
            `, [userId]),
            
            // Query 4: Transportation distance (parallel execution)
            db.execute(`
                SELECT 
                    SUM(dl.input_value) as total
                FROM daily_logs dl
                JOIN activities a ON dl.activity_id = a.id
                WHERE dl.user_id = ?
                AND a.category = 'transportation'
                AND dl.log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            `, [userId])
        ]);
        console.timeEnd('⏱️ Parallel missions queries');

        const progressData = progressResult || [];
        const consecutiveDaysData = consecutiveResult || [];
        const transportData = transportResult || [];
        
        console.log(`📦 Loaded: ${missions.length} missions, ${progressData.length} progress, ${consecutiveDaysData.length} consecutive days`);
        }

        // F. Process missions dengan data yang sudah di-batch
        console.log(`\n🎯 Processing ${missions.length} missions for user ${userId} (Level ${currentLevel})`);
        
        const missionsWithProgress = missions.map((mission) => {
            const isClaimed = mission.is_claimed === 1;
            const isLocked = mission.min_level > currentLevel;

            // Skip progress calculation jika sudah claimed atau locked
            if (isClaimed || isLocked) {
                return {
                    id: mission.id,
                    title: mission.title,
                    description: mission.description,
                    mission_type: mission.mission_type,
                    target_value: parseFloat(mission.target_value),
                    duration_days: mission.duration_days,
                    required_activity_id: mission.required_activity_id,
                    min_level: mission.min_level,
                    max_level: mission.max_level,
                    xp_reward: mission.xp_reward,
                    health_reward: mission.health_reward,
                    icon: mission.icon,
                    difficulty: mission.difficulty,
                    progress: 0,
                    progress_text: '0 / ' + mission.target_value,
                    is_completed: false,
                    is_claimed: isClaimed,
                    is_locked: isLocked,
                    is_completable: false,
                    can_claim: false
                };
            }

            // Hitung progress dari batch data yang sudah di-aggregate
            let progress = 0;
            let targetValue = parseFloat(mission.target_value);

            switch (mission.mission_type) {
                case 'co2_saved':
                    progress = progressData.reduce((sum, row) => sum + parseFloat(row.total_saved || 0), 0);
                    break;

                case 'co2_produced':
                    progress = progressData.reduce((sum, row) => sum + parseFloat(row.total_produced || 0), 0);
                    break;

                case 'specific_activity':
                    console.log(`\n🎯 Mission ${mission.id} "${mission.title}"`);
                    console.log(`   Looking for: required_activity_id=${mission.required_activity_id} (type: ${typeof mission.required_activity_id})`);
                    console.log(`   Available activities in progressData: ${progressData.map(r => r.activity_id).join(', ')}`);
                    
                    // Support untuk multiple activities (comma-separated IDs)
                    let activityIds = [];
                    if (mission.required_activity_id) {
                        const idString = String(mission.required_activity_id);
                        if (idString.includes(',')) {
                            // Multiple IDs: "160,161"
                            activityIds = idString.split(',').map(id => parseInt(id.trim()));
                            console.log(`   🔀 Multiple activities detected: [${activityIds.join(', ')}]`);
                        } else {
                            // Single ID
                            activityIds = [parseInt(idString)];
                        }
                    }
                    
                    // Sum progress dari semua matching activities
                    const matchingActivities = progressData.filter(row => activityIds.includes(row.activity_id));
                    if (matchingActivities.length > 0) {
                        progress = matchingActivities.reduce((sum, row) => sum + parseFloat(row.total_input || 0), 0);
                        console.log(`   ✅ FOUND ${matchingActivities.length} matching activities! Total progress=${progress} / ${targetValue} (${Math.round((progress/targetValue)*100)}%)`);
                        matchingActivities.forEach(a => console.log(`      - Activity ${a.activity_id}: ${a.total_input}`));
                    } else {
                        console.log(`   ❌ NOT FOUND in progressData`);
                    }
                    break;

                case 'activity_count':
                    const greenActivities = progressData.filter(row => row.activity_id >= 101);
                    progress = greenActivities.reduce((sum, row) => sum + parseFloat(row.activity_count || 0), 0);
                    break;

                case 'consecutive_days':
                    const maxDays = parseInt(mission.duration_days);
                    if (isNaN(maxDays) || maxDays <= 0) {
                        progress = 0;
                        break;
                    }
                    
                    const dates = consecutiveDaysData
                        .slice(0, maxDays)
                        .map(row => new Date(row.log_date));
                    
                    let consecutiveDays = 0;
                    if (dates.length > 0) {
                        consecutiveDays = 1;
                        for (let i = 0; i < dates.length - 1; i++) {
                            const diff = Math.floor((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
                            if (diff === 1) {
                                consecutiveDays++;
                            } else {
                                break;
                            }
                        }
                    }
                    progress = consecutiveDays;
                    break;

                case 'total_distance':
                    if (transportData.length > 0 && transportData[0]) {
                        progress = parseFloat(transportData[0].total || 0);
                    }
                    break;

                default:
                    progress = 0;
            }

            // Tentukan apakah completed
            let isCompleted = false;
            if (mission.mission_type === 'co2_produced') {
                isCompleted = progress <= targetValue;
            } else {
                isCompleted = progress >= targetValue;
            }

            // Format progress text untuk frontend
            let progressText = '';
            if (mission.mission_type === 'co2_produced') {
                progressText = `${progress.toFixed(2)} / ${targetValue} kg CO2`;
            } else if (mission.mission_type === 'consecutive_days') {
                progressText = `${Math.floor(progress)} / ${Math.floor(targetValue)} hari`;
            } else if (mission.mission_type === 'activity_count') {
                progressText = `${Math.floor(progress)} / ${Math.floor(targetValue)} aktivitas`;
            } else {
                progressText = `${progress.toFixed(2)} / ${targetValue}`;
            }

            return {
                id: mission.id,
                title: mission.title,
                description: mission.description,
                mission_type: mission.mission_type,
                target_value: parseFloat(mission.target_value),
                duration_days: mission.duration_days,
                required_activity_id: mission.required_activity_id,
                min_level: mission.min_level,
                max_level: mission.max_level,
                xp_reward: mission.xp_reward,
                health_reward: mission.health_reward,
                icon: mission.icon,
                difficulty: mission.difficulty,
                progress: parseFloat(progress.toFixed(2)),
                progress_text: progressText,
                is_completed: isCompleted,
                is_claimed: isClaimed,
                is_locked: false,
                is_completable: isCompleted && !isClaimed,
                can_claim: isCompleted && !isClaimed
            };
        });

        const result = {
            levelInfo: {
                currentLevel,
                currentXP: user.total_xp,
                nextLevelXP,
                xpProgress,
                xpPerLevel,
                progressPercentage: Math.floor((xpProgress / xpPerLevel) * 100)
            },
            missions: missionsWithProgress
        };

        // Simpan ke cache
        setCache(cacheKey, result);

        const totalTime = Date.now() - startTime;
        console.log(`✅ Missions fetched successfully for user ${userId} in ${totalTime}ms (${missionsWithProgress.length} missions)`);

        res.json(result);

    } catch (error) {
        console.error('❌ Error getMissions:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// 2. CLAIM MISSION - OPTIMIZED dengan Cache Clear
exports.claimMission = async (req, res) => {
    try {
        const { userId, missionId } = req.body;

        // A. Ambil Info Misi
        const [missionRows] = await db.execute('SELECT * FROM missions WHERE id = ?', [missionId]);
        if (missionRows.length === 0) {
            return res.status(404).json({ message: 'Misi tidak ditemukan' });
        }
        const mission = missionRows[0];

        // B. Ambil Data User - Using Redis Cache
        const userData = await getUserData(userId);

        // C. Validasi Level
        if (userData.current_level < mission.min_level) {
            return res.status(403).json({ 
                message: `Level ${mission.min_level} diperlukan untuk misi ini!` 
            });
        }

        // D. Cek Klaim Ganda
        const [checkClaimed] = await db.execute(
            'SELECT * FROM user_missions WHERE user_id = ? AND mission_id = ? AND status = "claimed"',
            [userId, missionId]
        );
        if (checkClaimed.length > 0) {
            return res.status(400).json({ message: 'Misi ini sudah diklaim!' });
        }

        // E. Save ke user_missions
        await db.execute(
            'INSERT INTO user_missions (user_id, mission_id, status, progress_value, completed_at, claimed_at) VALUES (?, ?, "claimed", ?, NOW(), NOW())',
            [userId, missionId, mission.target_value]
        );

        // F. Hitung Reward
        const newXP = userData.total_xp + mission.xp_reward;
        const xpPerLevel = 100;
        let newLevel = Math.floor(newXP / xpPerLevel) + 1;
        const leveledUp = newLevel > userData.current_level;

        // G. Update Health
        const newHealth = Math.min(100, userData.island_health + mission.health_reward);

        // H. Update User - Using Redis Cache
        await updateUserData(userId, {
            total_xp: newXP,
            current_level: newLevel,
            island_health: newHealth
        });

        // I. CLEAR CACHE setelah claim berhasil
        clearUserCache(userId);

        res.json({
            success: true,
            message: leveledUp ? `🎉 Level Up! Sekarang Level ${newLevel}!` : 'Misi berhasil diklaim!',
            xpAdded: mission.xp_reward,
            healthAdded: mission.health_reward,
            newLevel,
            leveledUp,
            currentXP: newXP,
            xpPerLevel,
            xpPercentage: ((newXP - ((newLevel - 1) * xpPerLevel)) / xpPerLevel) * 100,
            rewards: {
                xp: mission.xp_reward,
                health: mission.health_reward,
                newLevel,
                leveledUp
            }
        });

    } catch (error) {
        console.error('Error claimMission:', error);
        res.status(500).json({ message: 'Gagal klaim misi', error: error.message });
    }
};

// 3. GET MISSION HISTORY - Riwayat Misi yang Sudah Diklaim
exports.getMissionHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const [history] = await db.execute(`
            SELECT 
                um.*,
                m.title,
                m.description,
                m.xp_reward,
                m.health_reward,
                m.icon,
                m.difficulty
            FROM user_missions um
            JOIN missions m ON um.mission_id = m.id
            WHERE um.user_id = ?
            AND um.status = 'claimed'
            ORDER BY um.claimed_at DESC
            LIMIT 50
        `, [userId]);

        res.json({
            total: history.length,
            history
        });

    } catch (error) {
        console.error('Error getMissionHistory:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
