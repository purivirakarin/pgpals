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

    const userId = parseInt(session.user.id);
    let allSubmissions: any[] = [];

    // For regular users, get comprehensive submissions including self, partner, and group submissions
    if (session.user.role !== 'admin') {
      // Get user's partner info
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('partner_id')
        .eq('id', userId)
        .single();

      const partnerId = userData?.partner_id;

      // 1. Get user's own submissions
      const { data: userSubmissions } = await supabaseAdmin
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
        .eq('user_id', userId)
        .not('is_deleted', 'eq', true);

      if (userSubmissions) {
        userSubmissions.forEach(submission => {
          const user = submission.users as any;
          allSubmissions.push({
            ...submission,
            submitted_by: 'self',
            submitter_name: session.user.name,
            submitter_telegram: user?.telegram_username
          });
        });
      }

      // 2. Get partner's submissions (if partner exists)
      if (partnerId) {
        const { data: partnerSubmissions } = await supabaseAdmin
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
          .eq('user_id', partnerId)
          .not('is_deleted', 'eq', true);

        if (partnerSubmissions) {
          partnerSubmissions.forEach(submission => {
            const user = submission.users as any;
            allSubmissions.push({
              ...submission,
              submitted_by: 'partner',
              submitter_name: user?.name,
              submitter_telegram: user?.telegram_username
            });
          });
        }
      }

      // 3. Get group submissions where user participated and not opted out
      const { data: groupParticipations } = await supabaseAdmin
        .from('group_participants')
        .select(`
          group_submission_id,
          opted_out,
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
              users!submissions_user_id_fkey(id, name, telegram_username, email),
              is_deleted
            )
          )
        `)
        .eq('user_id', userId)
        .eq('opted_out', false);

      if (groupParticipations) {
        groupParticipations.forEach(participation => {
          const groupSubmission = participation.group_submissions as any;
          const submission = groupSubmission?.submissions;
          
          if (submission && !submission.is_deleted) {
            const user = submission.users as any;
            allSubmissions.push({
              ...submission,
              group_submission_id: groupSubmission.id,
              submitted_by: 'group',
              submitter_name: user?.name,
              submitter_telegram: user?.telegram_username
            });
          }
        });
      }

      // Remove duplicates by submission ID and sort by submission date
      const uniqueSubmissions = Array.from(
        new Map(allSubmissions.map(sub => [sub.id, sub])).values()
      ).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

      // Apply status filter if provided
      let filteredSubmissions = uniqueSubmissions;
      if (status) {
        filteredSubmissions = uniqueSubmissions.filter(sub => sub.status === status);
      }

      // Apply pagination
      const paginatedSubmissions = filteredSubmissions.slice(offset, offset + limit);

      return NextResponse.json({
        submissions: paginatedSubmissions,
        total: filteredSubmissions.length,
        page: Math.floor(offset / limit) + 1,
        limit
      });

    } else {
      // For admin users, use the original query
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
        .not('is_deleted', 'eq', true)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: submissions, error } = await query;

      if (error) {
        console.error('Submissions fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
      }

      // Get total count for pagination
      let countQuery = supabaseAdmin
        .from('submissions')
        .select('id', { count: 'exact' })
        .not('is_deleted', 'eq', true);

      if (status) {
        countQuery = countQuery.eq('status', status);
      }

      const { count } = await countQuery;

      return NextResponse.json({
        submissions: submissions || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit
      });
    }

  } catch (error) {
    console.error('Submissions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}