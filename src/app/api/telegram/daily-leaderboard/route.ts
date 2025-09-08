import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { bot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request or from a cron service
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily leaderboard notification...');

    // Get top 5 users with their points
    const { data: topUsers, error: usersError } = await supabaseAdmin
      .from('user_points_view')
      .select(`
        user_id,
        name,
        total_points
      `)
      .neq('role', 'admin')
      .order('total_points', { ascending: false })
      .limit(5);

    if (usersError) {
      console.error('Error fetching leaderboard:', usersError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    if (!topUsers || topUsers.length === 0) {
      console.log('No users found for leaderboard');
      return NextResponse.json({ message: 'No users to notify' });
    }

    // Get all users with telegram_id to send notifications
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('telegram_id, name')
      .not('telegram_id', 'is', null)
      .neq('role', 'admin');

    if (allUsersError) {
      console.error('Error fetching users for notification:', allUsersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Format leaderboard message
    const currentDate = new Date().toLocaleDateString('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let message = `🏆 **Daily Leaderboard Update**\n`;
    message += `📅 ${currentDate}\n\n`;
    message += `**Top 5 Participants:**\n\n`;

    const trophies = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    topUsers.forEach((user, index) => {
      message += `${trophies[index]} ${user.name} - ${user.total_points} points\n`;
    });

    message += `Use /quests to see available challenges.`;

    // Send notification to all users
    const notifications = allUsers.map(async (user) => {
      try {
        if (user.telegram_id) {
          await bot.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
          console.log(`Sent leaderboard to ${user.name} (${user.telegram_id})`);
        }
      } catch (error) {
        console.error(`Failed to send to ${user.name}:`, error);
      }
    });

    await Promise.allSettled(notifications);

    console.log(`Leaderboard notifications sent to ${allUsers.length} users`);

    return NextResponse.json({ 
      message: 'Leaderboard notifications sent successfully',
      recipientCount: allUsers.length,
      topUsers: topUsers.map(u => ({ name: u.name, points: u.total_points }))
    });

  } catch (error) {
    console.error('Error in daily leaderboard notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow GET requests for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Daily leaderboard notification endpoint is active',
    info: 'Use POST with proper authorization to trigger notifications',
    timestamp: new Date().toISOString()
  });
}
