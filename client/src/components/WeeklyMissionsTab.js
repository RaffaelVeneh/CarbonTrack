'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Gift, Zap, Target, CalendarRange } from 'lucide-react';

export default function WeeklyMissionsTab({ userId, API_URL, onActivitySelect, onClaimSuccess, refreshKey }) {
    const [weeklyMissions, setWeeklyMissions] = useState([]);
    const [countdown, setCountdown] = useState('');
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch weekly missions
    const fetchWeeklyMissions = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/missions/weekly/${userId}`);
            const data = await res.json();
            setWeeklyMissions(data.missions || []);
            setSecondsRemaining(data.secondsUntilReset || 0);
        } catch (err) {
            console.error('Fetch weekly missions error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, API_URL]);

    useEffect(() => {
        if (userId) fetchWeeklyMissions();
    }, [userId, fetchWeeklyMissions, refreshKey]);

    // Real-time countdown timer (update every second)
    useEffect(() => {
        if (secondsRemaining <= 0) return;

        const interval = setInterval(() => {
            setSecondsRemaining(prev => {
                if (prev <= 1) {
                    // Reset saat countdown habis
                    fetchWeeklyMissions();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000); // Update setiap 1 detik

        return () => clearInterval(interval);
    }, [secondsRemaining, fetchWeeklyMissions]);

    // Format countdown display
    useEffect(() => {
        const days = Math.floor(secondsRemaining / 86400);
        const hours = Math.floor((secondsRemaining % 86400) / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const secs = secondsRemaining % 60;
        setCountdown(`${days}h ${hours}j ${minutes}m ${secs}d`);
    }, [secondsRemaining]);

    // Handle claim weekly mission
    const handleClaimWeekly = async (weeklyMissionId) => {
        try {
            const res = await fetch(`${API_URL}/missions/weekly/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, weeklyMissionId }),
            });
            const result = await res.json();

            if (res.ok) {
                // Update UI optimistically
                setWeeklyMissions(prev => prev.map(m =>
                    m.weekly_mission_id === weeklyMissionId ? { ...m, status: 'claimed' } : m
                ));

                // Call parent callback to refresh plant health and show notifications
                if (onClaimSuccess) {
                    onClaimSuccess(result);
                }
                
                // Refresh weekly missions to get updated progress
                fetchWeeklyMissions();
            } else {
                alert(result.message || 'Gagal claim misi');
            }
        } catch (error) {
            console.error('Claim error:', error);
            alert('Terjadi kesalahan');
        }
    };

    if (isLoading && weeklyMissions.length === 0) {
        return <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading misi mingguan...</div>;
    }

    // Get difficulty color and text
    const getDifficultyStyle = (difficulty) => {
        switch (difficulty) {
            case 'easy':
                return { color: 'bg-green-100 text-green-700', text: 'Mudah' };
            case 'medium':
                return { color: 'bg-yellow-100 text-yellow-700', text: 'Sedang' };
            case 'hard':
                return { color: 'bg-orange-100 text-orange-700', text: 'Sulit' };
            case 'expert':
                return { color: 'bg-red-100 text-red-700', text: 'Expert' };
            default:
                return { color: 'bg-gray-100 text-gray-700', text: difficulty };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header dengan Countdown */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <CalendarRange size={28} />
                            Misi Mingguan
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
                        <p className="text-xs opacity-75">sampai reset Senin</p>
                    </div>
                </div>
            </div>

            {/* Weekly Missions List */}
            <div className="grid gap-4">
                {weeklyMissions.map((mission) => {
                    const isClaimed = mission.status === 'claimed';
                    const difficultyStyle = getDifficultyStyle(mission.difficulty);
                    
                    return (
                        <div
                            key={mission.weekly_mission_id}
                            className={`relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border-2 transition-all
                                ${isClaimed ? 'border-gray-300 dark:border-gray-600 opacity-60' : 'border-blue-200 dark:border-blue-700 hover:shadow-lg'}`}
                        >
                            {/* Difficulty Badge */}
                            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${difficultyStyle.color} dark:bg-opacity-40`}>
                                {difficultyStyle.text}
                            </div>

                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`text-4xl ${isClaimed ? 'grayscale' : ''}`}>
                                    {mission.icon || '🎯'}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">
                                        {mission.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {mission.description}
                                    </p>

                                    {/* Progress Bar - Only show if not claimed */}
                                    {!isClaimed && (
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-gray-500 dark:text-gray-400 font-semibold">Progress</span>
                                                <span className="font-bold text-blue-600 dark:text-blue-400">{mission.progress_text}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500" 
                                                    style={{ width: `${Math.min(100, (mission.progress / mission.target_value) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

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
                                        <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg font-bold text-sm">
                                            ✓ Diklaim
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => onActivitySelect(mission.required_activity_id)}
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition flex items-center gap-1"
                                            >
                                                <Target size={16} />
                                                Kerjakan
                                            </button>
                                            <button
                                                onClick={() => handleClaimWeekly(mission.weekly_mission_id)}
                                                disabled={!mission.can_claim}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                                    mission.can_claim
                                                        ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <p className="font-bold mb-2">💡 Tips Misi Mingguan:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Misi mingguan reset setiap hari Senin pukul 00:00</li>
                    <li>Total 10 misi: 2 mudah, 4 sedang, 3 sulit, 1 expert</li>
                    <li>Progress dihitung dari Senin sampai Minggu</li>
                    <li>Selesaikan untuk mendapat reward besar!</li>
                </ul>
            </div>
        </div>
    );
}
