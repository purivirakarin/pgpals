import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/submissions/create-group - Create a group submission for multiple-pair quests
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questId, submissionId, participantUserIds } = await request.json();

    if (!questId || !submissionId || !Array.isArray(participantUserIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Verify the quest is multiple-pair category
    const { data: quest } = await supabaseAdmin
      .from('quests')
      .select('category, title')
      .eq('id', questId)
      .single();

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    if (quest.category !== 'multiple-pair') {
      return NextResponse.json({ error: 'Group submissions only allowed for multiple-pair quests' }, { status: 400 });
    }

    // Verify the submission belongs to the current user
    const { data: submission } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('user_id', userId)
      .eq('quest_id', questId)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found or not owned by you' }, { status: 404 });
    }

    // Check if group submission already exists for this quest
    const { data: existingGroup } = await supabaseAdmin
      .from('group_submissions')
      .select('id')
      .eq('quest_id', questId)
      .single();

    if (existingGroup) {
      return NextResponse.json({ error: 'A group submission already exists for this quest' }, { status: 400 });
    }

    // Validate participant count (1-5 pairs = 2-10 people)
    if (participantUserIds.length < 2 || participantUserIds.length > 10) {
      return NextResponse.json({ error: 'Group submissions must include 2-10 participants (1-5 pairs)' }, { status: 400 });
    }

    // Ensure submitter is included in participants
    if (!participantUserIds.includes(userId)) {
      participantUserIds.push(userId);
    }

    // Create the group submission using the database function
    const { data: groupSubmissionId, error } = await supabaseAdmin
      .rpc('create_group_submission', {
        p_quest_id: questId,
        p_submitter_user_id: userId,
        p_submission_id: submissionId,
        p_participant_user_ids: participantUserIds
      });

    if (error) {
      console.error('Error creating group submission:', error);
      return NextResponse.json({ error: 'Failed to create group submission' }, { status: 500 });
    }

    // Get the created group submission with details
    const { data: groupDetails } = await supabaseAdmin
      .from('group_submissions')
      .select(`
        *,
        submission:submissions(*),
        submitter:users!submitter_user_id(name, telegram_username)
      `)
      .eq('id', groupSubmissionId)
      .single();

    // Get participants
    const { data: participants } = await supabaseAdmin
      .from('group_participants')
      .select(`
        *,
        user:users!user_id(id, name, telegram_username),
        partner:users!partner_id(id, name, telegram_username)
      `)
      .eq('group_submission_id', groupSubmissionId);

    return NextResponse.json({
      success: true,
      message: 'Group submission created successfully!',
      groupSubmission: groupDetails,
      participants: participants
    });

  } catch (error) {
    console.error('Error creating group submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
