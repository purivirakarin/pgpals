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
      group_codes,
      telegram_file_id, 
      telegram_message_id 
    } = await request.json();

    // Support both new group codes format and legacy participant pairs format
    if (!quest_id || (!group_codes && !participant_pairs)) {
      return NextResponse.json({ 
        error: 'Missing required fields: quest_id and either group_codes or participant_pairs' 
      }, { status: 400 });
    }

    // Validate input format
    if (group_codes && !Array.isArray(group_codes)) {
      return NextResponse.json({ 
        error: 'group_codes must be an array of group code strings' 
      }, { status: 400 });
    }

    if (participant_pairs && !Array.isArray(participant_pairs)) {
      return NextResponse.json({ 
        error: 'participant_pairs must be an array of pair objects' 
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

    let result;
    let transactionError;

    if (group_codes) {
      // New group codes format - use the new database function
      const { data: groupResult, error: groupError } = await supabaseAdmin
        .rpc('create_multi_group_submission_transaction', {
          p_quest_id: quest_id,
          p_submitter_user_id: session.user.id,
          p_telegram_file_id: telegram_file_id || '',
          p_telegram_message_id: telegram_message_id || 0,
          p_group_codes: group_codes
        });
      
      result = groupResult;
      transactionError = groupError;
      
    } else if (participant_pairs) {
      // Legacy participant pairs format - validate structure first
      for (const pair of participant_pairs) {
        if (!pair.user1_name || !pair.user2_name) {
          return NextResponse.json({ 
            error: 'Each pair must have user1_name and user2_name' 
          }, { status: 400 });
        }
      }

      // Use legacy database transaction
      const participantNames = participant_pairs.map((pair: { user1_name: string; user2_name: string }) => `${pair.user1_name} & ${pair.user2_name}`);
      
      const { data: legacyResult, error: legacyError } = await supabaseAdmin
        .rpc('create_group_submission_transaction', {
          p_quest_id: quest_id,
          p_submitter_user_id: session.user.id,
          p_telegram_file_id: telegram_file_id || '',
          p_telegram_message_id: telegram_message_id || 0,
          p_participant_names: participantNames
        });
      
      result = legacyResult;
      transactionError = legacyError;
    }

    if (transactionError) {
      console.error('Failed to create group submission transaction:', transactionError);
      return NextResponse.json({ 
        error: transactionError.message || 'Failed to create group submission' 
      }, { status: 500 });
    }

    if (!result) {
      return NextResponse.json({ 
        error: 'No result returned from transaction' 
      }, { status: 500 });
    }

    // Parse the JSON result from the database function
    const submissionResult = typeof result === 'string' ? JSON.parse(result) : result;
    const groupSubmissionId = submissionResult.group_submission_id;

    // Send notifications (this would need to be enhanced to handle actual user IDs)
    try {
      await sendGroupSubmissionNotification(
        groupSubmissionId,
        session.user.name || 'Unknown User',
        quest.title
      );
    } catch (notificationError) {
      console.error('Failed to send group notification:', notificationError);
      // Don't fail the request for notification errors
    }

    return NextResponse.json({
      submission_id: submissionResult.submission_id,
      group_submission_id: groupSubmissionId,
      quest_title: submissionResult.quest_title,
      participant_count: submissionResult.participant_count,
      participants: submissionResult.participants,
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
