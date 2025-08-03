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

    // Get user's current stats
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, total_points')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's rank by counting users with higher points
    const { count: higherRankedCount, error: rankError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', 'participant')
      .gt('total_points', userData.total_points);

    if (rankError) {
      console.error('Rank calculation error:', rankError);
      return NextResponse.json({ error: 'Failed to calculate rank' }, { status: 500 });
    }

    const currentRank = (higherRankedCount || 0) + 1;

    // Get total completed quests
    const { count: completedQuests, error: questError } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .eq('status', 'approved');

    if (questError) {
      console.error('Completed quests error:', questError);
    }

    const result = {
      user_id: userData.id,
      name: userData.name,
      total_points: userData.total_points || 0,
      current_rank: currentRank,
      completed_quests: completedQuests || 0
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
