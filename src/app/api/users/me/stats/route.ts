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
      .eq('id', session.user.id)
      .single();

    if (userError || !userStats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate completed quests including group submissions
    const userId = parseInt(session.user.id);
    let completedQuestIds = new Set<number>();

    // 1. Get user's own completed submissions
    const { data: userSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('quest_id')
      .eq('user_id', userId)
      .in('status', ['approved', 'ai_approved'])
      .not('is_deleted', 'eq', true);

    if (userSubmissions) {
      userSubmissions.forEach(sub => completedQuestIds.add(sub.quest_id));
    }

    // 2. Get partner's completed submissions (if partner exists)
    if (userStats.partner_id) {
      const { data: partnerSubmissions } = await supabaseAdmin
        .from('submissions')
        .select('quest_id')
        .eq('user_id', userStats.partner_id)
        .in('status', ['approved', 'ai_approved'])
        .not('is_deleted', 'eq', true);

      if (partnerSubmissions) {
        partnerSubmissions.forEach(sub => completedQuestIds.add(sub.quest_id));
      }
    }

    // 3. Get group submissions where user participated and not opted out
    const { data: groupParticipations } = await supabaseAdmin
      .from('group_participants')
      .select(`
        group_submissions!inner(
          quest_id,
          submissions!inner(
            status,
            is_deleted
          )
        )
      `)
      .eq('user_id', userId)
      .eq('opted_out', false);

    if (groupParticipations) {
      groupParticipations.forEach(participation => {
        const groupSub = participation.group_submissions as any;
        const submission = groupSub?.submissions;
        if (submission && (submission.status === 'approved' || submission.status === 'ai_approved') && 
            !submission.is_deleted) {
          completedQuestIds.add(groupSub.quest_id);
        }
      });
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
      completed_quests: completedQuestIds.size  // Use the comprehensive count
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
