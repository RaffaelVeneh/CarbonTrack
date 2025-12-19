const db = require('../config/db');
const { getUserData, updateUserData } = require('../services/tokenBlacklist');

// Helper functions
function getThisWeekMonday() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = (day === 0 ? -6 : 1) - day; // Hitung selisih ke Senin
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}

function getSecondsUntilNextMonday() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Hitung hari sampai Senin berikutnya
    const daysUntilMonday = day === 0 ? 1 : (8 - day);
    
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    
    return Math.floor((nextMonday - now) / 1000);
}

// Auto-cleanup: Delete old weekly missions (not from this week)
async function cleanupOldWeeklyMissions() {
    try {
        const thisWeekMonday = getThisWeekMonday();
        const [result] = await db.execute(
            'DELETE FROM weekly_missions WHERE assigned_week < ?',
            [thisWeekMonday]
        );
        if (result.affectedRows > 0) {
            console.log(`🧹 [Weekly Missions Cleanup] Deleted ${result.affectedRows} old missions before week ${thisWeekMonday}`);
        }
    } catch (error) {
        console.error('❌ [Weekly Missions Cleanup] Error:', error);
    }
}

// GET weekly missions WITH PROGRESS (from this week's logs)
const getWeeklyMissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const thisWeekMonday = getThisWeekMonday();

        // Auto-cleanup old missions before fetching
        await cleanupOldWeeklyMissions();

        console.log(`📅 Fetching weekly missions for user ${userId} for week starting: ${thisWeekMonday}`);

        const [existing] = await db.execute(`
            SELECT wm.id as weekly_mission_id, wm.mission_id, wm.status, wm.claimed_at, wm.health_reward,
                   m.title, m.description, m.mission_type, m.target_value, m.duration_days,
                   m.required_activity_id, m.xp_reward, m.health_reward as base_health_reward,
                   m.icon, m.difficulty
            FROM weekly_missions wm
            JOIN missions m ON wm.mission_id = m.id
            WHERE wm.user_id = ? AND wm.assigned_week = ?
            ORDER BY m.difficulty ASC
        `, [userId, thisWeekMonday]);

        if (existing.length > 0) {
            console.log(`✅ Found ${existing.length} existing weekly missions for week: ${thisWeekMonday}`);
            
            // Calculate progress from THIS WEEK's daily_logs
            const [thisWeekLogs] = await db.execute(`
                SELECT activity_id, SUM(input_value) as total_input, SUM(carbon_saved) as total_saved,
                       COUNT(*) as activity_count
                FROM daily_logs
                WHERE user_id = ? AND DATE(log_date) >= ?
                GROUP BY activity_id
            `, [userId, thisWeekMonday]);

            console.log(`📊 This week's logs for user ${userId} since ${thisWeekMonday}:`, thisWeekLogs.length > 0 ? JSON.stringify(thisWeekLogs, null, 2) : 'No activities this week');

            // Add progress to each mission
            const missionsWithProgress = existing.map(mission => {
                let progress = 0;
                const target = parseFloat(mission.target_value);

                switch (mission.mission_type) {
                    case 'co2_saved':
                        progress = thisWeekLogs.reduce((sum, log) => sum + parseFloat(log.total_saved || 0), 0);
                        break;
                    case 'specific_activity':
                        const activityIds = String(mission.required_activity_id).includes(',') 
                            ? String(mission.required_activity_id).split(',').map(id => parseInt(id.trim()))
                            : [parseInt(mission.required_activity_id)];
                        const matching = thisWeekLogs.filter(log => activityIds.includes(log.activity_id));
                        progress = matching.reduce((sum, log) => sum + parseFloat(log.total_input || 0), 0);
                        console.log(`🎯 Mission "${mission.title}" (${mission.mission_type}): Looking for activities ${activityIds.join(',')} -> Found ${matching.length} logs -> Progress: ${progress}/${target}`);
                        break;
                    case 'activity_count':
                        const greenLogs = thisWeekLogs.filter(log => log.activity_id >= 101);
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

            return res.json({ missions: missionsWithProgress, secondsUntilReset: getSecondsUntilNextMonday() });
        }

        // Generate new weekly missions: 2 easy, 4 medium, 3 hard, 1 expert
        const [easy] = await db.execute(`
            SELECT * FROM missions 
            WHERE difficulty = 'easy' AND mission_type != 'consecutive_days'
            ORDER BY RAND() LIMIT 2
        `);
        
        const [medium] = await db.execute(`
            SELECT * FROM missions 
            WHERE difficulty = 'medium' AND mission_type != 'consecutive_days'
            ORDER BY RAND() LIMIT 4
        `);

        const [hard] = await db.execute(`
            SELECT * FROM missions 
            WHERE difficulty = 'hard' AND mission_type != 'consecutive_days'
            ORDER BY RAND() LIMIT 3
        `);

        const [expert] = await db.execute(`
            SELECT * FROM missions 
            WHERE difficulty = 'expert' AND mission_type != 'consecutive_days'
            ORDER BY RAND() LIMIT 1
        `);

        const selected = [...easy, ...medium, ...hard, ...expert];
        if (selected.length < 10) {
            return res.status(500).json({ message: 'Not enough missions available' });
        }

        await Promise.all(selected.map(m => 
            db.execute(`INSERT INTO weekly_missions (user_id, mission_id, assigned_week, health_reward) VALUES (?, ?, ?, ?)`,
                [userId, m.id, thisWeekMonday, m.health_reward])
        ));

        const [newMissions] = await db.execute(`
            SELECT wm.id as weekly_mission_id, wm.mission_id, wm.status, wm.claimed_at, wm.health_reward,
                   m.title, m.description, m.mission_type, m.target_value, m.duration_days,
                   m.required_activity_id, m.xp_reward, m.health_reward as base_health_reward,
                   m.icon, m.difficulty
            FROM weekly_missions wm
            JOIN missions m ON wm.mission_id = m.id
            WHERE wm.user_id = ? AND wm.assigned_week = ?
            ORDER BY m.difficulty ASC
        `, [userId, thisWeekMonday]);

        // Calculate progress for new missions (likely 0 since just generated)
        const [thisWeekLogs] = await db.execute(`
            SELECT activity_id, SUM(input_value) as total_input, SUM(carbon_saved) as total_saved,
                   COUNT(*) as activity_count
            FROM daily_logs
            WHERE user_id = ? AND DATE(log_date) >= ?
            GROUP BY activity_id
        `, [userId, thisWeekMonday]);

        const missionsWithProgress = newMissions.map(mission => {
            let progress = 0;
            const target = parseFloat(mission.target_value);

            switch (mission.mission_type) {
                case 'co2_saved':
                    progress = thisWeekLogs.reduce((sum, log) => sum + parseFloat(log.total_saved || 0), 0);
                    break;
                case 'specific_activity':
                    const activityIds = String(mission.required_activity_id).includes(',') 
                        ? String(mission.required_activity_id).split(',').map(id => parseInt(id.trim()))
                        : [parseInt(mission.required_activity_id)];
                    const matching = thisWeekLogs.filter(log => activityIds.includes(log.activity_id));
                    progress = matching.reduce((sum, log) => sum + parseFloat(log.total_input || 0), 0);
                    break;
                case 'activity_count':
                    const greenLogs = thisWeekLogs.filter(log => log.activity_id >= 101);
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

        res.json({ missions: missionsWithProgress, secondsUntilReset: getSecondsUntilNextMonday() });
    } catch (error) {
        console.error('Error getWeeklyMissions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST claim weekly mission (kasih XP + plant_health)
const claimWeeklyMission = async (req, res) => {
    try {
        const { userId, weeklyMissionId } = req.body;

        const [wm] = await db.execute(`
            SELECT wm.*, m.title, m.xp_reward, m.health_reward as base_health_reward
            FROM weekly_missions wm
            JOIN missions m ON wm.mission_id = m.id
            WHERE wm.id = ? AND wm.user_id = ?
        `, [weeklyMissionId, userId]);

        if (wm.length === 0) return res.status(404).json({ message: 'Not found' });
        if (wm[0].status === 'claimed') return res.status(400).json({ message: 'Already claimed' });

        const mission = wm[0];
        const healthReward = mission.health_reward || mission.base_health_reward || 5;
        const xpReward = mission.xp_reward || 0;

        // 1. Update weekly_missions status
        await db.execute(`UPDATE weekly_missions SET status = 'claimed', claimed_at = NOW() WHERE id = ?`, [weeklyMissionId]);

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
        
        console.log(`✅ Weekly mission claimed! +${xpReward} XP, +${healthReward} health | New totals: XP=${newXP}, Health=${ph[0]?.plant_health}`);

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
        console.error('Error claimWeeklyMission:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getWeeklyMissions,
    claimWeeklyMission
};
