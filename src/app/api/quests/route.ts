import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Quest } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is admin and no status specified, return all quests
    // If user is admin and status specified, filter by status
    // If user is not admin, only return active quests
    if (session?.user?.role === 'admin') {
      if (status) {
        query = query.eq('status', status);
      }
      // No filter for admin means all quests
    } else {
      // Non-admin users only see active quests
      query = query.eq('status', 'active');
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: quests, error } = await query;

    if (error) {
      console.error('Quests fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
    }

    return NextResponse.json(quests || []);
  } catch (error) {
    console.error('Quests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, points, requirements, validation_criteria } = body;

    if (!title || !category || !points) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: quest, error } = await supabaseAdmin
      .from('quests')
      .insert({
        title,
        description,
        category,
        points: parseInt(points),
        requirements,
        validation_criteria: validation_criteria || {},
        created_by: session.user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Quest creation error:', error);
      return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 });
    }

    return NextResponse.json(quest, { status: 201 });
  } catch (error) {
    console.error('Quest creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}