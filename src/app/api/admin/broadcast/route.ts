import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { telegramService } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message is required and must be a non-empty string' 
      }, { status: 400 });
    }

    if (message.trim().length > 4000) {
      return NextResponse.json({ 
        error: 'Message is too long. Maximum 4000 characters allowed.' 
      }, { status: 400 });
    }

    const adminUserId = parseInt(session.user.id);
    
    // Send the broadcast
    const result = await telegramService.broadcastToAllUsers(message.trim(), adminUserId);

    // Log the broadcast activity
    try {
      await supabaseAdmin
        .from('activities')
        .insert([
          {
            user_id: adminUserId,
            activity_type: 'admin_broadcast',
            description: `Sent broadcast message to ${result.sent} users (${result.failed} failed)`,
            created_by: adminUserId,
            created_at: new Date().toISOString(),
            metadata: {
              broadcast_stats: result,
              message_preview: message.slice(0, 100) + (message.length > 100 ? '...' : '')
            }
          }
        ]);
    } catch (activityError) {
      console.error('Failed to log broadcast activity:', activityError);
      // Continue anyway - the broadcast was successful
    }

    return NextResponse.json({
      success: true,
      message: 'Broadcast sent successfully',
      stats: result
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ 
      error: 'Failed to send broadcast message' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get count of users with telegram accounts
    const { data: telegramUsers, error } = await supabaseAdmin
      .from('users')
      .select('id, name, telegram_username')
      .not('telegram_id', 'is', null);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      total_telegram_users: telegramUsers?.length || 0,
      users: telegramUsers?.map(user => ({
        id: user.id,
        name: user.name,
        telegram_username: user.telegram_username
      })) || []
    });

  } catch (error) {
    console.error('Error fetching broadcast info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch broadcast information' 
    }, { status: 500 });
  }
}
