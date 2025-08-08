import { NextRequest, NextResponse } from 'next/server';
import { testNSFWSetup } from '@/lib/nsfw-detection';

export async function GET() {
  try {
    const isWorking = await testNSFWSetup();
    
    return NextResponse.json({
      success: isWorking,
      message: isWorking ? 'NSFW detection is working correctly' : 'NSFW detection setup failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}