const db = require('../config/db');
const { getUserData, updateUserData, invalidateUserData } = require('../services/tokenBlacklist');

// Helper functions
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getSecondsUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return Math.floor((tomorrow - now) / 1000);
}

// Auto-cleanup: Delete old daily missions (not from today)
async function cleanupOldDailyMissions() {
    try {
        const today = getTodayDate();
        const [result] = await db.execute(
            'DELETE FROM daily_missions WHERE assigned_date < ?',
            [today]
        );
        if (result.affectedRows > 0) {
            console.log(`🧹 [Daily Missions Cleanup] Deleted ${result.affectedRows} old missions before ${today}`);
        }
    } catch (error) {
        console.error('❌ [Daily Missions Cleanup] Error:', error);
    }
}

// GET daily missions WITH PROGRESS (from today's logs only)
const getDailyMissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const today = getTodayDate();

        // Auto-cleanup old missions before fetching
        await cleanupOldDailyMissions();

        console.log(`📅 Fetching daily missions for user ${userId}`);

        const [existing] = await db.execute(`
            SELECT dm.id as daily_mission_id, dm.mission_id, dm.status, dm.claimed_at, dm.health_reward,
                   m.title, m.description, m.mission_type, m.target_value, m.duration_days,
                   m.required_activity_id, m.xp_reward, m.health_reward as base_health_reward,
                   m.icon, m.difficulty
            FROM daily_missions dm
            JOIN missions m ON dm.mission_id = m.id
            WHERE dm.user_id = ? AND dm.assigned_date = ?
            ORDER BY m.difficulty ASC
        `, [userId, today]);

        if (existing.length > 0) {
            console.log(`✅ Found ${existing.length} existing daily missions for date: ${today}`);
            
            // Calculate progress from TODAY's daily_logs only
            const [todayLogs] = await db.execute(`
                SELECT activity_id, SUM(input_value) as total_input, SUM(carbon_saved) as total_saved,
                       COUNT(*) as activity_count
                FROM daily_logs
                WHERE user_id = ? AND DATE(log_date) = ?
                GROUP BY activity_id
            `, [userId, today]);

            console.log(`📊 Today's logs for user ${userId} on ${today}:`, todayLogs.length > 0 ? JSON.stringify(todayLogs, null, 2) : 'No activities today');

            // Add progress to each mission
            const missionsWithProgress = existing.map(mission => {
                let progress = 0;
                const target = parseFloat(mission.target_value);

                switch (mission.mission_type) {
                    case 'co2_saved':
                        progress = todayLogs.reduce((sum, log) => sum + parseFloat(log.total_saved || 0), 0);
                        break;
                    case 'specific_activity':
                        const activityIds = String(mission.required_activity_id).includes(',') 
                            ? String(mission.required_activity_id).split(',').map(id => parseInt(id.trim()))
                            : [parseInt(mission.required_activity_id)];
                        const matching = todayLogs.filter(log => activityIds.includes(log.activity_id));
                        progress = matching.reduce((sum, log) => sum + parseFloat(log.total_input || 0), 0);
                        console.log(`🎯 Mission "${mission.title}" (${mission.mission_type}): Looking for activities ${activityIds.join(',')} -> Found ${matching.length} logs -> Progress: ${progress}/${target}`);
                        break;
                    case 'activity_count':
                        const greenLogs = todayLogs.filter(log => log.activity_id >= 101);
                        progress = greenLogs.reduce((sum, log) => sum + parseInt(log.activity_count || 0), 0);
                        console.log(`📋 Mission "${mission.title}" (${mission.mission_type}): Found ${greenLogs.length} green activities -> Progress: ${progress}/${target}`);
                        break;
                    default:
                        progress = 0;
                }

                const progressPercent = target > 0 ? Math.min(100, (progress / target) * 100) : 0;
                const isCompleted = progressPercent >= 100;
                const canClaim = isCompleted && mission.status !== 'claimed';

                console.log(`   -> Progress: ${progress.toFixed(1)}/${target} (${progressPercent.toFixed(0)}%) | Completed: ${isCompleted} | Can Claim: ${canClaim}`);

                return {
                    ...mission,
                    progress: parseFloat(progress.toFixed(2)),
                    progress_text: `${progress.toFixed(1)} / ${target}`,
                    progress_percentage: Math.round(progressPercent),
                    is_completed: isCompleted,
                    is_claimed: mission.status === 'claimed',
                    can_claim: canClaim
                };
            });

            return res.json({ missions: missionsWithProgress, secondsUntilReset: getSecondsUntilMidnight() });
        }

        // Generate new
        const [easy] = await db.execute(`
            SELECT * FROM missions 
            WHERE difficulty = 'easy' AND mission_type != 'consecutive_days'
            ORDER BY RAND() LIMIT 4
        `);
        
        const [medium] = await db.execute(`
            SELECT * FROM missions 
            WHERE difficulty = 'medium' AND mission_type != 'consecutive_days'
            ORDER BY RAND() LIMIT 1
        `);

        const selected = [...easy, ...medium];
        if (selected.length < 5) {
            return res.status(500).json({ message: 'Not enough missions' });
        }

        await Promise.all(selected.map(m => 
            db.execute(`INSERT INTO daily_missions (user_id, mission_id, assigned_date, health_reward) VALUES (?, ?, ?, ?)`,
                [userId, m.id, today, m.health_reward])
        ));

        const [newMissions] = await db.execute(`
            SELECT dm.id as daily_mission_id, dm.mission_id, dm.status, dm.claimed_at, dm.health_reward,
                   m.title, m.description, m.mission_type, m.target_value, m.duration_days,
                   m.required_activity_id, m.xp_reward, m.health_reward as base_health_reward,
                   m.icon, m.difficulty
            FROM daily_missions dm
            JOIN missions m ON dm.mission_id = m.id
            WHERE dm.user_id = ? AND dm.assigned_date = ?
            ORDER BY m.difficulty ASC
        `, [userId, today]);

        // Calculate progress for new missions (likely 0 since just generated)
        const [todayLogs] = await db.execute(`
            SELECT activity_id, SUM(input_value) as total_input, SUM(carbon_saved) as total_saved,
                   COUNT(*) as activity_count
            FROM daily_logs
            WHERE user_id = ? AND DATE(log_date) = ?
            GROUP BY activity_id
        `, [userId, today]);

        const missionsWithProgress = newMissions.map(mission => {
            let progress = 0;
            const target = parseFloat(mission.target_value);

            switch (mission.mission_type) {
                case 'co2_saved':
                    progress = todayLogs.reduce((sum, log) => sum + parseFloat(log.total_saved || 0), 0);
                    break;
                case 'specific_activity':
                    const activityIds = String(mission.required_activity_id).includes(',') 
                        ? String(mission.required_activity_id).split(',').map(id => parseInt(id.trim()))
                        : [parseInt(mission.required_activity_id)];
                    const matching = todayLogs.filter(log => activityIds.includes(log.activity_id));
                    progress = matching.reduce((sum, log) => sum + parseFloat(log.total_input || 0), 0);
                    break;
                case 'activity_count':
                    const greenLogs = todayLogs.filter(log => log.activity_id >= 101);
                    progress = greenLogs.reduce((sum, log) => sum + parseInt(log.activity_count || 0), 0);
                    break;
                default:
                    progress = 0;
            }

            const progressPercent = target > 0 ? Math.min(100, (progress / target) * 100) : 0;
            const isCompleted = progressPercent >= 100;

            return {
                ...mission,
                progress: parseFloat(progress.toFixed(2)),
                progress_text: `${progress.toFixed(1)} / ${target}`,
                progress_percentage: Math.round(progressPercent),
                is_completed: isCompleted,
                is_claimed: false,
                can_claim: isCompleted
            };
        });

        res.json({ missions: missionsWithProgress, secondsUntilReset: getSecondsUntilMidnight() });
    } catch (error) {
        console.error('Error getDailyMissions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST claim daily mission (kasih XP + plant_health)
const claimDailyMission = async (req, res) => {
    try {
        const { userId, dailyMissionId } = req.body;

        const [dm] = await db.execute(`
            SELECT dm.*, m.title, m.xp_reward, m.health_reward as base_health_reward
            FROM daily_missions dm
            JOIN missions m ON dm.mission_id = m.id
            WHERE dm.id = ? AND dm.user_id = ?
        `, [dailyMissionId, userId]);

        if (dm.length === 0) return res.status(404).json({ message: 'Not found' });
        if (dm[0].status === 'claimed') return res.status(400).json({ message: 'Already claimed' });

        const mission = dm[0];
        const healthReward = mission.health_reward || mission.base_health_reward || 5;
        const xpReward = mission.xp_reward || 0;

        // 1. Update daily_missions status
        await db.execute(`UPDATE daily_missions SET status = 'claimed', claimed_at = NOW() WHERE id = ?`, [dailyMissionId]);

        // 2. Update plant_health
        await db.execute(`
            INSERT INTO user_plant_health (user_id, plant_health, total_health_earned)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                plant_health = plant_health + VALUES(plant_health),
                total_health_earned = total_health_earned + VALUES(total_health_earned)
        `, [userId, healthReward, healthReward]);

        // 3. Update XP user (hitung level up jika perlu) - Using Redis Cache
        const userData = await getUserData(userId);
        console.log(`📊 User before claim: XP=${userData.total_xp}, Level=${userData.current_level}`);
        
        const newXP = userData.total_xp + xpReward;
        const xpPerLevel = 100;
        let newLevel = Math.floor(newXP / xpPerLevel) + 1;
        const leveledUp = newLevel > userData.current_level;

        console.log(`💫 Updating: ${userData.total_xp} + ${xpReward} = ${newXP} XP | Level ${userData.current_level} -> ${newLevel}`);
        
        // Update both DB and Redis cache
        await updateUserData(userId, {
            total_xp: newXP,
            current_level: newLevel,
            island_health: userData.island_health
        });

        // 4. Get updated data
        const [ph] = await db.execute(`SELECT plant_health, total_health_earned FROM user_plant_health WHERE user_id = ?`, [userId]);
        
        console.log(`✅ Daily mission claimed! +${xpReward} XP, +${healthReward} health | New totals: XP=${newXP}, Health=${ph[0]?.plant_health}`);

        res.json({
            success: true,
            message: leveledUp ? `🎉 Level Up! +${xpReward} XP, +${healthReward} nyawa` : `+${xpReward} XP, +${healthReward} nyawa 🌻`,
            xpAdded: xpReward,
            healthAdded: healthReward,
            newXP: newXP,
            newLevel: newLevel,
            leveledUp: leveledUp,
            xpPerLevel: xpPerLevel,
            xpPercentage: ((newXP - ((newLevel - 1) * xpPerLevel)) / xpPerLevel) * 100,
            newPlantHealth: ph[0]?.plant_health || 0,
            totalHealthEarned: ph[0]?.total_health_earned || 0
        });
    } catch (error) {
        console.error('Error claimDailyMission:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET plant health
const getPlantHealth = async (req, res) => {
    try {
        const { userId } = req.params;
        
        let [data] = await db.execute(`SELECT * FROM user_plant_health WHERE user_id = ?`, [userId]);
        
        if (data.length === 0) {
            await db.execute(`INSERT INTO user_plant_health (user_id, plant_health, total_health_earned) VALUES (?, 0, 0)`, [userId]);
            [data] = await db.execute(`SELECT * FROM user_plant_health WHERE user_id = ?`, [userId]);
        }

        res.json({
            plant_health: data[0].plant_health,
            total_health_earned: data[0].total_health_earned,
            last_health_decay: data[0].last_health_decay,
            secondsUntilDecay: getSecondsUntilMidnight()
        });
    } catch (error) {
        console.error('Error getPlantHealth:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST reset health (cron)
const resetHealthDaily = async (req, res) => {
    try {
        const [result] = await db.execute(`
            UPDATE user_plant_health 
            SET plant_health = GREATEST(0, plant_health - 25), last_health_decay = NOW()
            WHERE plant_health > 0
        `);

        res.json({ success: true, message: `Health decay: ${result.affectedRows} users`, decayAmount: -25 });
    } catch (error) {
        console.error('Error resetHealthDaily:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDailyMissions,
    claimDailyMission,
    getPlantHealth,
    resetHealthDaily
};
