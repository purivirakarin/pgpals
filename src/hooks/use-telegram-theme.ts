import { useEffect } from 'react'
import { useTelegram } from './use-telegram'

export function useTelegramTheme() {
  const { colorScheme, themeParams } = useTelegram()

  useEffect(() => {
    const root = document.documentElement
    if (themeParams) {
      if ((themeParams as any).bg_color) root.style.setProperty('--tg-bg-color', (themeParams as any).bg_color)
      if ((themeParams as any).text_color) root.style.setProperty('--tg-text-color', (themeParams as any).text_color)
      if ((themeParams as any).hint_color) root.style.setProperty('--tg-hint-color', (themeParams as any).hint_color)
      if ((themeParams as any).link_color) root.style.setProperty('--tg-link-color', (themeParams as any).link_color)
      if ((themeParams as any).button_color) root.style.setProperty('--tg-button-color', (themeParams as any).button_color)
      if ((themeParams as any).button_text_color) root.style.setProperty('--tg-button-text-color', (themeParams as any).button_text_color)
    }
    document.body.classList.remove('tg-light', 'tg-dark')
    document.body.classList.add(`tg-${colorScheme}`)
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', colorScheme === 'dark' ? '#1a1a1a' : '#059669')
    }
  }, [colorScheme, themeParams])

  return {
    colorScheme,
    themeParams,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light'
  }
}


