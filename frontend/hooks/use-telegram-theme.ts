import { useEffect } from 'react'
import { useTelegram } from './use-telegram'

export function useTelegramTheme() {
  const { colorScheme, themeParams } = useTelegram()

  useEffect(() => {
    // Apply Telegram theme to CSS custom properties
    const root = document.documentElement

    if (themeParams) {
      // Set CSS custom properties based on Telegram theme
      if (themeParams.bg_color) {
        root.style.setProperty('--tg-bg-color', themeParams.bg_color)
      }
      if (themeParams.text_color) {
        root.style.setProperty('--tg-text-color', themeParams.text_color)
      }
      if (themeParams.hint_color) {
        root.style.setProperty('--tg-hint-color', themeParams.hint_color)
      }
      if (themeParams.link_color) {
        root.style.setProperty('--tg-link-color', themeParams.link_color)
      }
      if (themeParams.button_color) {
        root.style.setProperty('--tg-button-color', themeParams.button_color)
      }
      if (themeParams.button_text_color) {
        root.style.setProperty('--tg-button-text-color', themeParams.button_text_color)
      }
    }

    // Set theme class on body
    document.body.classList.remove('tg-light', 'tg-dark')
    document.body.classList.add(`tg-${colorScheme}`)

    // Set theme color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', 
        colorScheme === 'dark' ? '#1a1a1a' : '#059669'
      )
    }
  }, [colorScheme, themeParams])

  return {
    colorScheme,
    themeParams,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light'
  }
}