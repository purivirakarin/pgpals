import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      return NextResponse.json({ 
        error: 'TELEGRAM_BOT_TOKEN not found in environment variables' 
      }, { status: 500 });
    }

    // Get bot info
    const botInfo = await bot.getMe();
    
    // Get webhook info
    const webhookInfo = await bot.getWebHookInfo();
    
    // Check if bot token is working by getting updates
    const updates = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
      .then(res => res.json());

    return NextResponse.json({
      botInfo,
      webhookInfo,
      tokenWorking: !!botInfo.id,
      recentUpdates: updates.result?.slice(-5) || [], // Last 5 updates
      environment: {
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 10) + '...' : 'not found',
        nextAuthUrl: process.env.NEXTAUTH_URL || 'not set'
      }
    });
  } catch (error: any) {
    console.error('Telegram debug error:', error);
    return NextResponse.json({
      error: 'Failed to debug Telegram bot',
      details: error.message,
      tokenWorking: false
    }, { status: 500 });
  }
}