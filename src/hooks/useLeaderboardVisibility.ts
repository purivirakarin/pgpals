'use client';

import { useState, useEffect } from 'react';

interface LeaderboardSettings {
  leaderboard_visible: boolean;
  loading: boolean;
}

export function useLeaderboardVisibility(): LeaderboardSettings {
  const [settings, setSettings] = useState<LeaderboardSettings>({
    leaderboard_visible: false, // Default to false (disabled)
    loading: true,
  });

  useEffect(() => {
    const checkLeaderboardVisibility = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        
        if (response.status === 403) {
          // Leaderboard is hidden for non-admins
          setSettings({
            leaderboard_visible: false,
            loading: false,
          });
        } else if (response.ok) {
          // Leaderboard is visible
          setSettings({
            leaderboard_visible: true,
            loading: false,
          });
        } else {
          // Default to hidden if there's an error
          setSettings({
            leaderboard_visible: false,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error checking leaderboard visibility:', error);
        setSettings({
          leaderboard_visible: false,
          loading: false,
        });
      }
    };

    checkLeaderboardVisibility();
  }, []);

  return settings;
}
