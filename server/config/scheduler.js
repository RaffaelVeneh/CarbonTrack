const cron = require('node-cron');
const axios = require('axios');

/**
 * CRON JOB: Daily Health Decay
 * Berjalan setiap tengah malam (00:00) server time
 * Mengurangi plant_health -25 untuk semua users
 */

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Cron syntax: '0 0 * * *' = setiap hari jam 00:00
const scheduleDailyHealthDecay = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('\n🌙 ===== DAILY HEALTH DECAY STARTED =====');
        console.log(`Time: ${new Date().toISOString()}`);
        
        try {
            const response = await axios.post(`${API_URL}/missions/daily/reset-health`);
            console.log('✅ Health decay completed:', response.data);
        } catch (error) {
            console.error('❌ Health decay failed:', error.message);
        }
        
        console.log('===== DAILY HEALTH DECAY FINISHED =====\n');
    }, {
        timezone: "Asia/Jakarta" // Sesuaikan dengan timezone server kamu
    });

    console.log('⏰ Daily health decay scheduler initialized (00:00 Asia/Jakarta)');
};

module.exports = { scheduleDailyHealthDecay };
