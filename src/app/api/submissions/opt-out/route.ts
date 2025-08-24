import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { group_submission_id, opted_out } = body;

    if (!group_submission_id || typeof opted_out !== 'boolean') {
      return NextResponse.json({ 
        error: 'Missing required fields: group_submission_id and opted_out (boolean)' 
      }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    // Verify that the user is a participant in this group submission
    const { data: participation } = await supabaseAdmin
      .from('group_participants')
      .select(`
        id,
        group_submissions!inner(
          id,
          submitter_user_id,
          quest_id,
          submissions!inner(status)
        )
      `)
      .eq('group_submission_id', group_submission_id)
      .eq('user_id', userId)
      .single();

    if (!participation) {
      return NextResponse.json({ 
        error: 'You are not a participant in this group submission' 
      }, { status: 403 });
    }

    const groupSubmission = participation.group_submissions as any;
    const submission = groupSubmission.submissions;

    // Prevent submitter from opting out
    if (groupSubmission.submitter_user_id === userId) {
      return NextResponse.json({ 
        error: 'The submitter cannot opt out of their own submission' 
      }, { status: 400 });
    }

    // Prevent opting out of completed submissions
    if (submission.status === 'approved' || submission.status === 'ai_approved') {
      return NextResponse.json({ 
        error: 'Cannot opt out of completed submissions' 
      }, { status: 400 });
    }

    // Update the opt-out status
    const { error: updateError } = await supabaseAdmin
      .from('group_participants')
      .update({
        opted_out: opted_out,
        opted_out_at: opted_out ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', participation.id);

    if (updateError) {
      console.error('Failed to update opt-out status:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update opt-out status' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: opted_out ? 'Successfully opted out of group submission' : 'Successfully opted back into group submission'
    });

  } catch (error) {
    console.error('Opt-out error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
