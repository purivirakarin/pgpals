'use client';

import { useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'

export default function TelegramAutoLogin() {
  const { data: session, update } = useSession()

  useEffect(() => {
    const maybeTelegramAutoLogin = async () => {
      if (session?.user) return
      const anyWindow = window as any
      const initData = anyWindow?.Telegram?.WebApp?.initData
      if (!initData) return
      try {
        await signIn('credentials', {
          isTelegram: 'true',
          telegramInitData: initData,
          redirect: false,
        })
        await update?.({})
      } catch {
        // ignore
      }
    }
    maybeTelegramAutoLogin()
  }, [session?.user, update])

  return null
}


