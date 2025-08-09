import { useState, useEffect } from 'react'
import { telegramWebApp } from '@/lib/telegram-webapp'

export function useTelegram() {
  const [user, setUser] = useState(telegramWebApp.user)
  const [colorScheme, setColorScheme] = useState(telegramWebApp.colorScheme)
  const [themeParams, setThemeParams] = useState(telegramWebApp.themeParams)

  useEffect(() => {
    setUser(telegramWebApp.user)
    setColorScheme(telegramWebApp.colorScheme)
    setThemeParams(telegramWebApp.themeParams)
  }, [])

  return {
    user,
    colorScheme,
    themeParams,
    hasCloudStorage: telegramWebApp.hasCloudStorage,
    impactFeedback: telegramWebApp.impactFeedback.bind(telegramWebApp),
    notificationFeedback: telegramWebApp.notificationFeedback.bind(telegramWebApp),
    selectionFeedback: telegramWebApp.selectionFeedback.bind(telegramWebApp),
    setCloudData: telegramWebApp.setCloudData.bind(telegramWebApp),
    getCloudData: telegramWebApp.getCloudData.bind(telegramWebApp),
    setMainButton: telegramWebApp.setMainButton.bind(telegramWebApp),
    hideMainButton: telegramWebApp.hideMainButton.bind(telegramWebApp),
    shareToChat: telegramWebApp.shareToChat.bind(telegramWebApp),
    showAlert: telegramWebApp.showAlert.bind(telegramWebApp),
    showConfirm: telegramWebApp.showConfirm.bind(telegramWebApp),
    scanQR: telegramWebApp.scanQR.bind(telegramWebApp),
    close: telegramWebApp.close.bind(telegramWebApp),
  }
}


