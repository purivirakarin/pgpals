import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/submissions/group-status/:questId - Get group submission status for a quest
export async function GET(
  request: NextRequest,
  { params }: { params: { questId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questId = parseInt(params.questId);
    if (isNaN(questId)) {
      return NextResponse.json({ error: 'Invalid quest ID' }, { status: 400 });
    }

    // Check if quest is multiple-pair category
    const { data: quest } = await supabaseAdmin
      .from('quests')
      .select('category, title')
      .eq('id', questId)
      .single();

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    if (quest.category !== 'multiple-pair') {
      return NextResponse.json({ error: 'Group submissions only available for multiple-pair quests' }, { status: 400 });
    }

    // Get group submission for this quest
    const { data: groupSubmission } = await supabaseAdmin
      .from('group_submissions')
      .select(`
        *,
        submission:submissions(*),
        submitter:users!submitter_user_id(id, name, telegram_username)
      `)
      .eq('quest_id', questId)
      .single();

    if (!groupSubmission) {
      return NextResponse.json({ 
        hasGroupSubmission: false,
        quest: quest
      });
    }

    // Get all participants
    const { data: participants } = await supabaseAdmin
      .from('group_participants')
      .select(`
        *,
        user:users!user_id(id, name, telegram_username, partner_id),
        partner:users!partner_id(id, name, telegram_username)
      `)
      .eq('group_submission_id', groupSubmission.id);

    // Check if current user is a participant
    const currentUserParticipant = participants?.find(p => p.user_id === parseInt(session.user.id));

    return NextResponse.json({
      hasGroupSubmission: true,
      quest: quest,
      groupSubmission: {
        id: groupSubmission.id,
        submitter: groupSubmission.submitter,
        submission: groupSubmission.submission,
        created_at: groupSubmission.created_at
      },
      participants: participants || [],
      currentUserStatus: currentUserParticipant ? {
        isParticipant: true,
        optedOut: currentUserParticipant.opted_out,
        canOptOut: groupSubmission.submission.status !== 'rejected',
        canOptIn: currentUserParticipant.opted_out && ['pending_ai', 'manual_review', 'approved', 'ai_approved'].includes(groupSubmission.submission.status)
      } : {
        isParticipant: false,
        optedOut: false,
        canOptOut: false,
        canOptIn: false
      }
    });

  } catch (error) {
    console.error('Error getting group submission status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
