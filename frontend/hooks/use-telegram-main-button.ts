import { useEffect, useCallback } from 'react'
import { useTelegram } from './use-telegram'

interface MainButtonConfig {
  text: string
  onClick: () => void
  color?: string
  isVisible?: boolean
  isActive?: boolean
}

export function useTelegramMainButton() {
  const { setMainButton, hideMainButton } = useTelegram()

  const showMainButton = useCallback((config: MainButtonConfig) => {
    setMainButton({
      text: config.text,
      onClick: config.onClick,
      color: config.color || '#059669',
      isVisible: config.isVisible ?? true
    })
  }, [setMainButton])

  const hideButton = useCallback(() => {
    hideMainButton()
  }, [hideMainButton])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      hideMainButton()
    }
  }, [hideMainButton])

  return {
    showMainButton,
    hideMainButton: hideButton
  }
}