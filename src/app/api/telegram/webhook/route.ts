import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';
import { User, Quest, Submission } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook received request');
    const update = await request.json();
    console.log('Webhook update:', JSON.stringify(update, null, 2));
    
    if (update.message) {
      console.log('Processing message:', update.message);
      await handleMessage(update.message);
    } else {
      console.log('No message in update');
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Telegram webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

async function handleMessage(message: any) {
  try {
    const chatId = message.chat.id;
    const text = message.text;
    const caption = message.caption;
    const photo = message.photo;
    const userId = message.from.id;
    const username = message.from.username;

    console.log(`Processing message from user ${userId} (${username}): "${text || caption}"`);

    if (text?.startsWith('/start')) {
      console.log('Handling /start command');
      await handleStartCommand(chatId, userId, username);
    } else if (text?.startsWith('/submit')) {
      console.log('Handling /submit command (text only)');
      await handleSubmitCommand(chatId, text, photo, userId);
    } else if (photo && caption?.startsWith('/submit')) {
      console.log('Handling photo submission with /submit caption');
      await handlePhotoSubmission(chatId, photo, caption, userId, message.message_id);
    } else if (text?.startsWith('/status')) {
      console.log('Handling /status command');
      await handleStatusCommand(chatId, userId);
    } else if (text?.startsWith('/quests')) {
      console.log('Handling /quests command');
      const parts = text.split(' ');
      const showAll = parts.length > 1 && parts[1] === 'all';
      await handleQuestsCommand(chatId, userId, showAll);
    } else if (text?.startsWith('/leaderboard')) {
      console.log('Handling /leaderboard command');
      await handleLeaderboardCommand(chatId);
    } else if (photo && caption) {
      console.log('Handling photo with caption (non-submit)');
      await bot.sendMessage(chatId, 'To submit a quest, use caption format: `/submit [quest_id]`');
    } else {
      console.log('Sending help message');
      await bot.sendMessage(chatId, 
        'Available commands:\n' +
        '/start - Link your account\n' +
        '/submit [quest_id] - Submit with photo\n' +
        '/status - Check your submissions\n' +
        '/quests - List top 5 available quests\n' +
        '/quests all - List more available quests\n' +
        '/leaderboard - View top participants'
      );
    }
  } catch (error) {
    console.error('Error in handleMessage:', error);
    // Send error message to user
    try {
      await bot.sendMessage(message.chat.id, 'Sorry, there was an error processing your message. Please try again.');
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

async function handleStartCommand(chatId: number, telegramId: number, username?: string) {
  try {
    console.log(`Start command for user ${telegramId} (${username})`);
    
    // Test bot sending capability first
    await bot.sendMessage(chatId, 'Processing your /start command... 🤖');
    
    console.log('Checking for existing user in database...');
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    console.log('User query result:', { existingUser, userError });

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new users
      console.error('Database error:', userError);
      throw userError;
    }

    if (existingUser) {
      console.log('Found existing user, sending welcome back message');
      await bot.sendMessage(chatId, 
        `Welcome back, ${existingUser.name}! 🎉\n` +
        `Your account is already linked.\n` +
        `Points: ${existingUser.total_points}\n\n` +
        `Try /quests to see available challenges!`
      );
    } else {
      console.log('New user, sending welcome message');
      await bot.sendMessage(chatId, 
        `Welcome to PGPals! 🎮\n\n` +
        `To link your account:\n` +
        `1. Visit: ${process.env.NEXTAUTH_URL || 'https://pgpals.vercel.app'}\n` +
        `2. Sign up or sign in\n` +
        `3. Go to your Profile page\n` +
        `4. Enter this Telegram ID: \`${telegramId}\`\n` +
        `${username ? `5. Optional: Enter username: \`${username}\`\n` : ''}` +
        `\n🔗 Once linked, you can:\n` +
        `• Submit quest photos directly here\n` +
        `• Check your status with /status\n` +
        `• View quests with /quests\n\n` +
        `Try /quests to see what's available!`, 
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Start command error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await bot.sendMessage(chatId, 
      `Sorry, there was an error: ${errorMsg}\n\n` +
      `Please try again or contact support.`
    );
  }
}

async function handleQuestsCommand(chatId: number, userId: string, showAll: boolean = false) {
  try {
    // First, get the user's completed/approved submissions
    const { data: completedSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('quest_id')
      .eq('user_id', userId)
      .eq('status', 'approved');

    const completedQuestIds = completedSubmissions?.map(s => s.quest_id) || [];

    // Get active quests that the user hasn't completed, ordered by points (highest first)
    let query = supabaseAdmin
      .from('quests')
      .select('*')
      .eq('status', 'active')
      .order('points', { ascending: false });

    // Limit to 5 unless showAll is true
    if (!showAll) {
      query = query.limit(5);
    } else {
      query = query.limit(15); // Cap at 15 even for "all" to prevent message limits
    }

    // Exclude completed quests if there are any
    if (completedQuestIds.length > 0) {
      query = query.not('id', 'in', `(${completedQuestIds.join(',')})`);
    }

    const { data: quests } = await query;

    if (!quests || quests.length === 0) {
      await bot.sendMessage(chatId, '🎯 No new quests available! You might have completed all available quests.');
      return;
    }

    let message = showAll ? 
      '🎯 **All Available Quests** (by Points):\n\n' : 
      '🎯 **Top Available Quests** (Top 5 by Points):\n\n';
    
    quests.forEach((quest: Quest, index: number) => {
      message += `${index + 1}. **${quest.title}** (${quest.points} pts)\n`;
      message += `ID: \`${quest.id}\`\n`;
      message += `Category: ${quest.category}\n`;
      // Truncate description to prevent message being too long
      const maxDescLength = showAll ? 80 : 100;
      message += `${quest.description.length > maxDescLength ? quest.description.substring(0, maxDescLength) + '...' : quest.description}\n\n`;
    });
    
    message += '📸 To submit: Send a photo with caption `/submit [quest_id]`\n';
    message += '💡 Only showing quests you haven\'t completed yet!\n';
    
    if (!showAll && quests.length === 5) {
      message += '\n📋 Use `/quests all` to see more quests';
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Quests command error:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error fetching quests.');
  }
}

async function handleSubmitCommand(chatId: number, text: string, photo: any, telegramId: number) {
  if (!photo) {
    await bot.sendMessage(chatId, 
      'Please send a photo with your submission.\n' +
      'Format: Send photo with caption `/submit [quest_id]`'
    );
    return;
  }

  const questId = text.split(' ')[1];
  if (!questId) {
    await bot.sendMessage(chatId, 'Please specify a quest ID. Format: `/submit [quest_id]`');
    return;
  }

  await handlePhotoSubmission(chatId, photo, `/submit ${questId}`, telegramId, 0);
}

async function handlePhotoSubmission(
  chatId: number, 
  photo: any[], 
  caption: string, 
  telegramId: number, 
  messageId: number
) {
  try {
    const questIdMatch = caption.match(/\/submit\s+([a-zA-Z0-9-]+)/);
    if (!questIdMatch) {
      await bot.sendMessage(chatId, 'Invalid format. Use: Send photo with caption `/submit [quest_id]`');
      return;
    }

    const questId = questIdMatch[1];
    console.log('Processing quest submission for ID:', questId);
    
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (!user) {
      console.log('User not found for telegram_id:', telegramId);
      await bot.sendMessage(chatId, 
        'Please link your account first using /start command.'
      );
      return;
    }
    
    console.log('Found user:', user.id, user.name);

    const { data: quest } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('status', 'active')
      .single();

    if (!quest) {
      console.log('Quest not found or inactive for ID:', questId);
      await bot.sendMessage(chatId, 'Quest not found or inactive.');
      return;
    }
    
    console.log('Found quest:', quest.id, quest.title);

    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;
    console.log('Photo file ID:', fileId);

    console.log('Inserting submission into database...');
    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        user_id: user.id,
        quest_id: questId,
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        status: 'pending_ai',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Submission database error:', error);
      await bot.sendMessage(chatId, 'Error creating submission. Please try again.');
      return;
    }
    
    console.log('Submission created successfully:', submission);

    await bot.sendMessage(chatId, 
      `✅ Submission received!\n\n` +
      `Quest: ${quest.title}\n` +
      `Submission ID: ${submission.id}\n` +
      `Status: Pending AI validation\n\n` +
      `You'll be notified when it's processed.`
    );

    if (process.env.ADMIN_TELEGRAM_ID) {
      await bot.sendMessage(process.env.ADMIN_TELEGRAM_ID, 
        `🔔 New submission:\n` +
        `User: ${user.name}\n` +
        `Quest: ${quest.title}\n` +
        `ID: ${submission.id}`
      );
    }

  } catch (error) {
    console.error('Photo submission error:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your submission.');
  }
}

async function handleStatusCommand(chatId: number, telegramId: number) {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (!user) {
      await bot.sendMessage(chatId, 'Please link your account first using /start command.');
      return;
    }

    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        quest:quests(title, points)
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(10);

    let message = `📊 **Your Status:**\n\n`;
    message += `Total Points: ${user.total_points}\n`;
    message += `Streak: ${user.streak_count}\n\n`;

    if (submissions && submissions.length > 0) {
      message += `**Recent Submissions:**\n`;
      submissions.forEach((sub: any) => {
        const statusEmoji = getStatusEmoji(sub.status);
        message += `${statusEmoji} ${sub.quest.title} - ${sub.status}\n`;
      });
    } else {
      message += 'No submissions yet. Start with /quests to see available quests!';
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Status command error:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error fetching your status.');
  }
}

async function handleLeaderboardCommand(chatId: number) {
  try {
    const { data: topUsers } = await supabaseAdmin
      .from('users')
      .select('name, telegram_username, total_points')
      .eq('role', 'participant')
      .order('total_points', { ascending: false })
      .limit(20);

    if (!topUsers || topUsers.length === 0) {
      await bot.sendMessage(chatId, 'No participants yet!');
      return;
    }

    let message = '🏆 **Leaderboard - Top 20**\n\n';
    topUsers.forEach((user: any, index: number) => {
      const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
      const displayName = user.telegram_username ? `@${user.telegram_username}` : user.name;
      message += `${medal} ${displayName} - ${user.total_points} pts\n`;
    });

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Leaderboard command error:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error fetching the leaderboard.');
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pending_ai': return '⏳';
    case 'ai_approved': 
    case 'approved': return '✅';
    case 'ai_rejected':
    case 'rejected': return '❌';
    case 'manual_review': return '👁️';
    default: return '❓';
  }
}