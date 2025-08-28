import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    message: 'Test API working', 
    userId: params.id,
    timestamp: new Date().toISOString()
  });
}
