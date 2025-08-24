import TelegramBot from 'node-telegram-bot-api';
import { supabaseAdmin } from './supabase';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const bot = new TelegramBot(token, { polling: false });

export class TelegramService {
  private bot: TelegramBot;

  constructor() {
    this.bot = bot;
  }

  async sendMessage(chatId: string | number, message: string, options?: any) {
    try {
      return await this.bot.sendMessage(chatId, message, options);
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error;
    }
  }

  async getFile(fileId: string) {
    try {
      return await this.bot.getFile(fileId);
    } catch (error) {
      console.error('Failed to get Telegram file:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const file = await this.getFile(fileId);
      const response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Failed to download Telegram file:', error);
      throw error;
    }
  }

  async setWebhook(url: string) {
    try {
      return await this.bot.setWebHook(url);
    } catch (error) {
      console.error('Failed to set webhook:', error);
      throw error;
    }
  }

  /**
   * Send enhanced notification to partners when a submission is made
   */
  async notifyPartnerSubmission(
    submitterId: number, 
    questId: number, 
    submissionId: number
  ) {
    try {
      // Get submitter and quest info
      const { data: submitter } = await supabaseAdmin
        .from('users')
        .select('name, partner_id')
        .eq('id', submitterId)
        .single();

      const { data: quest } = await supabaseAdmin
        .from('quests')
        .select('title, points, category')
        .eq('id', questId)
        .single();

      if (!submitter?.partner_id || !quest) return;

      // Get partner info
      const { data: partner } = await supabaseAdmin
        .from('users')
        .select('telegram_id, name')
        .eq('id', submitter.partner_id)
        .single();

      if (!partner?.telegram_id) return;

      const message = `🔔 **Partner Submission Alert**\n\n` +
        `${submitter.name} just submitted:\n` +
        `**${quest.title} (ID: ${questId})**\n\n` +
        `📊 Category: ${quest.category}\n` +
        `💎 Points: ${quest.points}\n` +
        `🆔 Submission ID: ${submissionId}\n` +
        `⏳ Status: Pending validation\n\n` +
        `You'll both receive points when approved! 🎉`;

      await this.sendMessage(partner.telegram_id, message, { parse_mode: 'Markdown' });
      console.log(`Enhanced partner notification sent to ${partner.name}`);
    } catch (error) {
      console.error('Failed to send enhanced partner notification:', error);
    }
  }

  /**
   * Send notifications to all group participants when a group submission is made
   */
  async notifyGroupSubmission(
    groupSubmissionId: number,
    submitterId: number,
    questId: number
  ) {
    try {
      // Get submitter and quest info
      const { data: submitter } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', submitterId)
        .single();

      const { data: quest } = await supabaseAdmin
        .from('quests')
        .select('title, points')
        .eq('id', questId)
        .single();

      if (!submitter || !quest) return;

      // Get all group participants (including those not opted out)
      const { data: participants } = await supabaseAdmin
        .from('group_participants')
        .select(`
          user_id,
          opted_out,
          users!group_participants_user_id_fkey(name, telegram_id)
        `)
        .eq('group_submission_id', groupSubmissionId);

      if (!participants) return;

      const activeParticipants = participants.filter(p => !p.opted_out);
      const totalGroups = Math.ceil(activeParticipants.length / 2);

      const message = `🎯 **Group Submission Created**\n\n` +
        `${submitter.name} submitted on behalf of all groups:\n\n` +
        `**${quest.title} (ID: ${questId})**\n` +
        `💎 Points: ${quest.points} per person\n` +
        `👥 Total participants: ${activeParticipants.length}\n` +
        `🏘️ Groups involved: ${totalGroups}\n` +
        `🆔 Group ID: ${groupSubmissionId}\n\n` +
        `⏳ Status: Pending validation\n` +
        `🎉 Everyone gets credit when approved!`;

      // Send to all active participants
      const notificationPromises = activeParticipants.map(async (participant: any) => {
        if (participant.users?.telegram_id) {
          try {
            await this.sendMessage(participant.users.telegram_id, message, { parse_mode: 'Markdown' });
            console.log(`Group notification sent to ${participant.users.name}`);
          } catch (error) {
            console.error(`Failed to send group notification to ${participant.users.name}:`, error);
          }
        }
      });

      await Promise.all(notificationPromises);
      console.log(`Group submission notifications sent to ${activeParticipants.length} participants`);
    } catch (error) {
      console.error('Failed to send group submission notifications:', error);
    }
  }

  /**
   * Broadcast message to all users with telegram accounts (admin feature)
   */
  async broadcastToAllUsers(message: string, senderId?: number): Promise<{
    sent: number;
    failed: number;
    total: number;
  }> {
    try {
      // Get sender info for attribution
      let senderName = 'Admin';
      if (senderId) {
        const { data: sender } = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', senderId)
          .single();
        if (sender) senderName = sender.name;
      }

      // Get all users with telegram IDs
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('telegram_id, name')
        .not('telegram_id', 'is', null);

      if (!users || users.length === 0) {
        return { sent: 0, failed: 0, total: 0 };
      }

      const formattedMessage = `📢 **Admin Broadcast**\n\n` +
        `${message}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📡 Sent by: ${senderName}\n` +
        `⏰ ${new Date().toLocaleString('en-US', { 
          timeZone: 'Asia/Singapore',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} SGT`;

      let sent = 0;
      let failed = 0;

      // Send in batches to avoid rate limiting
      const batchSize = 30; // Telegram allows 30 messages per second
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (user) => {
          try {
            await this.sendMessage(user.telegram_id, formattedMessage, { parse_mode: 'Markdown' });
            sent++;
            console.log(`Broadcast sent to ${user.name}`);
          } catch (error) {
            failed++;
            console.error(`Failed to send broadcast to ${user.name}:`, error);
          }
        });

        await Promise.all(batchPromises);
        
        // Wait 1 second between batches to respect rate limits
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Broadcast completed: ${sent} sent, ${failed} failed, ${users.length} total`);
      return { sent, failed, total: users.length };
    } catch (error) {
      console.error('Failed to broadcast message:', error);
      throw error;
    }
  }
}

export const telegramService = new TelegramService();