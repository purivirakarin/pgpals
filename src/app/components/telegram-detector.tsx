"use client"

import { useEffect, useState } from 'react'
import { AlertCircle, ExternalLink, Smartphone } from 'lucide-react'

export function TelegramDetector() {
  const [isInTelegram, setIsInTelegram] = useState(true)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const isTelegram = typeof window !== 'undefined' && 
      (window as any).Telegram?.WebApp && 
      (window as any).Telegram.WebApp.initData

    setIsInTelegram(!!isTelegram)
    setTimeout(() => { setShowWarning(!isTelegram) }, 1000)
  }, [])

  if (!showWarning || isInTelegram) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-900 p-3">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">This app is designed for Telegram Mini Apps</p>
          <p className="text-xs opacity-90">For the best experience, open this in the Telegram app</p>
        </div>
        <button onClick={() => setShowWarning(false)} className="text-amber-700 hover:text-amber-800 p-1" aria-label="Close warning">×</button>
      </div>
    </div>
  )
}

export function TelegramGuide() {
  const [isInTelegram, setIsInTelegram] = useState(true)
  useEffect(() => {
    const isTelegram = typeof window !== 'undefined' && (window as any).Telegram?.WebApp && (window as any).Telegram.WebApp.initData
    setIsInTelegram(!!isTelegram)
  }, [])
  if (isInTelegram) return null
  return (
    <div className="max-w-2xl mx-auto p-6 bg-blue-50 rounded-xl border border-blue-200 m-4">
      <div className="text-center">
        <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-blue-900 mb-2">Open in Telegram for Full Experience</h3>
        <p className="text-blue-700 mb-4">This PGPals Bingo app is designed as a Telegram Mini App with features like:</p>
        <ul className="text-left text-blue-700 mb-6 space-y-2">
          <li>• Cross-device progress sync</li>
          <li>• Haptic feedback on mobile</li>
          <li>• Native Telegram integration</li>
          <li>• Share achievements with friends</li>
        </ul>
        <div className="space-y-3">
          <button onClick={() => window.open('https://t.me/pgpals_bot', '_blank')} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Open in Telegram
          </button>
          <p className="text-xs text-blue-600">You can still use this app here, but some features will be limited.</p>
        </div>
      </div>
    </div>
  )
}


