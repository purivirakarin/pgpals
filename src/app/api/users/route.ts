import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get users with partner info using the view
    let query = supabaseAdmin
      .from('user_points_view')
      .select(`
        id,
        name,
        email,
        role,
        telegram_id,
        telegram_username,
        partner_id,
        partner_name,
        partner_telegram,
        total_points,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Only apply range if limit is specified
    if (limit !== null) {
      query = query.range(offset, offset + limit - 1);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get submission counts for each user
    const usersWithSubmissions = await Promise.all((users || []).map(async (user) => {
      const { count: submissionCount } = await supabaseAdmin
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        ...user,
        submission_count: submissionCount || 0
      };
    }));

    return NextResponse.json(usersWithSubmissions || []);
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, role, telegram_id, telegram_username } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        role: role || 'participant',
        telegram_id,
        telegram_username
      })
      .select()
      .single();

    if (error) {
      console.error('User creation error:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('User creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}