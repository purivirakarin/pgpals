import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendGroupSubmissionNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      quest_id, 
      participant_pairs, 
      telegram_file_id, 
      telegram_message_id 
    } = await request.json();

    if (!quest_id || !participant_pairs || !Array.isArray(participant_pairs)) {
      return NextResponse.json({ 
        error: 'Missing required fields: quest_id, participant_pairs' 
      }, { status: 400 });
    }

    // Validate quest exists and is active
    const { data: quest } = await supabaseAdmin
      .from('quests')
      .select('id, title, category, status')
      .eq('id', quest_id)
      .eq('status', 'active')
      .single();

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found or inactive' }, { status: 404 });
    }

    // Ensure quest supports group submissions
    if (quest.category !== 'multiple-pair') {
      return NextResponse.json({ 
        error: 'This quest does not support group submissions' 
      }, { status: 400 });
    }

    // Validate participant pairs structure
    for (const pair of participant_pairs) {
      if (!pair.user1_name || !pair.user2_name) {
        return NextResponse.json({ 
          error: 'Each pair must have user1_name and user2_name' 
        }, { status: 400 });
      }
    }

    // Create the main submission entry
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .insert({
        user_id: session.user.id,
        quest_id: quest_id,
        telegram_file_id: telegram_file_id,
        telegram_message_id: telegram_message_id,
        status: 'pending_ai',
        is_group_submission: true,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (submissionError || !submission) {
      console.error('Failed to create submission:', submissionError);
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    // Create group submission record
    const { data: groupSubmission, error: groupError } = await supabaseAdmin
      .from('group_submissions')
      .insert({
        quest_id: quest_id,
        submitter_user_id: session.user.id,
        submission_id: submission.id
      })
      .select()
      .single();

    if (groupError || !groupSubmission) {
      console.error('Failed to create group submission:', groupError);
      // Clean up the submission if group creation failed
      await supabaseAdmin.from('submissions').delete().eq('id', submission.id);
      return NextResponse.json({ error: 'Failed to create group submission' }, { status: 500 });
    }

    // Update submission with group_submission_id
    await supabaseAdmin
      .from('submissions')
      .update({ group_submission_id: groupSubmission.id })
      .eq('id', submission.id);

    // Create group participant records
    const participantInserts = [];
    const allUserIds = [];

    for (const pair of participant_pairs) {
      // For each pair, we need to find or create user records
      // In this case, we'll store the pair information as metadata
      
      // Create participant entries - we'll use the submitter as representative
      // and store pair names in metadata for now
      participantInserts.push({
        group_submission_id: groupSubmission.id,
        user_id: session.user.id, // Representative user
        partner_id: null, // We'll handle this differently for group submissions
        opted_out: false
      });
      
      allUserIds.push(session.user.id);
    }

    if (participantInserts.length > 0) {
      const { error: participantsError } = await supabaseAdmin
        .from('group_participants')
        .insert(participantInserts);

      if (participantsError) {
        console.error('Failed to create group participants:', participantsError);
        // Continue anyway - we have the core submission
      }
    }

    // Update the submission with participant information
    const participantNames = participant_pairs.map(pair => `${pair.user1_name} & ${pair.user2_name}`);
    await supabaseAdmin
      .from('submissions')
      .update({ 
        represents_pairs: participantNames,
        admin_feedback: `Group submission for: ${participantNames.join(', ')}`
      })
      .eq('id', submission.id);

    // Send notifications (this would need to be enhanced to handle actual user IDs)
    try {
      await sendGroupSubmissionNotification(
        groupSubmission.id,
        session.user.name || 'Unknown User',
        quest.title
      );
    } catch (notificationError) {
      console.error('Failed to send group notification:', notificationError);
      // Don't fail the request for notification errors
    }

    return NextResponse.json({
      submission_id: submission.id,
      group_submission_id: groupSubmission.id,
      quest_title: quest.title,
      participant_count: participant_pairs.length * 2,
      status: 'success'
    });

  } catch (error) {
    console.error('Group submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questId = searchParams.get('quest_id');

    let query = supabaseAdmin
      .from('group_submissions')
      .select(`
        id,
        quest_id,
        submitter_user_id,
        created_at,
        quests!group_submissions_quest_id_fkey(title, category),
        users!group_submissions_submitter_user_id_fkey(name),
        submissions!group_submissions_submission_id_fkey(status, submitted_at)
      `)
      .order('created_at', { ascending: false });

    if (questId) {
      query = query.eq('quest_id', questId);
    }

    // If not admin, only show group submissions the user is part of
    if (session.user.role !== 'admin') {
      query = query.or(`submitter_user_id.eq.${session.user.id}`);
    }

    const { data: groupSubmissions, error } = await query;

    if (error) {
      console.error('Group submissions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch group submissions' }, { status: 500 });
    }

    return NextResponse.json(groupSubmissions || []);

  } catch (error) {
    console.error('Group submissions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
