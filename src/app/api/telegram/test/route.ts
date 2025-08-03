import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json();
    
    if (!chatId || !message) {
      return NextResponse.json({ 
        error: 'chatId and message are required' 
      }, { status: 400 });
    }

    // Send test message
    const result = await bot.sendMessage(chatId, message);
    
    return NextResponse.json({
      success: true,
      result,
      message: 'Test message sent successfully'
    });
  } catch (error: any) {
    console.error('Test message error:', error);
    return NextResponse.json({
      error: 'Failed to send test message',
      details: error.message
    }, { status: 500 });
  }
}