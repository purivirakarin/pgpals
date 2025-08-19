import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('user_quest_completions')
      .select('quest_id')
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Fetch completions error:', error)
      return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 })
    }

    const questIds = (data || []).map((row: { quest_id: string }) => row.quest_id)
    return NextResponse.json(questIds)
  } catch (e) {
    console.error('Completions API error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


