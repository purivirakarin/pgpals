import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const userId = searchParams.get('user_id');
    
    // Build query
    let query = supabaseAdmin
      .from('recent_activities_view')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by activity type if specified
    if (type) {
      query = query.eq('type', type);
    }

    // Filter by user if specified (for user-specific activity feeds)
    if (userId) {
      if (session.user.role !== 'admin' && session.user.id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Filter by user_id OR created_by (fallback for different activity types)
      query = query.or(`user_id.eq.${userId},created_by.eq.${userId}`);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('Activities fetch error:', error);
      
      // Check if it's a missing table/view error
      if (error.code === '42703' || error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Activity system not configured. Please run the database migration for activities.',
          details: error.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    return NextResponse.json(activities || []);
  } catch (error) {
    console.error('Activities API error:', error);
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
    const { 
      type, 
      user_id, 
      target_user_id, 
      quest_id, 
      submission_id, 
      description, 
      points_change = 0, 
      metadata = {} 
    } = body;

    // Validate required fields
    if (!type || !description) {
      return NextResponse.json({ 
        error: 'Type and description are required' 
      }, { status: 400 });
    }

    // Insert activity using the log_activity function
    const { data, error } = await supabaseAdmin.rpc('log_activity', {
      p_type: type,
      p_user_id: user_id,
      p_target_user_id: target_user_id,
      p_quest_id: quest_id,
      p_submission_id: submission_id,
      p_description: description,
      p_points_change: points_change,
      p_metadata: metadata,
      p_created_by: session.user.id
    });

    if (error) {
      console.error('Activity creation error:', error);
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
    }

    return NextResponse.json({ id: data, success: true });
  } catch (error) {
    console.error('Activities POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
