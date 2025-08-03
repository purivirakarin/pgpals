import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, feedback } = await request.json();
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get submission details first
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        quest:quests(points)
      `)
      .eq('id', params.id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const pointsAwarded = action === 'approve' ? submission.quest.points : 0;

    // Start a transaction to update both submission and user points
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: newStatus,
        admin_feedback: feedback || null,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        points_awarded: pointsAwarded
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update submission:', updateError);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    // Update user's total points if approved
    if (action === 'approve') {
      // Get current user total points
      const { data: userData, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('total_points')
        .eq('id', submission.user_id)
        .single();

      if (!userFetchError && userData) {
        const currentPoints = userData.total_points || 0;
        const newTotalPoints = currentPoints + submission.quest.points;

        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({ total_points: newTotalPoints })
          .eq('id', submission.user_id);

        if (userUpdateError) {
          console.error('Failed to update user points:', userUpdateError);
          // Don't fail the request, just log the error
        }
      }
    }

    // If rejecting a previously approved submission, subtract points
    if (action === 'reject' && submission.status === 'approved' && submission.points_awarded > 0) {
      const { data: userData, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('total_points')
        .eq('id', submission.user_id)
        .single();

      if (!userFetchError && userData) {
        const currentPoints = userData.total_points || 0;
        const newTotalPoints = Math.max(0, currentPoints - submission.points_awarded);

        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({ total_points: newTotalPoints })
          .eq('id', submission.user_id);

        if (userUpdateError) {
          console.error('Failed to update user points:', userUpdateError);
        }
      }
    }

    return NextResponse.json(updatedSubmission);

  } catch (error) {
    console.error('Submission review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}