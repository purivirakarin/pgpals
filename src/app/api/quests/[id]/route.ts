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
    const { title, description, category, points, requirements, validation_criteria, status } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (points !== undefined) updateData.points = parseInt(points);
    if (requirements !== undefined) updateData.requirements = requirements;
    if (validation_criteria !== undefined) updateData.validation_criteria = validation_criteria;
    if (status !== undefined) updateData.status = status;

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

    const { error } = await supabaseAdmin
      .from('quests')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Quest deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quest deletion API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}