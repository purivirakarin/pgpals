import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current stats from the view
    const { data: userStats, error: userError } = await supabaseAdmin
      .from('user_points_view')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (userError || !userStats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's rank by counting users with higher points in the view
    const { count: higherRankedCount, error: rankError } = await supabaseAdmin
      .from('user_points_view')
      .select('*', { count: 'exact' })
      .eq('role', 'participant')
      .gt('total_points', userStats.total_points);

    if (rankError) {
      console.error('Rank calculation error:', rankError);
      return NextResponse.json({ error: 'Failed to calculate rank' }, { status: 500 });
    }

    const currentRank = (higherRankedCount || 0) + 1;

    const result = {
      user_id: userStats.user_id,
      name: userStats.name,
      total_points: userStats.total_points,
      current_rank: currentRank,
      completed_quests: userStats.completed_quests
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
