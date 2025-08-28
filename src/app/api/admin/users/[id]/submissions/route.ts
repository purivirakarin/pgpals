import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user information first using the same view as the users API
    const { data: userInfo, error: userError } = await supabaseAdmin
      .from('user_points_view')
      .select(`
        id,
        name,
        email,
        telegram_username,
        partner_id,
        partner_name,
        total_points
      `)
      .eq('id', parseInt(userId))
      .single();

    if (userError || !userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Get all direct submissions by this user
    const { data: directSubmissions, error: directError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        quest_id,
        status,
        points_awarded,
        submitted_at,
        reviewed_at,
        is_group_submission,
        group_submission_id,
        represents_pairs,
        is_deleted,
        deleted_at,
        pair_submission,
        visible_to_partner,
        quest:quests(id, title, category, points, description),
        reviewer:users!submissions_reviewed_by_fkey(id, name, email)
      `)
      .eq('user_id', parseInt(userId))
      .order('submitted_at', { ascending: false });

    if (directError) {
      console.error('Error fetching direct submissions:', directError);
      return NextResponse.json({ error: 'Failed to fetch direct submissions' }, { status: 500 });
    }

    // 2. Get all submissions by their partner (if they have one)
    let partnerSubmissions: any[] = [];
    if (userInfo.partner_id) {
      const { data: partnerSubs, error: partnerError } = await supabaseAdmin
        .from('submissions')
        .select(`
          id,
          user_id,
          quest_id,
          status,
          points_awarded,
          submitted_at,
          reviewed_at,
          is_group_submission,
          group_submission_id,
          represents_pairs,
          is_deleted,
          deleted_at,
          pair_submission,
          visible_to_partner,
          quest:quests(id, title, category, points, description),
          user:users!submissions_user_id_fkey(id, name, email, telegram_username),
          reviewer:users!submissions_reviewed_by_fkey(id, name, email)
        `)
        .eq('user_id', userInfo.partner_id)
        .eq('visible_to_partner', true)
        .order('submitted_at', { ascending: false });

      if (!partnerError && partnerSubs) {
        partnerSubmissions = partnerSubs;
      }
    }

    // 3. Get group submissions where this user participated
    let groupSubmissions: any[] = [];
    
    const { data: groupParticipations, error: groupError } = await supabaseAdmin
      .from('group_participants')
      .select(`
        group_submission_id,
        opted_out,
        opted_out_at,
        group_submissions!inner(
          id,
          quest_id,
          submission_id,
          submitter_user_id,
          submissions!inner(
            id,
            user_id,
            quest_id,
            status,
            points_awarded,
            submitted_at,
            reviewed_at,
            is_group_submission,
            group_submission_id,
            represents_pairs,
            is_deleted,
            deleted_at,
            quest:quests(id, title, category, points, description),
            submitter:users!submissions_user_id_fkey(id, name, email, telegram_username),
            reviewer:users!submissions_reviewed_by_fkey(id, name, email)
          )
        )
      `)
      .eq('user_id', parseInt(userId));

    if (!groupError && groupParticipations) {
      groupSubmissions = groupParticipations.map(participation => {
        const groupSubmission = participation.group_submissions as any;
        const submission = groupSubmission.submissions as any;
        
        return {
          ...submission,
          submission_type: 'group',
          group_submission_id: groupSubmission.id,
          submitter_user_id: groupSubmission.submitter_user_id,
          opted_out: participation.opted_out,
          opted_out_at: participation.opted_out_at,
          submitter: submission.submitter
        };
      });
    }

    // 4. Calculate totals and statistics
    const allSubmissions = [
      ...(directSubmissions || []).map(s => ({ ...s, submission_type: 'direct' })),
      ...(partnerSubmissions || []).map(s => ({ ...s, submission_type: 'partner' })),
      ...groupSubmissions
    ];

    const stats = {
      total_submissions: allSubmissions.length,
      direct_submissions: (directSubmissions || []).length,
      partner_submissions: partnerSubmissions.length,
      group_submissions: groupSubmissions.length,
      approved_submissions: allSubmissions.filter(s => s.status === 'approved' && !s.is_deleted).length,
      pending_submissions: allSubmissions.filter(s => ['pending_ai', 'manual_review'].includes(s.status) && !s.is_deleted).length,
      rejected_submissions: allSubmissions.filter(s => ['rejected', 'ai_rejected'].includes(s.status) && !s.is_deleted).length,
      deleted_submissions: allSubmissions.filter(s => s.is_deleted).length,
      total_points_from_submissions: allSubmissions
        .filter(s => s.status === 'approved' && !s.is_deleted)
        .reduce((sum, s) => sum + (s.points_awarded || 0), 0)
    };

    return NextResponse.json({
      user: userInfo,
      submissions: allSubmissions,
      stats,
      breakdown: {
        direct: directSubmissions || [],
        partner: partnerSubmissions || [],
        group: groupSubmissions || []
      }
    });

  } catch (error) {
    console.error('User submissions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
