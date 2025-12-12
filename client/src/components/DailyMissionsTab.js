'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Gift, Zap, Target, Calendar } from 'lucide-react';

export default function DailyMissionsTab({ userId, API_URL, onActivitySelect, onClaimSuccess }) {
    const [dailyMissions, setDailyMissions] = useState([]);
    const [countdown, setCountdown] = useState('');
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch daily missions
    const fetchDailyMissions = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/missions/daily/${userId}`);
            const data = await res.json();
            setDailyMissions(data.missions || []);
            setSecondsRemaining(data.secondsUntilReset || 0);
        } catch (err) {
            console.error('Fetch daily missions error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, API_URL]);

    useEffect(() => {
        if (userId) fetchDailyMissions();
    }, [userId, fetchDailyMissions]);

    // Real-time countdown timer (update every second)
    useEffect(() => {
        if (secondsRemaining <= 0) return;

        const interval = setInterval(() => {
            setSecondsRemaining(prev => {
                if (prev <= 1) {
                    // Reset saat countdown habis
                    fetchDailyMissions();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000); // Update setiap 1 detik

        return () => clearInterval(interval);
    }, [secondsRemaining, fetchDailyMissions]);

    // Format countdown display
    useEffect(() => {
        const hours = Math.floor(secondsRemaining / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const secs = secondsRemaining % 60;
        setCountdown(`${hours}j ${minutes}m ${secs}d`);
    }, [secondsRemaining]);

    // Handle claim daily mission
    const handleClaimDaily = async (dailyMissionId) => {
        try {
            const res = await fetch(`${API_URL}/missions/daily/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, dailyMissionId }),
            });
            const result = await res.json();

            if (res.ok) {
                // Update UI optimistically
                setDailyMissions(prev => prev.map(m =>
                    m.daily_mission_id === dailyMissionId ? { ...m, status: 'claimed' } : m
                ));

                // Call parent callback to refresh plant health and show notifications
                if (onClaimSuccess) {
                    onClaimSuccess(result);
                }
                
                // Refresh daily missions to get updated progress
                fetchDailyMissions();
            } else {
                alert(result.message || 'Gagal claim misi');
            }
        } catch (error) {
            console.error('Claim error:', error);
            alert('Terjadi kesalahan');
        }
    };

    if (isLoading && dailyMissions.length === 0) {
        return <div className="text-center py-20 text-gray-500">Loading misi harian...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header dengan Countdown */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar size={28} />
                            Misi Harian
                        </h2>
                        <p className="text-sm opacity-90 mt-1">
                            Selesaikan untuk dapatkan nyawa bunga 🌻
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 text-lg font-bold">
                            <Clock size={20} />
                            {countdown}
                        </div>
                        <p className="text-xs opacity-75">sampai reset</p>
                    </div>
                </div>
            </div>

            {/* Daily Missions List */}
            <div className="grid gap-4">
                {dailyMissions.map((mission) => {
                    const isClaimed = mission.status === 'claimed';
                    const difficultyColor = mission.difficulty === 'easy' ? 'green' : 'yellow';
                    
                    return (
                        <div
                            key={mission.daily_mission_id}
                            className={`relative bg-white rounded-xl p-5 shadow-md border-2 transition-all
                                ${isClaimed ? 'border-gray-300 opacity-60' : 'border-purple-200 hover:shadow-lg'}`}
                        >
                            {/* Difficulty Badge */}
                            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold
                                ${difficultyColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {mission.difficulty}
                            </div>

                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`text-4xl ${isClaimed ? 'grayscale' : ''}`}>
                                    {mission.icon || '🎯'}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                                        {mission.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {mission.description}
                                    </p>

                                    {/* Rewards */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-red-500 font-bold">
                                            <Gift size={16} />
                                            +{mission.health_reward} HP
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-500 font-bold">
                                            <Zap size={16} />
                                            +{mission.xp_reward} XP
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="flex flex-col gap-2">
                                    {isClaimed ? (
                                        <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-sm">
                                            ✓ Diklaim
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => onActivitySelect(mission.required_activity_id)}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition flex items-center gap-1"
                                            >
                                                <Target size={16} />
                                                Kerjakan
                                            </button>
                                            <button
                                                onClick={() => handleClaimDaily(mission.daily_mission_id)}
                                                disabled={!mission.can_claim}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                                    mission.can_claim
                                                        ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                                title={mission.can_claim ? 'Klaim hadiah' : 'Selesaikan misi dulu'}
                                            >
                                                {mission.can_claim ? '🎁 Terima Hadiah' : '🔒 Belum Selesai'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-bold mb-2">💡 Tips Misi Harian:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Misi harian reset setiap tengah malam (00:00)</li>
                    <li>Nyawa bunga berkurang -25 HP setiap tengah malam</li>
                    <li>Selesaikan misi harian untuk menjaga bunga tetap hidup!</li>
                </ul>
            </div>
        </div>
    );
}
