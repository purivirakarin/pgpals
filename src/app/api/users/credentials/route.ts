import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Ensure email not taken by another user
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing && String(existing.id) !== String(session.user.id)) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 12)
    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ email, password_hash })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


