import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { sendGroupSubmissionNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // For internal Telegram webhook calls, we need to authenticate differently
    let userId: string | undefined;
    if (session?.user) {
      userId = session.user.id;
    } else {
      // Check if this is a request from Telegram webhook with user context
      const { telegram_user_id } = body;
      if (telegram_user_id) {
        // Get user by telegram ID for webhook requests
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('telegram_id', telegram_user_id.toString())
          .single();
        
        if (user) {
          userId = String(user.id); // Ensure it's a string for consistency
        }
      }
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { 
      quest_id, 
      participant_pairs, 
      group_codes,
      telegram_file_id, 
      telegram_message_id 
    } = body;

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

    // Enhanced validation for group submissions
    if (group_codes) {
      // 3. Check for duplicate group submissions and cross-group validation
      
      // Get submitter's group information
      const { data: submitterUser } = await supabaseAdmin
        .from('users')
        .select('id, partner_id')
        .eq('id', userId)
        .single();

      if (!submitterUser) {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 400 });
      }

      // Get submitter's group
      const { data: submitterGroup } = await supabaseAdmin
        .from('partner_groups')
        .select('group_code')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('is_active', true)
        .single();

      if (!submitterGroup) {
        return NextResponse.json({ 
          error: 'User must be assigned to a group to submit group quests' 
        }, { status: 400 });
      }

      const submitterGroupCode = submitterGroup.group_code;
      
      // Check all groups involved in this submission (submitter's group + target groups)
      const allInvolvedGroups = [submitterGroupCode, ...group_codes];
      
      // Remove duplicates
      const uniqueGroups = Array.from(new Set(allInvolvedGroups));
      
      // Check if any of the involved groups have already submitted this quest
      // First get all group submissions for this quest
      const { data: existingGroupSubmissions } = await supabaseAdmin
        .from('group_submissions')
        .select(`
          id,
          quest_id,
          submission_id
        `)
        .eq('quest_id', quest_id);

      if (existingGroupSubmissions && existingGroupSubmissions.length > 0) {
        // For each existing group submission, check the submission status and involved groups
        for (const groupSubmission of existingGroupSubmissions) {
          // Get submission status
          const { data: submissionStatus } = await supabaseAdmin
            .from('submissions')
            .select('status')
            .eq('id', groupSubmission.submission_id)
            .in('status', ['approved', 'ai_approved', 'pending_ai', 'manual_review'])
            .not('is_deleted', 'eq', true)
            .single();

          if (submissionStatus) {
            // Get groups involved in this submission  
            const { data: participatingGroups } = await supabaseAdmin
              .from('group_participants')
              .select(`
                user_id,
                partner_id
              `)
              .eq('group_submission_id', groupSubmission.id);

            if (participatingGroups && participatingGroups.length > 0) {
              // Get the group codes for users involved in this submission
              const userIds = participatingGroups.flatMap(p => [p.user_id, p.partner_id].filter(Boolean));
              
              const { data: existingGroupData } = await supabaseAdmin
                .from('partner_groups')
                .select('group_code')
                .or(userIds.map(id => `user1_id.eq.${id},user2_id.eq.${id}`).join(','))
                .eq('is_active', true);
                
              const existingGroupCodes = existingGroupData?.map(g => g.group_code) || [];
              
              // Check for overlap
              const hasOverlap = uniqueGroups.some(groupCode => existingGroupCodes.includes(groupCode));
              
              if (hasOverlap) {
                const overlappingGroups = uniqueGroups.filter(groupCode => existingGroupCodes.includes(groupCode));
                
                if (submissionStatus.status === 'approved' || submissionStatus.status === 'ai_approved') {
                  return NextResponse.json({ 
                    error: `Quest already completed by group(s): ${overlappingGroups.join(', ')}. Groups can only submit each quest once.` 
                  }, { status: 400 });
                } else if (submissionStatus.status === 'pending_ai' || submissionStatus.status === 'manual_review') {
                  return NextResponse.json({ 
                    error: `Quest submission already pending for group(s): ${overlappingGroups.join(', ')}. Wait for current review to complete.` 
                  }, { status: 400 });
                }
              }
            }
          }
        }
      }
      
      // Validate that all target groups exist and are active
      const { data: targetGroups } = await supabaseAdmin
        .from('partner_groups')
        .select('group_code, user1_id, user2_id')
        .in('group_code', group_codes)
        .eq('is_active', true);
      
      if (!targetGroups || targetGroups.length !== group_codes.length) {
        const foundCodes = targetGroups?.map(g => g.group_code) || [];
        const missingCodes = group_codes.filter((code: string) => !foundCodes.includes(code));
        return NextResponse.json({ 
          error: `Invalid or inactive group codes: ${missingCodes.join(', ')}` 
        }, { status: 400 });
      }
    }

    let result;
    let transactionError;

    if (group_codes) {
      // New group codes format - use the new database function
      const { data: groupResult, error: groupError } = await supabaseAdmin
        .rpc('create_multi_group_submission_transaction', {
          p_quest_id: quest_id,
          p_submitter_user_id: parseInt(userId),
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
      
      // For legacy format, we still need to check for duplicate submissions
      // This is a simplified check since legacy format doesn't have group codes
      const { data: existingLegacySubmissions } = await supabaseAdmin
        .from('group_submissions')
        .select(`
          id,
          quest_id,
          submitter_user_id,
          submissions!group_submissions_submission_id_fkey(status)
        `)
        .eq('quest_id', quest_id)
        .eq('submitter_user_id', parseInt(userId))
        .in('submissions.status', ['approved', 'ai_approved', 'pending_ai', 'manual_review']);

      if (existingLegacySubmissions && existingLegacySubmissions.length > 0) {
        const existingSubmission = existingLegacySubmissions[0];
        const submissionStatus = (existingSubmission as any).submissions?.status;
        
        if (submissionStatus === 'approved' || submissionStatus === 'ai_approved') {
          return NextResponse.json({ 
            error: 'You have already completed this quest in a group submission.' 
          }, { status: 400 });
        } else if (submissionStatus === 'pending_ai' || submissionStatus === 'manual_review') {
          return NextResponse.json({ 
            error: 'You already have a pending group submission for this quest.' 
          }, { status: 400 });
        }
      }

      // Use legacy database transaction
      const participantNames = participant_pairs.map((pair: { user1_name: string; user2_name: string }) => `${pair.user1_name} & ${pair.user2_name}`);
      
      const { data: legacyResult, error: legacyError } = await supabaseAdmin
        .rpc('create_group_submission_transaction', {
          p_quest_id: quest_id,
          p_submitter_user_id: parseInt(userId),
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

    // Send notifications
    try {
      // Get user name for notification
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', parseInt(userId))
        .single();
      
      await sendGroupSubmissionNotification(
        groupSubmissionId,
        user?.name || 'Unknown User',
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
