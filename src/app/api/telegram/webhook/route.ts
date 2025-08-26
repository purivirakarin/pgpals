import { NextRequest, NextResponse } from 'next/server';
import { bot, telegramService } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';
import { sendAdminNotification } from '@/lib/notifications';
import { User, Quest, Submission } from '@/types';
import { parseQuestId, getQuestByNumericId } from '@/lib/questId';

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

    if (text?.startsWith('/start')) {
      await handleStartCommand(chatId, userId, username);
    } else if (text?.startsWith('/submit')) {
      await handleSubmitCommand(chatId, text, photo, userId);
    } else if (photo && caption?.startsWith('/submit')) {
      await handlePhotoSubmission(chatId, photo, caption, userId, message.message_id);
    } else if (text?.startsWith('/status')) {
      await handleStatusCommand(chatId, userId);
    } else if (text?.startsWith('/quests')) {
      const parts = text.split(' ');
      const showAll = parts.length > 1 && parts[1] === 'all';
      await handleQuestsCommand(chatId, userId, showAll);
    } else if (text?.startsWith('/leaderboard')) {
      await handleLeaderboardCommand(chatId);
    } else if (text?.startsWith('/groups')) {
      await handleGroupsCommand(chatId, userId);
    } else if (photo && caption) {
      await safeSendMessage(chatId, '📸 Use: `/submit [quest_id]` as photo caption');
    } else {
      const webAppUrl = 'https://pgpals.vercel.app';
      await safeSendMessage(chatId, 
        '**PGPals Bot**\n\n' +
        '`/quests` - View challenges\n' +
        '`/submit [id]` - Upload proof\n' +
        '`/status` - Check progress\n' +
        '`/leaderboard` - Rankings\n' +
        '`/groups` - View group codes\n\n' +
        `[Visit Web App](${webAppUrl}) | [Help Guide](${webAppUrl}/help)\n\n` +
        '⚠️ Link your account first with `/start`',
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Error in handleMessage:', error);
    // Send error message to user
    try {
      await safeSendMessage(message.chat.id, '❌ Error processing message. Try again?');
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

async function handleStartCommand(chatId: number, telegramId: number, username?: string) {
  try {
    await bot.sendMessage(chatId, '⚡ Connecting...');
    
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new users
      console.error('Database error:', userError);
      throw userError;
    }

    if (existingUser) {
      
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
      
      const webAppUrl = 'https://pgpals.vercel.app';
      await bot.sendMessage(chatId, 
        `🎉 Welcome back, ${existingUser.name}!\n` +
        `⭐ ${totalPoints} pts | ✅ ${completedQuests} quests\n\n` +
        `🎮 Try /quests for new challenges\n` +
        `🌐 [Visit Web App](${webAppUrl})`
      );
    } else {
      const webAppUrl = 'https://pgpals.vercel.app';
      await bot.sendMessage(chatId, 
        `🎮 Welcome to PGPals!\n\n` +
        `📋 **Setup Required:**\n` +
        `1. [Create Account](${webAppUrl}/auth/signup)\n` +
        `2. Go to Profile → Link Account\n` +
        `3. Enter ID: \`${telegramId}\`\n` +
        `${username ? `4. Username: \`${username}\`\n` : ''}\n` +
        `🔗 Then use: /quests, /submit, /status\n` +
        `📖 [Help Guide](${webAppUrl}/help)`, 
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Start command error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await bot.sendMessage(chatId, 
      `❌ Error: ${errorMsg}\n\n` +
      `Try again or contact support`
    );
  }
}

async function handleQuestsCommand(chatId: number, userId: string, showAll: boolean = false) {
  try {
    // Get user information including partner details
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', userId.toString())
      .single();

    if (!user) {
      const webAppUrl = 'https://pgpals.vercel.app';
      await bot.sendMessage(chatId, 
        '🚫 Account not linked\n\n' +
        `1. [Create Account](${webAppUrl}/auth/signup)\n` +
        '2. Use /start for setup\n' +
        `📖 [Help Guide](${webAppUrl}/help)`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Get user's completed/approved submissions
    const { data: userCompletedSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('quest_id')
      .eq('user_id', user.id)
      .in('status', ['approved', 'ai_approved']);

    let excludedQuestIds = userCompletedSubmissions?.map(s => s.quest_id) || [];

    // If user has a partner, also exclude quests completed or pending by partner
    if (user.partner_id) {
      const { data: partnerSubmissions } = await supabaseAdmin
        .from('submissions')
        .select('quest_id')
        .eq('user_id', user.partner_id)
        .in('status', ['approved', 'ai_approved', 'pending_ai', 'manual_review']);

      const partnerQuestIds = partnerSubmissions?.map(s => s.quest_id) || [];
      excludedQuestIds = [...excludedQuestIds, ...partnerQuestIds];
      
      // Remove duplicates
      excludedQuestIds = Array.from(new Set(excludedQuestIds));
    }

    // Get active quests that haven't been completed/submitted by user or partner
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

    // Exclude completed/pending quests if there are any
    if (excludedQuestIds.length > 0) {
      query = query.not('id', 'in', `(${excludedQuestIds.join(',')})`);
    }

    const { data: quests } = await query;

    if (!quests || quests.length === 0) {
      const partnerNote = user.partner_id ? ' (including quests your partner has submitted/completed)' : '';
      await bot.sendMessage(chatId, `🎯 All quests completed!${partnerNote}`);
      return;
    }

    let message = showAll ? 
      '🎯 **All Available Quests** (by Points):\n\n' : 
      '🎯 **Top Available Quests** (Top 5 by Points):\n\n';
    
    quests.forEach((quest: Quest, index: number) => {
      message += `${index + 1}. **${escapeMarkdown(quest.title)}** (${quest.points} pts)\n`;
      message += `ID: \`${quest.id}\`\n`;
      message += `Category: ${escapeMarkdown(quest.category)}\n`;
      // Truncate description to prevent message being too long
      const maxDescLength = showAll ? 80 : 100;
      const description = quest.description.length > maxDescLength ? quest.description.substring(0, maxDescLength) + '...' : quest.description;
      message += `${escapeMarkdown(description)}\n\n`;
    });
    
    message += '📸 Submit: Photo + `/submit [quest_id]`\n';
    
    if (user.partner_id) {
      message += '👥 Partner quests excluded\n';
    } else {
      const webAppUrl = 'https://pgpals.vercel.app';
      message += `👥 [Link Partner](${webAppUrl}/profile)\n`;
    }
    
    if (!showAll && quests.length === 5) {
      message += '\n📋 `/quests all` for more';
    }

    await safeSendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Quests command error:', error);
    await bot.sendMessage(chatId, '❌ Error fetching quests');
  }
}

async function handleSubmitCommand(chatId: number, text: string, photo: any, telegramId: number) {
  if (!photo) {
    await bot.sendMessage(chatId, '📸 Send photo with caption `/submit [quest_id]`');
    return;
  }

  const questId = text.split(' ')[1];
  if (!questId) {
    await bot.sendMessage(chatId, '❓ Missing quest ID. Use: `/submit [quest_id]`');
    return;
  }

  await handlePhotoSubmission(chatId, photo, `/submit ${questId}`, telegramId, 0);
}

// Helper function for safe Telegram messaging with retry logic
async function safeSendMessage(chatId: number | string, message: string, options?: any, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await bot.sendMessage(chatId, message, options);
      return true;
    } catch (error: any) {
      console.error(`Telegram send attempt ${i + 1} failed:`, error);
      
      // If it's a parse error and we're using markdown/HTML, try without formatting
      if (error?.response?.body?.description?.includes("can't parse entities") && options?.parse_mode) {
        try {
          console.log('Trying to send without parse_mode due to entity parsing error');
          await bot.sendMessage(chatId, message);
          return true;
        } catch (fallbackError) {
          console.error('Fallback send also failed:', fallbackError);
        }
      }
      
      if (i === retries - 1) {
        console.error('All Telegram send attempts failed, giving up');
        return false;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  return false;
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
      await safeSendMessage(chatId, '❌ Invalid format\n\n📸 Individual: `/submit [quest_id]`\n👥 Group: `/submit [id] group:GRP002`\n🔍 Use `/groups` to see group codes');
      return;
    }

    const questIdInput = questIdMatch[1];
    
    // Check if this is a group submission (now supporting both old and new formats)
    const groupMatch = caption.match(/group:(.+)/);
    const isGroupSubmission = !!groupMatch;
    let groupCodes: string[] = [];
    let participantPairs: Array<{user1_name: string, user2_name: string}> = []; // Legacy format
    
    if (isGroupSubmission) {
      const groupInput = groupMatch[1].trim();
      
      // Check if it's the new group code format (GRP001,GRP002) or old name format
      if (groupInput.match(/^[A-Z]{3}\d{3}(,[A-Z]{3}\d{3})*$/)) {
        // New group ID format: GRP001,GRP002
        groupCodes = groupInput.split(',').map(code => code.trim().toUpperCase());
        
        if (groupCodes.length < 1) {
          await safeSendMessage(chatId, '👥 Need at least 1 other group\nFormat: `/submit [id] group:GRP002`\nYour group is automatically included');
          return;
        }
      } else {
        // Legacy name format: Name1&Name2,Name3&Name4
        const pairStrings = groupInput.split(',');
        participantPairs = pairStrings.map(pairStr => {
          const [user1_name, user2_name] = pairStr.trim().split('&');
          if (!user1_name || !user2_name) {
            throw new Error('Invalid pair format. Use: GRP001,GRP002 or Name1&Name2,Name3&Name4');
          }
          return { 
            user1_name: user1_name.trim(), 
            user2_name: user2_name.trim() 
          };
        });
        
        if (participantPairs.length < 1) {
          await safeSendMessage(chatId, '👥 Need at least 1 other pair\nFormat: `/submit [id] group:GRP002`\nYour group is automatically included');
          return;
        }
      }
    }
    
    // Parse the quest ID input (now expecting integers)
    const questId = parseQuestId(questIdInput);
    if (!questId) {
      await safeSendMessage(chatId, `❌ Invalid quest ID: ${questIdInput}\nUse: /submit 1 or /submit #1`);
      return;
    }
    
    
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (!user) {
      const webAppUrl = 'https://pgpals.vercel.app';
      await safeSendMessage(chatId, 
        '🚫 Account not linked\n\n' +
        `[Create Account](${webAppUrl}/auth/signup) → Use /start`,
        { parse_mode: 'Markdown' }
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
      await safeSendMessage(chatId, '❌ Quest not found or inactive');
      return;
    }
    

    // Check if this is a group submission for a non-group quest
    if (isGroupSubmission && quest.category !== 'multiple-pair') {
      await safeSendMessage(chatId, 
        `🚫 Individual quest only\n\n` +
        `${quest.title} (${quest.category})\n` +
        `Submit individually or find group quest`
      );
      return;
    }

    // Check if this is NOT a group submission for a group quest
    if (!isGroupSubmission && quest.category === 'multiple-pair') {
      await safeSendMessage(chatId, 
        `👥 Group quest required\n\n` +
        `${quest.title}\n\n` +
        `📸 \`/submit ${questId} group:GRP002\`\n` +
        `🔍 Use \`/groups\` to see group codes`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // For regular pair quests, check partner conflicts
    if (!isGroupSubmission && user.partner_id) {
      
      // Check if partner has already submitted or completed this quest
      const { data: partnerSubmissions } = await supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('user_id', user.partner_id)
        .eq('quest_id', questId)
        .in('status', ['approved', 'ai_approved', 'pending_ai', 'manual_review']);

      if (partnerSubmissions && partnerSubmissions.length > 0) {
        const partnerSubmission = partnerSubmissions[0];
        
        if (partnerSubmission.status === 'approved' || partnerSubmission.status === 'ai_approved') {
          await safeSendMessage(chatId, 
            `🚫 Partner already completed\n\n` +
            `${quest.title}\n` +
            `Try /quests for new ones`
          );
          return;
        } else if (partnerSubmission.status === 'pending_ai' || partnerSubmission.status === 'manual_review') {
          await safeSendMessage(chatId, 
            `⏳ Partner submission pending\n\n` +
            `${quest.title}\n` +
            `Try /quests for others`
          );
          return;
        }
      }
    } else if (!isGroupSubmission) {
      // User has no partner assigned, can submit any quest
    }

    // Enhanced duplicate submission checks
    
    // 1. Check for existing submissions from this user
    const { data: existingSubmissions } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('quest_id', questId)
      .not('is_deleted', 'eq', true)
      .order('submitted_at', { ascending: false });

    if (existingSubmissions && existingSubmissions.length > 0) {
      const latestSubmission = existingSubmissions[0];
      
      // Handle different existing submission statuses
      if (latestSubmission.status === 'approved' || latestSubmission.status === 'ai_approved') {
        await safeSendMessage(chatId, 
          `🎉 Already completed!\n\n` +
          `${quest.title} (ID: ${questId})\n` +
          `✅ ${quest.points} pts earned`
        );
        return;
      } else if (latestSubmission.status === 'pending_ai' || latestSubmission.status === 'manual_review') {
        await safeSendMessage(chatId, 
          `⏳ Submission already pending\n\n` +
          `${quest.title} (ID: ${questId})\n` +
          `${new Date(latestSubmission.submitted_at).toLocaleDateString()}\n\n` +
          `Please wait for current review`
        );
        return;
      } else if (latestSubmission.status === 'rejected' || latestSubmission.status === 'ai_rejected') {
        await safeSendMessage(chatId, 
          `🔄 Resubmitting quest\n\n` +
          `${quest.title} (ID: ${questId})\n` +
          `💡 Ensure photo shows quest clearly`
        );
      }
    }

    // 2. Enhanced partner duplicate submission check for pair quests
    if (!isGroupSubmission && user.partner_id) {
      // Check if either partner has already submitted this quest successfully
      const { data: partnerOrSelfSubmissions } = await supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('quest_id', questId)
        .or(`user_id.eq.${user.id},user_id.eq.${user.partner_id}`)
        .in('status', ['approved', 'ai_approved', 'pending_ai', 'manual_review'])
        .not('is_deleted', 'eq', true)
        .order('submitted_at', { ascending: false });

      if (partnerOrSelfSubmissions && partnerOrSelfSubmissions.length > 0) {
        // Find submissions from partner (not current user)
        const partnerSubmissions = partnerOrSelfSubmissions.filter(s => s.user_id !== user.id);
        
        if (partnerSubmissions.length > 0) {
          const partnerSubmission = partnerSubmissions[0];
          
          if (partnerSubmission.status === 'approved' || partnerSubmission.status === 'ai_approved') {
            await safeSendMessage(chatId, 
              `🚫 Partner already completed this quest\n\n` +
              `${quest.title} (ID: ${questId})\n` +
              `Your partner has already earned points for this quest.\n\n` +
              `Try /quests for new challenges`
            );
            return;
          } else if (partnerSubmission.status === 'pending_ai' || partnerSubmission.status === 'manual_review') {
            await safeSendMessage(chatId, 
              `⏳ Partner submission already pending\n\n` +
              `${quest.title} (ID: ${questId})\n` +
              `Your partner has already submitted this quest and it's under review.\n\n` +
              `Try /quests for other challenges`
            );
            return;
          }
        }
      }
    }

    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;
    
    if (isGroupSubmission) {
      // Create group submission via API (supporting both formats)
      try {
        const requestBody = {
          quest_id: questId,
          telegram_file_id: fileId,
          telegram_message_id: messageId,
          telegram_user_id: telegramId, // Add telegram user ID for authentication
          ...(groupCodes.length > 0 
            ? { group_codes: groupCodes } 
            : { participant_pairs: participantPairs }
          )
        };

        const groupSubmissionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/group-submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!groupSubmissionResponse.ok) {
          const errorData = await groupSubmissionResponse.json();
          throw new Error(errorData.error || 'Failed to create group submission');
        }

        const groupResult = await groupSubmissionResponse.json();
        
        const participantCount = groupCodes.length > 0 ? groupCodes.length * 2 : participantPairs.length * 2;
        const participantInfo = groupCodes.length > 0 ? groupCodes.join(', ') : participantPairs.map(pair => `${pair.user1_name} & ${pair.user2_name}`).join(', ');
        
        await safeSendMessage(chatId, 
          `✅ Group submission received!\n\n` +
          `${quest.title} (ID: ${questId})\n` +
          `👥 ${participantCount} people\n` +
          `Groups: ${participantInfo}\n` +
          `⏳ Validating...`
        );
        
        // Send enhanced notifications to all group participants
        try {
          await telegramService.notifyGroupSubmission(
            groupResult.group_submission_id, 
            user.id, 
            questId
          );
        } catch (error) {
          console.error('Failed to send group submission notifications:', error);
        }
        
        // Admin notification
        await sendAdminNotification(
          `🎯 *New GROUP submission:*\n` +
          `Submitter: ${user.name}\n` +
          `Quest: ${quest.title} (ID: ${questId})\n` +
          `Groups: ${participantInfo}\n` +
          `Submission ID: ${groupResult.submission_id}`
        );

        return;
      } catch (error) {
        console.error('Group submission error:', error);
        let errorMessage = error instanceof Error ? error.message : 'Group submission failed';
        
        // Clean up error message for Telegram (remove technical details)
        if (errorMessage.includes('check constraint')) {
          errorMessage = 'Group submission validation failed';
        }
        
        // Send simple message without problematic markdown
        await safeSendMessage(chatId, `❌ ${errorMessage}\n\nTry: /groups to see valid group codes`);
        return;
      }
    }

    // Regular individual submission
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
      await safeSendMessage(chatId, '❌ Submission failed. Try again?');
      return;
    }
    

    await safeSendMessage(chatId, 
      `✅ Submission received!\n\n` +
      `${quest.title} (ID: ${questId})\n` +
      `⏳ Validating...`
    );

    // Send enhanced notification to partner if user has one
    if (user.partner_id) {
      try {
        await telegramService.notifyPartnerSubmission(user.id, questId, submission.id);
      } catch (error) {
        console.error('Failed to send enhanced partner notification:', error);
      }
    }

    // Admin notification
    await sendAdminNotification(
      `🔔 *New submission:*\n` +
      `User: ${user.name}\n` +
      `Quest: ${quest.title} (ID: ${questId})\n` +
      `Submission ID: ${submission.id}`
    );

  } catch (error) {
    console.error('Photo submission error:', error);
    await safeSendMessage(chatId, '❌ Error processing submission');
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
      const webAppUrl = 'https://pgpals.vercel.app';
      await bot.sendMessage(chatId, 
        '🚫 Account not linked\n\n' +
        `[Create Account](${webAppUrl}/auth/signup) → Use /start`,
        { parse_mode: 'Markdown' }
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

    let message = `📊 <b>Your Status</b>\n\n`;
    message += `⭐ ${totalPoints} pts | ✅ ${completedQuests} quests\n\n`;

    if (submissions && submissions.length > 0) {
      message += `<b>Recent Submissions:</b>\n`;
      submissions.forEach((sub: any) => {
        const statusEmoji = getStatusEmoji(sub.status);
        // Escape HTML characters in quest title
        const escapedTitle = sub.quest.title
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        message += `${statusEmoji} ${escapedTitle} - ${sub.status}\n`;
      });
    } else {
      message += 'No submissions yet. Try /quests!';
    }

    await safeSendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Status command error:', error);
    await bot.sendMessage(chatId, '❌ Error fetching status');
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
      await bot.sendMessage(chatId, '🏆 No participants yet');
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
      await bot.sendMessage(chatId, '🏆 No scores yet');
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
    await bot.sendMessage(chatId, '❌ Error fetching leaderboard');
  }
}

async function handleGroupsCommand(chatId: number, telegramId: number) {
  try {
    // Get user information to verify they're linked
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('telegram_id', telegramId.toString())
      .single();

    if (!user) {
      const webAppUrl = 'https://pgpals.vercel.app';
      await bot.sendMessage(chatId, 
        '🚫 Account not linked\n\n' +
        `[Create Account](${webAppUrl}/auth/signup) → Use /start`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Get all active groups using the database function
    const { data: groups } = await supabaseAdmin
      .rpc('list_all_active_groups');

    if (!groups || groups.length === 0) {
      await bot.sendMessage(chatId, 
        '👥 **No Active Groups**\n\n' +
        'Contact admin to create partner groups',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let message = '👥 **Active Partner Groups**\n\n';
    message += 'Use group codes for multi-pair quests:\n\n';
    
    // Display groups in a neat format
    groups.slice(0, 20).forEach((group: any) => { // Limit to prevent long messages
      message += `🔸 \`${group.group_code}\` - ${group.members}\n`;
    });

    message += '\n📸 Format: `/submit [id] group:GRP002`\n';
    message += '💡 Your group is automatically included\n';
    message += `💡 Example: \`/submit 5 group:${groups[1]?.group_code || 'GRP002'}\``;
    
    if (groups.length > 20) {
      message += `\n\n📋 Showing first 20 of ${groups.length} groups`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Groups command error:', error);
    await bot.sendMessage(chatId, '❌ Error fetching groups');
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

function escapeMarkdown(text: string): string {
  // Escape special markdown characters
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}