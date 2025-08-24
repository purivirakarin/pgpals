import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter required' }, { status: 400 });
    }

    // Get all group submissions for a specific user
    const { data: groupParticipations, error: groupError } = await supabaseAdmin
      .from('group_participants')
      .select(`
        id,
        group_submission_id,
        user_id,
        partner_id,
        opted_out,
        opted_out_at,
        group_submissions!inner(
          id,
          quest_id,
          submission_id,
          submitter_user_id,
          created_at,
          submissions!inner(
            id,
            user_id,
            quest_id,
            status,
            submitted_at,
            points_awarded,
            is_group_submission,
            represents_pairs,
            is_deleted,
            quest:quests(id, title, category, points, description),
            users!submissions_user_id_fkey(id, name, telegram_username, email)
          )
        )
      `)
      .eq('user_id', parseInt(userId));

    if (groupError) {
      console.error('Error fetching group participations:', groupError);
      return NextResponse.json({ error: 'Failed to fetch group participations' }, { status: 500 });
    }

    // Get user info
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('id, name, email, partner_id')
      .eq('id', parseInt(userId))
      .single();

    // Get all submissions by this user (including non-group ones)
    const { data: userSubmissions } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        quest_id,
        status,
        submitted_at,
        is_group_submission,
        group_submission_id,
        represents_pairs,
        is_deleted,
        quest:quests(id, title, category, points, description)
      `)
      .eq('user_id', parseInt(userId));

    // Count submissions visible in my-submissions page
    let visibleSubmissions = 0;
    let groupSubmissionsCount = 0;
    let ownSubmissionsCount = 0;

    if (userSubmissions) {
      ownSubmissionsCount = userSubmissions.filter(s => !s.is_deleted).length;
      visibleSubmissions += ownSubmissionsCount;
    }

    if (groupParticipations) {
      const validGroupSubmissions = groupParticipations.filter(gp => {
        const groupSub = gp.group_submissions as any;
        const submission = groupSub?.submissions;
        return submission && !submission.is_deleted;
      });
      groupSubmissionsCount = validGroupSubmissions.length;
      visibleSubmissions += groupSubmissionsCount;
    }

    // Get stats from stats API for comparison
    const statsResponse = await fetch(`${request.nextUrl.origin}/api/users/me/stats`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      }
    });
    
    let statsData = null;
    if (statsResponse.ok) {
      statsData = await statsResponse.json();
    }

    return NextResponse.json({
      user: userInfo,
      debug_info: {
        own_submissions_count: ownSubmissionsCount,
        group_submissions_count: groupSubmissionsCount,
        total_visible_submissions: visibleSubmissions,
        stats_api_completed_quests: statsData?.completed_quests || 'N/A'
      },
      own_submissions: userSubmissions || [],
      group_participations: groupParticipations || [],
      group_submissions_details: (groupParticipations || []).map(gp => {
        const groupSub = gp.group_submissions as any;
        const submission = groupSub?.submissions;
        
        return {
          participation_id: gp.id,
          group_submission_id: gp.group_submission_id,
          opted_out: gp.opted_out,
          quest_id: groupSub?.quest_id,
          submission_id: groupSub?.submission_id,
          submitter_user_id: groupSub?.submitter_user_id,
          submission_status: submission?.status,
          quest_title: submission?.quest?.title,
          represents_pairs: submission?.represents_pairs,
          is_deleted: submission?.is_deleted
        };
      })
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
