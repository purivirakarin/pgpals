import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questId = searchParams.get('questId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const format = searchParams.get('format') || 'json'; // 'json' or 'download'

    // Build query to get submissions with photos
    let query = supabaseAdmin
      .from('submissions')
      .select(`
        id,
        telegram_file_id,
        submitted_at,
        status,
        user:users!submissions_user_id_fkey(id, name, telegram_username),
        quest:quests(id, title, category)
      `)
      .not('telegram_file_id', 'is', null)
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }
    
    if (questId) {
      query = query.eq('quest_id', parseInt(questId));
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', parseInt(userId));
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Failed to fetch submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: 'No submissions with photos found' }, { status: 404 });
    }

    // If format is 'json', return the list of photos with metadata
    if (format === 'json') {
      const photoList = submissions.map((submission) => {
        const submittedDate = new Date(submission.submitted_at).toISOString().split('T')[0];
        // Handle the user relation (Supabase returns it as an object)
        const userInfo = submission.user as any;
        const questInfo = submission.quest as any;
        const userName = userInfo?.name || 'unknown';
        const questTitle = questInfo?.title || 'unknown';
        
        return {
          submission_id: submission.id,
          telegram_file_id: submission.telegram_file_id,
          submitted_at: submission.submitted_at,
          status: submission.status,
          user_name: userName,
          quest_title: questTitle,
          suggested_filename: `${submittedDate}_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${questTitle.replace(/[^a-zA-Z0-9]/g, '_')}_submission_${submission.id}.jpg`,
          download_url: `/api/telegram/file/${submission.telegram_file_id}`
        };
      });

      return NextResponse.json({
        total_photos: photoList.length,
        photos: photoList,
        filters_applied: {
          quest_id: questId,
          status,
          user_id: userId,
          include_deleted: includeDeleted
        }
      });
    }

    // If format is 'download', handle single file download
    const fileId = searchParams.get('fileId');
    if (format === 'download' && fileId) {
      const submission = submissions.find(s => s.telegram_file_id === fileId);
      if (!submission) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
      }

      try {
        // Get file info from Telegram
        const getFileResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`
        );

        if (!getFileResponse.ok) {
          console.error(`Failed to get file info for ${fileId}:`, getFileResponse.status);
          return NextResponse.json({ error: 'Failed to get file info' }, { status: 500 });
        }

        const fileInfo = await getFileResponse.json();
        
        if (!fileInfo.ok || !fileInfo.result?.file_path) {
          console.error(`Invalid file info for ${fileId}`);
          return NextResponse.json({ error: 'Invalid file info' }, { status: 500 });
        }

        // Download the file
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
        const fileResponse = await fetch(fileUrl);

        if (!fileResponse.ok) {
          console.error(`Failed to download file ${fileId}:`, fileResponse.status);
          return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
        }

        const fileBuffer = await fileResponse.arrayBuffer();
        
        // Create filename with submission info
        const submittedDate = new Date(submission.submitted_at).toISOString().split('T')[0];
        const userInfo = submission.user as any;
        const questInfo = submission.quest as any;
        const userName = userInfo?.name || 'unknown';
        const questTitle = questInfo?.title || 'unknown';
        
        // Get file extension from file path
        const fileExtension = fileInfo.result.file_path.split('.').pop() || 'jpg';
        
        const filename = `${submittedDate}_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${questTitle.replace(/[^a-zA-Z0-9]/g, '_')}_submission_${submission.id}.${fileExtension}`;

        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': fileResponse.headers.get('content-type') || 'image/jpeg',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache',
          },
        });

      } catch (error) {
        console.error(`Error downloading file ${fileId}:`, error);
        return NextResponse.json({ error: 'Error downloading file' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid format parameter' }, { status: 400 });

  } catch (error) {
    console.error('Error in download photos API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
