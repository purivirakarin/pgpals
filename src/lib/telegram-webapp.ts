// Client-side Telegram WebApp integration utilities
declare global {
  interface Window {
    Telegram: any
  }
}

class TelegramWebApp {
  private static instance: TelegramWebApp
  private webApp: any | null = null
  private supportsCloudStorage = false

  private constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp
      this.initializeWebApp()
    }
  }

  private initializeWebApp() {
    if (!this.webApp) return
    this.webApp.ready()
    this.webApp.expand()
    this.supportsCloudStorage = !!this.webApp.CloudStorage
  }

  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp()
    }
    return TelegramWebApp.instance
  }

  get user() { return this.webApp?.initDataUnsafe?.user || null }
  get colorScheme() { return this.webApp?.colorScheme || 'light' }
  get themeParams() { return this.webApp?.themeParams || {} }
  get hasCloudStorage(): boolean { return this.supportsCloudStorage }

  impactFeedback(style: 'light' | 'medium' | 'heavy' = 'medium') { this.webApp?.HapticFeedback?.impactOccurred(style) }
  notificationFeedback(type: 'error' | 'success' | 'warning') { this.webApp?.HapticFeedback?.notificationOccurred(type) }
  selectionFeedback() { this.webApp?.HapticFeedback?.selectionChanged() }

  async setCloudData(key: string, value: string): Promise<boolean> {
    try {
      if (this.supportsCloudStorage && this.webApp?.CloudStorage) {
        return new Promise((resolve) => {
          this.webApp!.CloudStorage.setItem(key, value, (error: string | null, success: boolean) => {
            resolve(!error && success)
          })
        })
      }
      window.localStorage?.setItem(`pgpals_${key}`, value)
      return true
    } catch {
      return false
    }
  }

  async getCloudData(key: string): Promise<string | null> {
    try {
      if (this.supportsCloudStorage && this.webApp?.CloudStorage) {
        return new Promise((resolve) => {
          this.webApp!.CloudStorage.getItem(key, (error: string | null, value: string | null) => {
            resolve(error ? null : value)
          })
        })
      }
      return window.localStorage?.getItem(`pgpals_${key}`) || null
    } catch {
      return null
    }
  }

  setMainButton(params: { text: string; onClick: () => void; color?: string; isVisible?: boolean }) {
    if (!this.webApp) return
    this.webApp.MainButton.setText(params.text)
    this.webApp.MainButton.onClick(params.onClick)
    if (params.color) this.webApp.MainButton.color = params.color
    if (params.isVisible !== false) this.webApp.MainButton.show()
  }

  hideMainButton() { this.webApp?.MainButton?.hide() }
  shareToChat(text: string) { this.webApp?.switchInlineQuery?.(text) }
  showAlert(message: string): Promise<void> { return new Promise(res => this.webApp?.showAlert?.(message, res)) }
  showConfirm(message: string): Promise<boolean> { return new Promise(res => this.webApp?.showConfirm?.(message, res)) }
  scanQR(text?: string): Promise<string | null> { return new Promise(res => this.webApp?.showScanQrPopup?.({ text }, (r: string) => res(r || null))) }
  close() { this.webApp?.close?.() }
}

export const telegramWebApp = TelegramWebApp.getInstance()


