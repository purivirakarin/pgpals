import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { LeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use the pairs-based view
    const { data, error } = await supabaseAdmin
      .from('pair_points_view')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Pairs leaderboard fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    const leaderboardArray = (data || []).map((row: any, index: number) => ({
      pair_id: row.pair_id,
      name: `${row.user1_name} & ${row.user2_name}`,
      telegram_username: [row.user1_telegram, row.user2_telegram].filter(Boolean).join(' & ') || null,
      total_points: row.total_points || 0,
      completed_quests: row.completed_quests || 0,
      rank: index + 1,
      is_partnership: true,
      partner_names: [row.user1_name, row.user2_name],
      users: [
        { id: row.user1_id, name: row.user1_name, telegram_username: row.user1_telegram },
        { id: row.user2_id, name: row.user2_name, telegram_username: row.user2_telegram },
      ],
    }));

    // Public leaderboard can be cached briefly
    return NextResponse.json(leaderboardArray, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'Vary': 'Authorization, Cookie',
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}