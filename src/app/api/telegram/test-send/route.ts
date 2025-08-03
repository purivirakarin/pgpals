import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { chatId } = await request.json();
    
    if (!chatId) {
      return NextResponse.json({ 
        error: 'chatId is required' 
      }, { status: 400 });
    }

    console.log(`Sending test message to chat ${chatId}`);

    // Send a simple test message
    const result = await bot.sendMessage(chatId, 
      '🤖 Test message from PGPals bot!\n\n' +
      'If you can see this, the bot communication is working.\n\n' +
      'Now try sending /start to test the command handling.'
    );
    
    console.log('Message sent successfully:', result.message_id);

    return NextResponse.json({
      success: true,
      messageId: result.message_id,
      message: 'Test message sent successfully'
    });
  } catch (error: any) {
    console.error('Test send error:', error);
    return NextResponse.json({
      error: 'Failed to send test message',
      details: error.message
    }, { status: 500 });
  }
}