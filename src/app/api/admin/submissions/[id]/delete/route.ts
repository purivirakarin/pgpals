import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Get the submission details
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('user_id, quest_id, is_group_submission, group_submission_id, is_deleted')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if already deleted
    if (submission.is_deleted) {
      return NextResponse.json({ error: 'Submission is already deleted' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const isOwner = submission.user_id === userId;
    const isAdmin = session.user.role === 'admin';

    // Check permissions: owner can delete their own submissions, admins can delete any
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'You can only delete your own submissions' }, { status: 403 });
    }

    // If this is a group submission, opt out all participants instead of deleting
    if (submission.is_group_submission && submission.group_submission_id) {
      // Mark all group participants as opted out
      await supabaseAdmin
        .from('group_participants')
        .update({
          opted_out: true,
          opted_out_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('group_submission_id', submission.group_submission_id);
    }

    // Soft delete the submission instead of actually deleting it
    const { error: deleteError } = await supabaseAdmin
      .from('submissions')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', submissionId);

    if (deleteError) {
      console.error('Error deleting submission:', deleteError);
      return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
    }

    // Log the deletion activity
    await supabaseAdmin
      .from('activities')
      .insert({
        user_id: submission.user_id,
        activity_type: 'submission_deleted',
        description: `Submission deleted ${isOwner ? 'by user' : 'by admin'}`,
        quest_id: submission.quest_id,
        submission_id: submissionId,
        created_by: userId,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Submission deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
