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
      if (!anyWindow?.Telegram?.WebApp) {
        console.warn('[tg] WebApp not present')
      }
      if (!initData) return
      try {
        const res = await signIn('credentials', {
          isTelegram: 'true',
          telegramInitData: initData,
          redirect: false,
        })
        if (res?.error) {
          anyWindow?.Telegram?.WebApp?.showAlert?.(`Sign-in failed: ${res.error}`)
        } else {
          anyWindow?.Telegram?.WebApp?.showAlert?.('Signed in')
          await update?.({})
        }
      } catch {
        // ignore
      }
    }
    maybeTelegramAutoLogin()
  }, [session?.user, update])

  return null
}


