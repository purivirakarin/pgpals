import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: quest, error } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    return NextResponse.json(quest);
  } catch (error) {
    console.error('Quest fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, points, requirements, validation_criteria, status, expires_at } = body;

    // Get current quest data to check if points are changing
    const { data: currentQuest, error: fetchError } = await supabaseAdmin
      .from('quests')
      .select('points')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentQuest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (points !== undefined) updateData.points = parseInt(points);
    if (requirements !== undefined) updateData.requirements = requirements;
    if (validation_criteria !== undefined) updateData.validation_criteria = validation_criteria;
    if (status !== undefined) updateData.status = status;
    
    // Handle expires_at - allow setting it to null if empty string is provided
    if (expires_at !== undefined) {
      updateData.expires_at = expires_at && expires_at.trim() !== '' ? expires_at : null;
    }

    const { data: quest, error } = await supabaseAdmin
      .from('quests')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Quest update error:', error);
      return NextResponse.json({ error: 'Failed to update quest' }, { status: 500 });
    }

    // If points were changed, the user_points_view will automatically reflect the new totals
    if (points !== undefined && parseInt(points) !== currentQuest.points) {
      console.log(`Quest ${params.id} points changed from ${currentQuest.points} to ${parseInt(points)}. User points will be automatically updated via database view.`);
    }

    return NextResponse.json(quest);
  } catch (error) {
    console.error('Quest update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get all users who have approved submissions for this quest
    // so we can recalculate their points after deletion
    const { data: affectedSubmissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('user_id, points_awarded')
      .eq('quest_id', params.id)
      .eq('status', 'approved');

    if (submissionsError) {
      console.error('Error fetching affected submissions:', submissionsError);
      // Continue with deletion even if we can't fetch submissions
    }

    // Delete the quest (this will also cascade delete submissions if FK is set up with CASCADE)
    const { error } = await supabaseAdmin
      .from('quests')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Quest deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 });
    }

    // Points are now automatically calculated via database view
    // No manual recalculation needed when quest is deleted
    if (affectedSubmissions && affectedSubmissions.length > 0) {
      console.log(`Quest ${params.id} deleted. Points for ${affectedSubmissions.length} submissions will be automatically updated in user_points_view`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quest deletion API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}