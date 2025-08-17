import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/submissions/pair-status/:questId - Get submission status for user's pair for a specific quest
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

    // Use the database function to get user quest status
    const { data: statusData, error } = await supabaseAdmin
      .rpc('get_user_quest_status', {
        p_user_id: parseInt(session.user.id),
        p_quest_id: questId
      });

    if (error) {
      console.error('Error getting user quest status:', error);
      return NextResponse.json({ error: 'Failed to get quest status' }, { status: 500 });
    }

    // Get the quest details
    const { data: quest } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    const status = statusData?.[0] || {
      status: 'available',
      submission_id: null,
      submitted_by: null,
      submitted_at: null,
      can_opt_out: false,
      group_submission_id: null
    };

    return NextResponse.json({
      quest,
      status: status.status,
      submission_id: status.submission_id,
      submitted_by: status.submitted_by,
      submitted_at: status.submitted_at,
      can_opt_out: status.can_opt_out,
      group_submission_id: status.group_submission_id
    });

  } catch (error) {
    console.error('Error getting pair submission status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
