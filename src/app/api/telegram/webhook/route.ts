import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';
import { User, Quest, Submission } from '@/types';
import { parseQuestId, getQuestByNumericId } from '@/lib/questId';

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
        '🤖 **PGPals Bot Commands**\n\n' +
        '📋 **Setup Commands:**\n' +
        '/start - Get your Telegram ID for account linking\n\n' +
        '🎮 **Quest Commands:**\n' +
        '/quests - List top 5 available quests\n' +
        '/quests all - List more available quests\n' +
        '/submit [quest_id] - Submit quest with photo\n' +
        '/status - Check your submissions\n' +
        '/leaderboard - View top participants\n\n' +
        '⚠️ **Note:** You must create a web account first at ' + (process.env.NEXTAUTH_URL || 'https://pgpals.vercel.app') + ' and link it before using quest commands!',
        { parse_mode: 'Markdown' }
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
      console.log('Found existing user, calculating points and completed quests');
      
      // Calculate total points from approved submissions
      const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select(`
          quest:quests(points)
        `)
        .eq('user_id', existingUser.id)
        .in('status', ['approved', 'ai_approved']);
      
      const totalPoints = submissions?.reduce((sum, sub: any) => sum + (sub.quest?.points || 0), 0) || 0;
      
      // Count completed quests (approved submissions)
      const completedQuests = submissions?.length || 0;
      
      await bot.sendMessage(chatId, 
        `Welcome back, ${existingUser.name}! 🎉\n` +
        `Your account is already linked.\n` +
        `Total Points: ${totalPoints}\n` +
        `Team Quests Completed: ${completedQuests}\n\n` +
        `Try /quests to see available challenges!`
      );
    } else {
      console.log('New user, sending welcome message');
      await bot.sendMessage(chatId, 
        `Welcome to PGPals! 🎮\n\n` +
        `📋 **Important: Create your web account first!**\n\n` +
        `To get started:\n` +
        `1. Visit: ${process.env.NEXTAUTH_URL || 'https://pgpals.vercel.app'}\n` +
        `2. Create your account (Sign Up)\n` +
        `3. Go to your Profile page\n` +
        `4. Enter this Telegram ID: \`${telegramId}\`\n` +
        `${username ? `5. Optional: Enter username: \`${username}\`\n` : ''}` +
        `6. Click "Link Account" to connect\n\n` +
        `🔗 Once linked, you can:\n` +
        `• Submit quest photos directly here\n` +
        `• Check your status with /status\n` +
        `• View quests with /quests\n\n` +
        `⚠️ You must have a web account before using Telegram features!`, 
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
    const questIdMatch = caption.match(/\/submit\s+([a-zA-Z0-9-#]+)/);
    if (!questIdMatch) {
      await bot.sendMessage(chatId, 'Invalid format. Use: Send photo with caption `/submit [quest_id]` or `/submit #[number]`');
      return;
    }

    const questIdInput = questIdMatch[1];
    console.log('Processing quest submission for input:', questIdInput);
    
    // Parse the quest ID input (now expecting integers)
    const questId = parseQuestId(questIdInput);
    if (!questId) {
      await bot.sendMessage(chatId, `Invalid quest ID: ${questIdInput}. Please use a valid quest number (e.g., /submit 1 or /submit #1).`);
      return;
    }
    
    console.log('Parsed quest ID:', questId);
    
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (!user) {
      console.log('User not found for telegram_id:', telegramId);
      await bot.sendMessage(chatId, 
        '🚫 Account not linked!\n\n' +
        '1. Create account at: ' + (process.env.NEXTAUTH_URL || 'https://pgpals.vercel.app') + '\n' +
        '2. Use /start to get your Telegram ID\n' +
        '3. Enter that ID in your Profile page\n\n' +
        'You must link your account before submitting quests!'
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

    // Check for existing submissions
    const { data: existingSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('quest_id', questId)
      .order('submitted_at', { ascending: false });

    if (existingSubmissions && existingSubmissions.length > 0) {
      const latestSubmission = existingSubmissions[0];
      
      // Handle different existing submission statuses
      if (latestSubmission.status === 'approved' || latestSubmission.status === 'ai_approved') {
        await bot.sendMessage(chatId, 
          `🎉 This quest is already completed!\n\n` +
          `Quest: ${quest.title}\n` +
          `Status: ✅ Approved\n` +
          `Points earned: ${quest.points}\n\n` +
          `Your submission has been approved. No need to resubmit!`
        );
        return;
      } else if (latestSubmission.status === 'pending_ai' || latestSubmission.status === 'manual_review') {
        await bot.sendMessage(chatId, 
          `⏳ You already have a pending submission for this quest.\n\n` +
          `Quest: ${quest.title}\n` +
          `Status: Pending Review` +
          `Submitted: ${new Date(latestSubmission.submitted_at).toLocaleDateString()}\n\n` +
          `Please wait for your current submission to be reviewed before submitting again.`
        );
        return;
      } else if (latestSubmission.status === 'rejected' || latestSubmission.status === 'ai_rejected') {
        await bot.sendMessage(chatId, 
          `🔄 Thank you for resubmitting!\n\n` +
          `Quest: ${quest.title}\n` +
          `Previous submission was not approved. Processing your new submission...\n\n` +
          `💡 Tip: Make sure your photo clearly shows the quest requirement!`
        );
      }
    }

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
      `Status: Pending validation\n\n` +
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
    // Get user information
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (!user) {
      await bot.sendMessage(chatId, 
        '🚫 Account not linked!\n\n' +
        '1. Create account at: ' + (process.env.NEXTAUTH_URL || 'https://pgpals.vercel.app') + '\n' +
        '2. Use /start to get your Telegram ID\n' +
        '3. Enter that ID in your Profile page\n\n' +
        'You must link your account before checking status!'
      );
      return;
    }

    // Calculate total points from approved submissions
    const { data: approvedSubmissions } = await supabaseAdmin
      .from('submissions')
      .select(`
        quest:quests(points)
      `)
      .eq('user_id', user.id)
      .in('status', ['approved', 'ai_approved']);

    const totalPoints = approvedSubmissions?.reduce((sum: number, sub: any) => sum + (sub.quest?.points || 0), 0) || 0;
    const completedQuests = approvedSubmissions?.length || 0;

    // Get recent submissions for status display
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
    message += `Total Points: ${totalPoints}\n`;
    message += `Team Quests Completed: ${completedQuests}\n\n`;

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
    // Get all participants and calculate their points
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, telegram_username')
      .eq('role', 'participant');

    if (!users || users.length === 0) {
      await bot.sendMessage(chatId, 'No participants yet!');
      return;
    }

    // Calculate points for each user
    const userPointsPromises = users.map(async (user) => {
      const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select(`
          quest:quests(points)
        `)
        .eq('user_id', user.id)
        .in('status', ['approved', 'ai_approved']);

      const totalPoints = submissions?.reduce((sum: number, sub: any) => sum + (sub.quest?.points || 0), 0) || 0;
      
      return {
        ...user,
        total_points: totalPoints
      };
    });

    const usersWithPoints = await Promise.all(userPointsPromises);
    
    // Sort by points descending and take top 20
    const topUsers = usersWithPoints
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 20)
      .filter(user => user.total_points > 0); // Only show users with points

    if (topUsers.length === 0) {
      await bot.sendMessage(chatId, 'No participants with points yet!');
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