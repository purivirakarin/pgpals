'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, User, TrendingUp } from 'lucide-react';
import { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
  limit?: number;
  showRank?: boolean;
  className?: string;
}

export default function Leaderboard({ limit = 20, showRank = true, className = '' }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
        2: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white',
        3: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
      };
      return colors[rank as keyof typeof colors];
    }
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error loading leaderboard: {error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-2 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <TrendingUp className="w-8 h-8 text-primary-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
        <span className="ml-2 text-sm text-gray-500">Top {limit}</span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No participants yet!</p>
          <p className="text-sm">Be the first to complete a quest.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center p-4 rounded-lg border transition-all hover:shadow-md ${
                entry.rank <= 3 
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' 
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              {showRank && (
                <div className="flex items-center mr-4">
                  {getRankIcon(entry.rank)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center whitespace-nowrap overflow-x-auto">
                  <span className="font-semibold text-gray-900">
                    {entry.name}
                  </span>
                  {entry.telegram_username && (
                    <span className="ml-2 text-sm text-gray-500">
                      @{entry.telegram_username}
                    </span>
                  )}
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <span>{entry.completed_quests} quest{entry.completed_quests !== 1 ? 's' : ''} completed</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {entry.total_points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
                
                {showRank && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadge(entry.rank)}`}>
                    #{entry.rank}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Updated in real-time</span>
          <button
            onClick={fetchLeaderboard}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}