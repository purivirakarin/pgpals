import TelegramBot from 'node-telegram-bot-api';

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
}

export const telegramService = new TelegramService();