import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { LeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use the view that automatically calculates points from approved submissions
    // Exclude admin users from leaderboard
    const { data: users, error } = await supabaseAdmin
      .from('user_points_view')
      .select('*')
      .neq('role', 'admin')
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Group partners together and create unique leaderboard entries
    const processedEntries = new Map();
    const processedUserIds = new Set();

    users?.forEach((user: any) => {
      // Skip if this user was already processed as part of a partnership
      if (processedUserIds.has(user.id)) {
        return;
      }

      if (user.partner_id && user.partner_name) {
        // This user has a partner, create a combined entry
        const partnerUser = users.find((u: any) => u.id === user.partner_id);
        
        if (partnerUser) {
          // Mark both users as processed
          processedUserIds.add(user.id);
          processedUserIds.add(user.partner_id);

          // Create combined entry (use the user with the lower ID as the key for consistency)
          const entryKey = Math.min(user.id, user.partner_id);
          processedEntries.set(entryKey, {
            user_id: entryKey,
            name: `${user.name} & ${user.partner_name}`,
            telegram_username: user.telegram_username && user.partner_telegram 
              ? `${user.telegram_username} & ${user.partner_telegram}`
              : user.telegram_username || user.partner_telegram || null,
            total_points: user.total_points, // Points are already combined in the view
            completed_quests: user.completed_quests || 0, // Quest count from the view
            rank: 0, // Will be set later
            is_partnership: true,
            partner_names: [user.name, user.partner_name]
          });
        } else {
          // Partner not found, treat as individual
          processedUserIds.add(user.id);
          processedEntries.set(user.id, {
            user_id: user.id,
            name: user.name,
            telegram_username: user.telegram_username,
            total_points: user.total_points || 0,
            completed_quests: user.completed_quests || 0,
            rank: 0,
            is_partnership: false
          });
        }
      } else {
        // Individual user (no partner)
        processedUserIds.add(user.id);
        processedEntries.set(user.id, {
          user_id: user.id,
          name: user.name,
          telegram_username: user.telegram_username,
          total_points: user.total_points || 0,
          completed_quests: user.completed_quests || 0,
          rank: 0,
          is_partnership: false
        });
      }
    });

    // Convert to array and sort by points
    const leaderboardArray = Array.from(processedEntries.values())
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit);

    // Assign ranks
    leaderboardArray.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json(leaderboardArray);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}