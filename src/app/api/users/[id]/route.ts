import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can view their own profile, admins can view any profile
    if (parseInt(session.user.id) !== parseInt(params.id) && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user info from the view which includes partner information
    const { data: userFromView, error: viewError } = await supabaseAdmin
      .from('user_points_view')
      .select('*')
      .eq('id', params.id)
      .single();

    if (viewError || !userFromView) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get comprehensive submissions including self, partner, and group submissions
    const userId = parseInt(params.id);
    let allCompletedQuests: any[] = [];

    // 1. Get user's own submissions
    const { data: userSubmissions } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        quest_id,
        status,
        points_awarded,
        submitted_at,
        reviewed_at,
        quest:quests(id, title, category, points, description),
        users!submissions_user_id_fkey(name, telegram_username)
      `)
      .eq('user_id', userId)
      .not('is_deleted', 'eq', true);

    if (userSubmissions) {
      userSubmissions.forEach(submission => {
        allCompletedQuests.push({
          ...submission,
          submitted_by: 'self',
          submitter_name: userFromView.name,
          submitter_telegram: userFromView.telegram_username
        });
      });
    }

    // 2. Get partner's submissions (if user has a partner)
    if (userFromView.partner_id) {
      const { data: partnerSubmissions } = await supabaseAdmin
        .from('submissions')
        .select(`
          id,
          quest_id,
          status,
          points_awarded,
          submitted_at,
          reviewed_at,
          quest:quests(id, title, category, points, description),
          users!submissions_user_id_fkey(name, telegram_username)
        `)
        .eq('user_id', userFromView.partner_id)
        .not('is_deleted', 'eq', true);

      if (partnerSubmissions) {
        partnerSubmissions.forEach(submission => {
          const user = submission.users as any;
          allCompletedQuests.push({
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
            status,
            points_awarded,
            submitted_at,
            reviewed_at,
            quest:quests(id, title, category, points, description),
            users!submissions_user_id_fkey(name, telegram_username),
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
          allCompletedQuests.push({
            id: submission.id,
            quest_id: submission.quest.id,
            status: submission.status,
            points_awarded: submission.points_awarded,
            submitted_at: submission.submitted_at,
            reviewed_at: submission.reviewed_at,
            quest: submission.quest,
            group_submission_id: groupSubmission.id,
            submitted_by: 'group',
            submitter_name: user?.name,
            submitter_telegram: user?.telegram_username
          });
        }
      });
    }

    const user = {
      ...userFromView,
      submissions: allCompletedQuests.sort((a, b) => 
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      )
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, telegram_id, telegram_username } = body;

    // Users can update their own profile (limited fields), admins can update any profile
    if (parseInt(session.user.id) !== parseInt(params.id) && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    
    // Fields that users can update themselves
    if (name !== undefined) updateData.name = name;
    if (telegram_id !== undefined) updateData.telegram_id = telegram_id;
    if (telegram_username !== undefined) updateData.telegram_username = telegram_username;

    // Fields that only admins can update
    if (session.user.role === 'admin') {
      if (role !== undefined) updateData.role = role;
      // Note: total_points is now automatically calculated via database view
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('User update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent admin from deleting themselves
    if (parseInt(session.user.id) === parseInt(params.id)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('User deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User deletion API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}