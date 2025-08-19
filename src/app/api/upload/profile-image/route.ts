import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    // If JSON provided with url, just save it
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { url } = body || {}
      if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
      const { error } = await supabaseAdmin.from('users').update({ profile_image_url: url }).eq('id', session.user.id)
      if (error) return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
      return NextResponse.json({ ok: true, url })
    }

    // Otherwise, expect form-data with a file field
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const bucket = 'profile-images'
    // Best-effort bucket creation (idempotent)
    try {
      // @ts-ignore - createBucket exists on admin client
      await supabaseAdmin.storage.createBucket(bucket, { public: true })
    } catch (_) {
      // ignore if exists
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)
    const fileExt = (file.type && file.type.split('/')[1]) || 'png'
    const path = `${session.user.id}/${Date.now()}.${fileExt}`

    const uploadRes = await supabaseAdmin.storage.from(bucket).upload(path, fileBuffer, {
      contentType: file.type || 'image/png',
      upsert: false,
    })
    if (uploadRes.error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
    const publicUrl = publicUrlData.publicUrl

    const { error: updateErr } = await supabaseAdmin.from('users').update({ profile_image_url: publicUrl }).eq('id', session.user.id)
    if (updateErr) return NextResponse.json({ error: 'Failed to save image URL' }, { status: 500 })

    return NextResponse.json({ ok: true, url: publicUrl })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


