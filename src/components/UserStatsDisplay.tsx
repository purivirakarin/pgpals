'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Trophy, Star, Target } from 'lucide-react';
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

  const fetchUserStats = async () => {
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
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchUserStats();
    }
  }, [session, status, refreshTrigger]);

  if (loading || !session?.user || session.user.role === 'admin' || !stats) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1 text-primary-600">
        <Star className="w-4 h-4" />
        <span className="font-medium">{stats.total_points}</span>
        <span className="text-gray-500 hidden sm:inline">pts</span>
      </div>
      
      <div className="flex items-center space-x-1 text-amber-600">
        <Trophy className="w-4 h-4" />
        <span className="font-medium">#{stats.current_rank}</span>
      </div>
      
      <div className="flex items-center space-x-1 text-green-600 hidden md:flex">
        <Target className="w-4 h-4" />
        <span className="font-medium">{stats.completed_quests}</span>
        <span className="text-gray-500">done</span>
      </div>
    </div>
  );
}
