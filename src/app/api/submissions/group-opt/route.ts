import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/submissions/group-opt - Opt in/out of group submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupSubmissionId, action } = await request.json();

    if (!groupSubmissionId || !['opt-in', 'opt-out'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Verify user is a participant in this group submission
    const { data: participant } = await supabaseAdmin
      .from('group_participants')
      .select('*')
      .eq('group_submission_id', groupSubmissionId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'You are not a participant in this group submission' }, { status: 403 });
    }

    if (action === 'opt-out') {
      const { error } = await supabaseAdmin
        .rpc('opt_out_group_submission', {
          p_user_id: userId,
          p_group_submission_id: groupSubmissionId
        });

      if (error) {
        console.error('Error opting out:', error);
        return NextResponse.json({ error: 'Failed to opt out' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully opted out of group submission. You and your partner will need to submit separately.' 
      });

    } else if (action === 'opt-in') {
      const { data: success, error } = await supabaseAdmin
        .rpc('opt_in_group_submission', {
          p_user_id: userId,
          p_group_submission_id: groupSubmissionId
        });

      if (error || !success) {
        console.error('Error opting in:', error);
        return NextResponse.json({ error: 'Failed to opt in. The group submission may no longer be valid.' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully opted back into group submission!' 
      });
    }

  } catch (error) {
    console.error('Error processing group opt request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
