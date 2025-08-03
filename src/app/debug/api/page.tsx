'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Test leaderboard API
      const leaderboardResponse = await fetch('/api/leaderboard');
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData);
      }

      // Test user stats API
      const statsResponse = await fetch('/api/users/me/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(statsData);
      } else {
        console.log('Stats API error:', statsResponse.status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <button 
        onClick={fetchData}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Data
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Leaderboard Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(leaderboard, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">User Stats Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(userStats, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
