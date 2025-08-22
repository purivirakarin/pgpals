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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build base query with explicit quest and user joins to avoid N+1
    let query = supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        quest_id,
        status,
        telegram_file_id,
        telegram_message_id,
        submitted_at,
        reviewed_at,
        reviewed_by,
        points_awarded,
        admin_feedback,
        ai_analysis,
        ai_confidence_score,
        is_group_submission,
        group_submission_id,
        represents_pairs,
        quest:quests(id, title, category, points, description),
        users!submissions_user_id_fkey(id, name, telegram_username, email)
      `)
      .not('is_deleted', 'eq', true)  // Filter out soft-deleted submissions
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If user is admin, show all submissions; otherwise, show submissions visible to the user and their pair
    if (session.user.role !== 'admin') {
      // Get user's partner ID
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('partner_id')
        .eq('id', session.user.id)
        .single();

      const partnerId = userData?.partner_id;

      // Get group submission IDs where user is participating and not opted out
      const { data: groupParticipations } = await supabaseAdmin
        .from('group_participants')
        .select('group_submission_id')
        .eq('user_id', session.user.id)
        .eq('opted_out', false);

      const groupSubmissionIds = groupParticipations?.map(gp => gp.group_submission_id) || [];

      // Build the filter conditions
      let userIds = [session.user.id];
      if (partnerId) {
        userIds.push(partnerId);
      }

      // Apply filters - show submissions from user/partner OR group submissions they're part of
      if (groupSubmissionIds.length > 0) {
        query = query.or(`user_id.in.(${userIds.join(',')}),group_submission_id.in.(${groupSubmissionIds.join(',')})`);
      } else {
        query = query.in('user_id', userIds);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Submissions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Data is already joined, just return it
    return NextResponse.json(submissions || []);
  } catch (error) {
    console.error('Submissions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}