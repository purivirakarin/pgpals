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
    const status = searchParams.get('status');
    const showDeleted = searchParams.get('showDeleted') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('submissions')
      .select(`
        *,
        user:users!submissions_user_id_fkey(id, name, email, telegram_username),
        quest:quests(id, title, category, points),
        reviewer:users!submissions_reviewed_by_fkey(id, name, email),
        deleter:users!submissions_deleted_by_fkey(id, name, email)
      `)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by deletion status
    if (!showDeleted) {
      query = query.eq('is_deleted', false);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Admin submissions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    return NextResponse.json(submissions || []);
  } catch (error) {
    console.error('Admin submissions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}