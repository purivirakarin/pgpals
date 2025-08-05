import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request or from a cron service
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting quest expiration check...');

    // Call the database function to expire quests
    const { data, error } = await supabaseAdmin.rpc('expire_quests');

    if (error) {
      console.error('Error expiring quests:', error);
      return NextResponse.json({ error: 'Failed to expire quests' }, { status: 500 });
    }

    const expiredCount = data || 0;
    console.log(`Expired ${expiredCount} quests`);

    return NextResponse.json({ 
      message: 'Quest expiration check completed',
      expiredCount: expiredCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in quest expiration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow GET requests for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Quest expiration endpoint is active',
    info: 'Use POST with proper authorization to trigger expiration check',
    timestamp: new Date().toISOString()
  });
}
