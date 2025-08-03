import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';
import { User, Quest, Submission } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    if (update.message) {
      await handleMessage(update.message);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text;
  const photo = message.photo;
  const userId = message.from.id;
  const username = message.from.username;

  if (text?.startsWith('/start')) {
    await handleStartCommand(chatId, userId, username);
  } else if (text?.startsWith('/submit')) {
    await handleSubmitCommand(chatId, text, photo, userId);
  } else if (text?.startsWith('/status')) {
    await handleStatusCommand(chatId, userId);
  } else if (text?.startsWith('/quests')) {
    await handleQuestsCommand(chatId);
  } else if (text?.startsWith('/leaderboard')) {
    await handleLeaderboardCommand(chatId);
  } else if (photo && text) {
    await handlePhotoSubmission(chatId, photo, text, userId, message.message_id);
  } else {
    await bot.sendMessage(chatId, 
      'Available commands:\n' +
      '/start - Link your account\n' +
      '/submit [quest_id] - Submit with photo\n' +
      '/status - Check your submissions\n' +
      '/quests - List available quests\n' +
      '/leaderboard - View top participants'
    );
  }
}

async function handleStartCommand(chatId: number, telegramId: number, username?: string) {
  try {
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (existingUser) {
      await bot.sendMessage(chatId, 
        `Welcome back, ${existingUser.name}! 🎉\n` +
        `Your account is already linked.\n` +
        `Points: ${existingUser.total_points}`
      );
    } else {
      await bot.sendMessage(chatId, 
        `Welcome to PGPals! 🎮\n\n` +
        `To link your account, please visit: ${process.env.NEXTAUTH_URL}/auth/telegram?telegram_id=${telegramId}&username=${username}\n\n` +
        `Or create a new account on our website and then use this bot.`
      );
    }
  } catch (error) {
    console.error('Start command error:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error. Please try again later.');
  }
}

async function handleQuestsCommand(chatId: number) {
  try {
    const { data: quests } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!quests || quests.length === 0) {
      await bot.sendMessage(chatId, 'No active quests available at the moment.');
      return;
    }

    let message = '🎯 **Available Quests:**\n\n';
    quests.forEach((quest: Quest) => {
      message += `**${quest.title}** (${quest.points} pts)\n`;
      message += `ID: \`${quest.id}\`\n`;
      message += `Category: ${quest.category}\n`;
      message += `${quest.description}\n\n`;
    });
    
    message += 'To submit: Send a photo with caption `/submit [quest_id]`';

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
    const questIdMatch = caption.match(/\/submit\s+([a-f0-9-]+)/);
    if (!questIdMatch) {
      await bot.sendMessage(chatId, 'Invalid format. Use: Send photo with caption `/submit [quest_id]`');
      return;
    }

    const questId = questIdMatch[1];

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (!user) {
      await bot.sendMessage(chatId, 
        'Please link your account first using /start command.'
      );
      return;
    }

    const { data: quest } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('status', 'active')
      .single();

    if (!quest) {
      await bot.sendMessage(chatId, 'Quest not found or inactive.');
      return;
    }

    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;

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
      console.error('Submission error:', error);
      await bot.sendMessage(chatId, 'Error creating submission. Please try again.');
      return;
    }

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