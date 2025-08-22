'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Trophy, Star, CheckCircle } from 'lucide-react';
import { useStats } from '@/contexts/StatsContext';

interface UserStats {
  user_id: string;
  name: string;
  total_points: number;
  current_rank: number;
  completed_quests: number;
}

export default function UserStatsDisplay() {
  const { data: session, status } = useSession();
  const { refreshTrigger } = useStats();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    if (!session?.user || session.user.role === 'admin') {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me/stats');
      
      if (!response.ok) {
        console.error('UserStatsDisplay: API error, status:', response.status);
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status !== 'loading') {
      fetchUserStats();
    }
  }, [session, status, refreshTrigger, fetchUserStats]);

  if (loading || !session?.user || session.user.role === 'admin' || !stats) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
        <Star className="w-4 h-4 text-primary-200" />
        <span className="font-medium text-white">{stats.total_points}</span>
        <span className="text-white/70 hidden sm:inline text-xs">pts</span>
      </div>
      
      <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1">
        <Trophy className="w-4 h-4 text-primary-200" />
        <span className="font-medium text-white">#{stats.current_rank}</span>
      </div>
      
      <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 hidden md:flex">
        <CheckCircle className="w-4 h-4 text-primary-300" />
        <span className="font-medium text-white">{stats.completed_quests}</span>
      </div>
    </div>
  );
}
