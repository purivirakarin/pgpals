import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active groups using the database function
    const { data: groups, error } = await supabaseAdmin
      .rpc('list_all_active_groups');

    if (error) {
      console.error('Groups fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }

    return NextResponse.json(groups || []);

  } catch (error) {
    console.error('Groups API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}