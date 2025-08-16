// Simple Telegram bot runner for local development (polling mode)
// Starts alongside `next dev` via `npm run dev`

/* eslint-disable no-console */
const path = require('path')
// Load env from .env.local (Next.js) and fallback to .env
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
  require('dotenv').config()
} catch {}
const TelegramBot = require('node-telegram-bot-api')

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.warn('[telegram-dev-bot] TELEGRAM_BOT_TOKEN not set. Skipping bot startup.')
  process.exit(0)
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'pgpals_bot'
const deepLinkUrl = `https://t.me/${botUsername}?startapp=home`
const isHttps = /^https:\/\//i.test(appUrl)

console.log('[telegram-dev-bot] Starting bot in polling mode...')
const bot = new TelegramBot(token, { polling: false })

async function ensurePolling() {
  try {
    // If a webhook is set, polling will 409. Remove webhook first.
    await bot.deleteWebHook({ drop_pending_updates: false })
  } catch (e) {
    // ignore
  }
  try {
    await bot.startPolling()
  } catch (e) {
    console.error('[telegram-dev-bot] startPolling error', e?.message || e)
  }
}

bot.on('polling_error', (err) => {
  console.error('[telegram-dev-bot] polling_error', err?.message || err)
})

bot.onText(/^\/start/, async (msg) => {
  const chatId = msg.chat.id
  try {
    if (isHttps) {
      await bot.sendMessage(chatId, 'Welcome to PGPals! Tap below to open the app:', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Open PGPals', web_app: { url: appUrl } }]],
        },
      })
    } else {
      await bot.sendMessage(chatId, `Welcome to PGPals!\n\nTelegram requires HTTPS for Web App buttons. In dev, use this button to open the Mini App:`, {
        reply_markup: {
          inline_keyboard: [[{ text: 'Open in Telegram', url: deepLinkUrl }]],
        },
      })
    }
  } catch (e) {
    console.error('[telegram-dev-bot] /start error', e)
  }
})

bot.on('message', async (msg) => {
  const text = msg.text || ''
  const chatId = msg.chat.id
  if (text.startsWith('/')) return
  try {
    await bot.sendMessage(
      chatId,
      'Use /start to open the app. For full functionality (submissions, quests, etc.), use the production webhook routes.'
    )
  } catch (e) {
    console.error('[telegram-dev-bot] message error', e)
  }
})

console.log('[telegram-dev-bot] Bot is running. App URL:', appUrl)

ensurePolling()


