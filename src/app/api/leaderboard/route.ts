import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { LeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use the view that automatically calculates points from approved submissions
    const { data: users, error } = await supabaseAdmin
      .from('user_points_view')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    const processedUsers = users?.map((user: any, index: number) => {
      return {
        user_id: user.id,
        name: user.name,
        telegram_username: user.telegram_username,
        total_points: user.total_points || 0,
        completed_quests: user.completed_quests || 0,
        rank: index + 1
      } as LeaderboardEntry;
    }) || [];

    return NextResponse.json(processedUsers);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}