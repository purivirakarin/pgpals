import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the expire_quests function
    const { data, error } = await supabaseAdmin.rpc('expire_quests');

    if (error) {
      console.error('Error expiring quests:', error);
      return NextResponse.json({ error: 'Failed to expire quests' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully expired ${data} quest(s)`,
      expired_count: data 
    });

  } catch (error) {
    console.error('Quest expiration API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// For debugging - get list of expired quests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get expired quest information for debugging
    const { data, error } = await supabaseAdmin.rpc('check_expired_quests');

    if (error) {
      console.error('Error checking expired quests:', error);
      return NextResponse.json({ error: 'Failed to check expired quests' }, { status: 500 });
    }

    return NextResponse.json({ 
      current_time: new Date().toISOString(),
      quests: data 
    });

  } catch (error) {
    console.error('Quest expiration check API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
