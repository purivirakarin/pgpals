// Quick test script to verify bot works with polling
// Run with: node telegram-test.js

const TelegramBot = require('node-telegram-bot-api');

const token = 'YOUR_BOT_TOKEN_HERE'; // Replace with your actual token
const bot = new TelegramBot(token, { polling: true });

console.log('Bot started with polling...');

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  console.log('Received message:', text, 'from:', chatId);
  
  if (text === '/start') {
    bot.sendMessage(chatId, 'Hello! I\'m working in polling mode for testing 🤖');
  } else if (text === '/test') {
    bot.sendMessage(chatId, 'Test successful! ✅');
  } else {
    bot.sendMessage(chatId, `You said: ${text}`);
  }
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

console.log('Send /start or /test to your bot to verify it works');