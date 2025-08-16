import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const token = process.env.TELEGRAM_BOT_TOKEN

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }
    if (!token) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 })
    }

    // 1) Get profile photos
    const r1 = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${encodeURIComponent(userId)}&limit=1`)
    const j1 = await r1.json()

    let url: string | null = null
    if (j1?.ok && j1.result?.total_count > 0 && Array.isArray(j1.result.photos) && j1.result.photos.length > 0) {
      const sizes = j1.result.photos[0]
      const largest = sizes[sizes.length - 1]
      const fileId = largest?.file_id
      if (fileId) {
        // 2) Get file path
        const r2 = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`)
        const j2 = await r2.json()
        if (j2?.ok && j2.result?.file_path) {
          url = `https://api.telegram.org/file/bot${token}/${j2.result.file_path}`
        }
      }
    }

    return NextResponse.json({ url }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch user photo' }, { status: 500 })
  }
}


