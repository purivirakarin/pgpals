import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users to view images
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = params.fileId;
    
    // Verify the file ID exists in our submissions table for security
    // Exclude soft-deleted records
    const { data: submission } = await supabaseAdmin
      .from('submissions')
      .select('telegram_file_id')
      .eq('telegram_file_id', fileId)
      .eq('is_deleted', false)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'File not found in database' }, { status: 404 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    // First, get the file path from Telegram
    const getFileResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`
    );

    if (!getFileResponse.ok) {
      console.error('Failed to get file info from Telegram:', getFileResponse.status);
      return NextResponse.json({ error: 'File not found on Telegram' }, { status: 404 });
    }

    const fileInfo = await getFileResponse.json();
    
    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error('Invalid file info response from Telegram');
      return NextResponse.json({ error: 'Invalid file response from Telegram' }, { status: 404 });
    }

    // Now download the actual file from Telegram
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      console.error('Failed to download file from Telegram:', fileResponse.status);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    // Get the file buffer and content type
    const fileBuffer = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || 'image/jpeg'; // Default to image/jpeg


    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Disposition': `inline; filename="submission-${fileId.substring(0, 8)}.jpg"`,
      },
    });

  } catch (error) {
    console.error('Error serving Telegram file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
