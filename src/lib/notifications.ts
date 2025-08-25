import { bot, telegramService } from './telegram';
import { supabaseAdmin } from './supabase';

interface NotificationRecipient {
  telegram_id: string;
  name: string;
}

export async function sendSubmissionStatusNotification(
  submissionId: number,
  newStatus: string,
  reviewFeedback?: string
) {
  try {
    // Get submission details with user and quest info
    const { data: submission } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        quest_id,
        status,
        points_awarded,
        admin_feedback,
        is_group_submission,
        group_submission_id,
        users!submissions_user_id_fkey(id, name, telegram_id, partner_id),
        quests!submissions_quest_id_fkey(id, title, points)
      `)
      .eq('id', submissionId)
      .single();

    if (!submission) {
      console.error('Submission not found for notification:', submissionId);
      return;
    }

    const submitter = submission.users as any;
    const quest = submission.quests as any;
    
    // Prepare enhanced notification message based on status
    const statusEmoji = getStatusEmoji(newStatus);
    const statusText = getStatusText(newStatus);
    
    let message = `${statusEmoji} **Submission ${statusText}**\n\n`;
    message += `**${quest.title}**\n`;
    message += `📊 Status: ${statusText}\n`;
    message += `🆔 Submission ID: ${submissionId}\n`;
    
    if (newStatus === 'approved' || newStatus === 'ai_approved') {
      const pointsAwarded = submission.points_awarded || quest.points;
      message += `💎 Points Awarded: ${pointsAwarded}\n`;
      message += `🎉 Great job! Keep up the excellent work!\n`;
    } else if (newStatus === 'rejected' || newStatus === 'ai_rejected') {
      message += `💡 Don't give up! Review the requirements and try again.\n`;
    }
    
    if (reviewFeedback) {
      message += `\n📝 **Feedback:**\n${reviewFeedback}\n`;
    }

    message += `\n⏰ ${new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} SGT`;

    // Collect all recipients with enhanced details
    const recipients: (NotificationRecipient & { relationship: string })[] = [];
    
    // Add submitter
    if (submitter.telegram_id) {
      recipients.push({
        telegram_id: submitter.telegram_id,
        name: submitter.name,
        relationship: 'submitter'
      });
    }

    // Add submitter's partner
    if (submitter.partner_id) {
      const { data: partner } = await supabaseAdmin
        .from('users')
        .select('telegram_id, name')
        .eq('id', submitter.partner_id)
        .single();
        
      if (partner?.telegram_id) {
        recipients.push({
          telegram_id: partner.telegram_id,
          name: partner.name,
          relationship: 'partner'
        });
      }
    }

    // If it's a group submission, add all group participants
    if (submission.is_group_submission && submission.group_submission_id) {
      const { data: groupParticipants } = await supabaseAdmin
        .from('group_participants')
        .select(`
          user_id,
          opted_out,
          users!group_participants_user_id_fkey(telegram_id, name)
        `)
        .eq('group_submission_id', submission.group_submission_id)
        .eq('opted_out', false);

      if (groupParticipants) {
        groupParticipants.forEach((participant: any) => {
          if (participant.users?.telegram_id && 
              !recipients.find(r => r.telegram_id === participant.users.telegram_id)) {
            recipients.push({
              telegram_id: participant.users.telegram_id,
              name: participant.users.name,
              relationship: 'group_participant'
            });
          }
        });
      }
    }

    // Send personalized notifications to all recipients
    const notificationPromises = recipients.map(async (recipient) => {
      try {
        let personalizedMessage = message;
        
        // Add relationship context for non-submitters
        if (recipient.relationship === 'partner') {
          personalizedMessage = `👥 **Partner's ${statusText} Submission**\n\n` +
            `Your partner ${submitter.name}'s submission has been ${statusText.toLowerCase()}:\n\n` +
            personalizedMessage.split('\n').slice(1).join('\n');
        } else if (recipient.relationship === 'group_participant') {
          personalizedMessage = `🏘️ **Group ${statusText} Submission**\n\n` +
            `Group submission by ${submitter.name} has been ${statusText.toLowerCase()}:\n\n` +
            personalizedMessage.split('\n').slice(1).join('\n');
        }
        
        await bot.sendMessage(recipient.telegram_id, personalizedMessage, { parse_mode: 'Markdown' });
        console.log(`Enhanced notification sent to ${recipient.name} (${recipient.relationship})`);
      } catch (error) {
        console.error(`Failed to send notification to ${recipient.name}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`Enhanced status notification sent for submission ${submissionId} to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Error sending submission status notification:', error);
  }
}

export async function sendGroupSubmissionNotification(
  groupSubmissionId: number,
  submitterName: string,
  questTitle: string
) {
  try {
    // Get all group participants
    const { data: groupParticipants } = await supabaseAdmin
      .from('group_participants')
      .select(`
        user_id,
        opted_out,
        users!group_participants_user_id_fkey(telegram_id, name)
      `)
      .eq('group_submission_id', groupSubmissionId)
      .eq('opted_out', false);

    if (!groupParticipants || groupParticipants.length === 0) {
      console.log('No participants found for group submission notification');
      return;
    }

    const message = `🎯 **Group Submission Created**\n\n` +
      `${submitterName} submitted a group quest on behalf of everyone:\n\n` +
      `Quest: ${questTitle}\n` +
      `Status: Pending validation\n\n` +
      `All participants will receive credit when approved!\n` +
      `Total participants: ${groupParticipants.length}`;

    // Send to all participants
    const notificationPromises = groupParticipants.map(async (participant: any) => {
      if (participant.users?.telegram_id) {
        try {
          await bot.sendMessage(participant.users.telegram_id, message, { parse_mode: 'Markdown' });
          console.log(`Group notification sent to ${participant.users.name}`);
        } catch (error) {
          console.error(`Failed to send group notification to ${participant.users.name}:`, error);
        }
      }
    });

    await Promise.all(notificationPromises);
    console.log(`Group submission notification sent to ${groupParticipants.length} participants`);
    
  } catch (error) {
    console.error('Error sending group submission notification:', error);
  }
}

/**
 * Send notification to all admin users with telegram accounts
 */
export async function sendAdminNotification(message: string) {
  try {
    // Get all admin users with telegram IDs
    const { data: adminUsers, error } = await supabaseAdmin
      .from('users')
      .select('id, name, telegram_id')
      .eq('role', 'admin')
      .not('telegram_id', 'is', null);

    if (error) {
      console.error('Error fetching admin users:', error);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users with telegram accounts found');
      return;
    }

    // Send notification to each admin
    const notifications = adminUsers.map(async (admin) => {
      try {
        await bot.sendMessage(admin.telegram_id!, message, { parse_mode: 'Markdown' });
        console.log(`✅ Admin notification sent to ${admin.name} (${admin.telegram_id})`);
      } catch (error) {
        console.error(`Failed to send notification to admin ${admin.name} (${admin.telegram_id}):`, error);
      }
    });

    await Promise.allSettled(notifications);
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
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
    default: return '📄';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending_ai': return 'Pending Review';
    case 'ai_approved': return 'Auto Approved';
    case 'ai_rejected': return 'Auto Rejected';
    case 'manual_review': return 'Under Review';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return status.replace('_', ' ');
  }
}
