import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build base query
    let query = supabaseAdmin
      .from('submissions')
      .select(`
        *,
        user:users!submissions_user_id_fkey(id, name, email, telegram_username),
        quest:quests(id, title, category, points, description),
        reviewer:users!submissions_reviewed_by_fkey(id, name, email)
      `)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If user is admin, show all submissions; otherwise, show only their own and partner's
    if (session.user.role !== 'admin') {
      // Look up partner_id for current user to include partner submissions
      const { data: me } = await supabaseAdmin
        .from('users')
        .select('id, partner_id')
        .eq('id', session.user.id)
        .single();

      if (me?.partner_id) {
        query = query.in('user_id', [session.user.id, me.partner_id]);
      } else {
        query = query.eq('user_id', session.user.id);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Submissions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Cache briefly for non-admins to reduce load
    const cacheHeader = session.user.role === 'admin'
      ? 'private, no-store'
      : 'private, max-age=30, stale-while-revalidate=120';
    return NextResponse.json(submissions || [], {
      headers: {
        'Cache-Control': cacheHeader,
        'Vary': 'Authorization, Cookie',
      },
    });
  } catch (error) {
    console.error('Submissions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}