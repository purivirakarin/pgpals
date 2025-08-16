import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Generate or return current partner code (using user.id as code for MVP)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ code: String(session.user.id) }, {
    headers: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=1800',
      'Vary': 'Authorization, Cookie',
    },
  })
}

// Join by partner code (MVP: partner code is the other user's id)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await request.json().catch(() => ({}))
  const partnerId = parseInt(String(code || ''), 10)
  if (!partnerId || Number.isNaN(partnerId)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }
  if (partnerId === parseInt(String(session.user.id), 10)) {
    return NextResponse.json({ error: 'Cannot partner with yourself' }, { status: 400 })
  }
  // Fetch both users
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, partner_id')
    .in('id', [session.user.id, partnerId])
  if (!users || users.length !== 2) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const me = users.find(u => String(u.id) === String(session.user.id))
  const them = users.find(u => String(u.id) === String(partnerId))
  if (!me || !them) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (me.partner_id || them.partner_id) {
    return NextResponse.json({ error: 'One of the users already has a partner' }, { status: 400 })
  }
  // Link both directions
  const { error: err1 } = await supabaseAdmin.from('users').update({ partner_id: partnerId }).eq('id', session.user.id)
  if (err1) return NextResponse.json({ error: 'Failed to set partner' }, { status: 500 })
  const { error: err2 } = await supabaseAdmin.from('users').update({ partner_id: session.user.id }).eq('id', partnerId)
  if (err2) {
    // rollback
    await supabaseAdmin.from('users').update({ partner_id: null }).eq('id', session.user.id)
    return NextResponse.json({ error: 'Failed to set reciprocal partner' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

// Unlink partnership
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: me } = await supabaseAdmin
    .from('users')
    .select('id, partner_id')
    .eq('id', session.user.id)
    .single()
  if (!me?.partner_id) return NextResponse.json({ error: 'No partner to unlink' }, { status: 400 })
  const partnerId = me.partner_id
  const { error: e1 } = await supabaseAdmin.from('users').update({ partner_id: null }).eq('id', session.user.id)
  const { error: e2 } = await supabaseAdmin.from('users').update({ partner_id: null }).eq('id', partnerId)
  if (e1 || e2) return NextResponse.json({ error: 'Failed to unlink' }, { status: 500 })
  return NextResponse.json({ success: true })
}


