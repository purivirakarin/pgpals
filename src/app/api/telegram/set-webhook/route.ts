import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ 
        error: 'Webhook URL is required' 
      }, { status: 400 });
    }

    // Set the webhook
    const result = await bot.setWebHook(url);
    
    // Get webhook info to confirm
    const webhookInfo = await bot.getWebHookInfo();
    
    return NextResponse.json({
      success: true,
      result,
      webhookInfo
    });
  } catch (error: any) {
    console.error('Webhook setup error:', error);
    return NextResponse.json({
      error: 'Failed to set webhook',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Remove webhook (for local development)
    const result = await bot.deleteWebHook();
    
    return NextResponse.json({
      success: true,
      message: 'Webhook deleted',
      result
    });
  } catch (error: any) {
    console.error('Webhook deletion error:', error);
    return NextResponse.json({
      error: 'Failed to delete webhook',
      details: error.message
    }, { status: 500 });
  }
}