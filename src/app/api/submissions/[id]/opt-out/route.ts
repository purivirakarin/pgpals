import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = parseInt(params.id);
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Get the submission details and verify it's a group submission
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        quest_id,
        is_group_submission,
        group_submission_id,
        is_deleted,
        status,
        quest:quests(title)
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.is_deleted) {
      return NextResponse.json({ error: 'Submission is already deleted' }, { status: 400 });
    }

    if (!submission.is_group_submission || !submission.group_submission_id) {
      return NextResponse.json({ error: 'This is not a group submission' }, { status: 400 });
    }

    // Check if user is the submitter (submitters cannot opt out, they can only delete)
    const { data: groupSubmission } = await supabaseAdmin
      .from('group_submissions')
      .select('submitter_user_id')
      .eq('id', submission.group_submission_id)
      .single();

    if (groupSubmission?.submitter_user_id === userId) {
      return NextResponse.json({ 
        error: 'As the submitter, you cannot opt out. You can delete the submission instead.' 
      }, { status: 400 });
    }

    // Check if user is a participant in this group submission
    const { data: participation } = await supabaseAdmin
      .from('group_participants')
      .select('id, opted_out, partner_id')
      .eq('group_submission_id', submission.group_submission_id)
      .eq('user_id', userId)
      .single();

    if (!participation) {
      return NextResponse.json({ error: 'You are not a participant in this group submission' }, { status: 403 });
    }

    if (participation.opted_out) {
      return NextResponse.json({ error: 'You have already opted out of this group submission' }, { status: 400 });
    }

    // Check if submission is still in a state that allows opt-out
    if (!['pending_ai', 'manual_review', 'approved', 'ai_approved'].includes(submission.status)) {
      return NextResponse.json({ 
        error: 'Cannot opt out of this submission in its current state' 
      }, { status: 400 });
    }

    // Get user's partner for the opt-out process
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('partner_id, name')
      .eq('id', userId)
      .single();

    const partnerId = userData?.partner_id;

    // Opt out the user (and their partner if they exist)
    const { error: optOutError } = await supabaseAdmin
      .from('group_participants')
      .update({
        opted_out: true,
        opted_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('group_submission_id', submission.group_submission_id)
      .in('user_id', partnerId ? [userId, partnerId] : [userId]);

    if (optOutError) {
      console.error('Error opting out of group submission:', optOutError);
      return NextResponse.json({ error: 'Failed to opt out of group submission' }, { status: 500 });
    }

    // Log the opt-out activity
    await supabaseAdmin
      .from('activities')
      .insert([
        {
          user_id: userId,
          activity_type: 'group_submission_opted_out',
          description: `Opted out of group submission for quest: ${submission.quest?.[0]?.title}`,
          quest_id: submission.quest_id,
          submission_id: submissionId,
          created_by: userId,
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ 
      success: true, 
      message: partnerId 
        ? 'You and your partner have been opted out of this group submission'
        : 'You have been opted out of this group submission'
    });

  } catch (error) {
    console.error('Error opting out of group submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow users to opt back in
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = parseInt(params.id);
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Get the submission details
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        quest_id,
        is_group_submission,
        group_submission_id,
        is_deleted,
        status,
        quest:quests(title)
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!submission.is_group_submission || !submission.group_submission_id) {
      return NextResponse.json({ error: 'This is not a group submission' }, { status: 400 });
    }

    // Check if submission is still in a state that allows opt-in
    if (!['pending_ai', 'manual_review', 'approved', 'ai_approved'].includes(submission.status)) {
      return NextResponse.json({ 
        error: 'Cannot opt back into this submission in its current state' 
      }, { status: 400 });
    }

    // Check if user is currently opted out
    const { data: participation } = await supabaseAdmin
      .from('group_participants')
      .select('id, opted_out, partner_id')
      .eq('group_submission_id', submission.group_submission_id)
      .eq('user_id', userId)
      .single();

    if (!participation) {
      return NextResponse.json({ error: 'You are not a participant in this group submission' }, { status: 403 });
    }

    if (!participation.opted_out) {
      return NextResponse.json({ error: 'You are not currently opted out of this group submission' }, { status: 400 });
    }

    // Get user's partner
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('partner_id')
      .eq('id', userId)
      .single();

    const partnerId = userData?.partner_id;

    // Opt back in the user (and their partner if they exist)
    const { error: optInError } = await supabaseAdmin
      .from('group_participants')
      .update({
        opted_out: false,
        opted_out_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('group_submission_id', submission.group_submission_id)
      .in('user_id', partnerId ? [userId, partnerId] : [userId]);

    if (optInError) {
      console.error('Error opting back into group submission:', optInError);
      return NextResponse.json({ error: 'Failed to opt back into group submission' }, { status: 500 });
    }

    // Log the opt-in activity
    await supabaseAdmin
      .from('activities')
      .insert([
        {
          user_id: userId,
          activity_type: 'group_submission_opted_in',
          description: `Opted back into group submission for quest: ${submission.quest?.[0]?.title}`,
          quest_id: submission.quest_id,
          submission_id: submissionId,
          created_by: userId,
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ 
      success: true, 
      message: partnerId 
        ? 'You and your partner have been opted back into this group submission'
        : 'You have been opted back into this group submission'
    });

  } catch (error) {
    console.error('Error opting back into group submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}