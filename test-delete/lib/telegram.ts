// Telegram WebApp integration
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
          }
          start_param?: string
        }
        version: string
        platform: string
        colorScheme: 'light' | 'dark'
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isClosingConfirmationEnabled: boolean
        BackButton: {
          isVisible: boolean
          show(): void
          hide(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText(text: string): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
          show(): void
          hide(): void
          enable(): void
          disable(): void
          showProgress(leaveActive?: boolean): void
          hideProgress(): void
          setParams(params: {
            text?: string
            color?: string
            text_color?: string
            is_active?: boolean
            is_visible?: boolean
          }): void
        }
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
          notificationOccurred(type: 'error' | 'success' | 'warning'): void
          selectionChanged(): void
        }
        CloudStorage: {
          setItem(key: string, value: string, callback?: (error: string | null, success: boolean) => void): void
          getItem(key: string, callback: (error: string | null, value: string | null) => void): void
          getItems(keys: string[], callback: (error: string | null, values: Record<string, string>) => void): void
          removeItem(key: string, callback?: (error: string | null, success: boolean) => void): void
          removeItems(keys: string[], callback?: (error: string | null, success: boolean) => void): void
          getKeys(callback: (error: string | null, keys: string[]) => void): void
        }
        ready(): void
        expand(): void
        close(): void
        sendData(data: string): void
        switchInlineQuery(query: string, choose_chat_types?: string[]): void
        openLink(url: string, options?: { try_instant_view?: boolean }): void
        openTelegramLink(url: string): void
        openInvoice(url: string, callback?: (status: string) => void): void
        showPopup(params: {
          title?: string
          message: string
          buttons?: Array<{
            id?: string
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
            text: string
          }>
        }, callback?: (buttonId: string) => void): void
        showAlert(message: string, callback?: () => void): void
        showConfirm(message: string, callback?: (confirmed: boolean) => void): void
        showScanQrPopup(params: {
          text?: string
        }, callback?: (text: string) => void): void
        closeScanQrPopup(): void
        readTextFromClipboard(callback?: (text: string) => void): void
        requestWriteAccess(callback?: (granted: boolean) => void): void
        requestContact(callback?: (granted: boolean, contact?: {
          contact: {
            phone_number: string
            first_name: string
            last_name?: string
            user_id?: number
          }
        }) => void): void
        invokeCustomMethod(method: string, params: Record<string, unknown>, callback?: (error: string | null, result: unknown) => void): void
      }
    }
  }
}

export class TelegramWebApp {
  private static instance: TelegramWebApp
  private webApp: typeof window.Telegram.WebApp | null = null
  private supportsCloudStorage = false

  private constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp
      this.initializeWebApp()
    }
  }

  private initializeWebApp() {
    if (!this.webApp) return

    // Initialize the Web App
    this.webApp.ready()
    this.webApp.expand()

    // Set app theme
    this.webApp.headerColor = '#059669'
    this.webApp.backgroundColor = '#0f172a'

    // Check if CloudStorage is supported (requires version 6.1+)
    this.supportsCloudStorage = this.webApp.CloudStorage && 
      this.isVersionSupported(this.webApp.version, '6.1')

    // Enable closing confirmation to prevent accidental exits
    this.webApp.isClosingConfirmationEnabled = true

    // Set up viewport
    if (this.webApp.expand) {
      this.webApp.expand()
    }

    // Log initialization for debugging
    console.log('Telegram Web App initialized:', {
      version: this.webApp.version,
      platform: this.webApp.platform,
      colorScheme: this.webApp.colorScheme,
      supportsCloudStorage: this.supportsCloudStorage
    })
  }

  private isVersionSupported(currentVersion: string, requiredVersion: string): boolean {
    try {
      const current = currentVersion.split('.').map(Number)
      const required = requiredVersion.split('.').map(Number)
      
      for (let i = 0; i < Math.max(current.length, required.length); i++) {
        const currentPart = current[i] || 0
        const requiredPart = required[i] || 0
        
        if (currentPart > requiredPart) return true
        if (currentPart < requiredPart) return false
      }
      
      return true // Equal versions
    } catch {
      return false // Invalid version format
    }
  }

  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp()
    }
    return TelegramWebApp.instance
  }

  get user() {
    return this.webApp?.initDataUnsafe?.user || null
  }

  get colorScheme() {
    return this.webApp?.colorScheme || 'light'
  }

  get themeParams() {
    return this.webApp?.themeParams || {}
  }

  // Haptic feedback methods
  impactFeedback(style: 'light' | 'medium' | 'heavy' = 'medium') {
    this.webApp?.HapticFeedback.impactOccurred(style)
  }

  notificationFeedback(type: 'error' | 'success' | 'warning') {
    this.webApp?.HapticFeedback.notificationOccurred(type)
  }

  selectionFeedback() {
    this.webApp?.HapticFeedback.selectionChanged()
  }

  // Cloud storage methods with fallback to localStorage
  async setCloudData(key: string, value: string): Promise<boolean> {
    try {
      if (this.supportsCloudStorage && this.webApp?.CloudStorage) {
        return new Promise((resolve) => {
          this.webApp!.CloudStorage.setItem(key, value, (error, success) => {
            if (error) {
              // Fallback to localStorage on error
              this.setLocalStorageData(key, value)
              resolve(true)
            } else {
              resolve(success || false)
            }
          })
        })
      } else {
        // Fallback to localStorage
        return this.setLocalStorageData(key, value)
      }
    } catch (error) {
      console.warn('CloudStorage failed, using localStorage fallback:', error)
      return this.setLocalStorageData(key, value)
    }
  }

  async getCloudData(key: string): Promise<string | null> {
    try {
      if (this.supportsCloudStorage && this.webApp?.CloudStorage) {
        return new Promise((resolve) => {
          this.webApp!.CloudStorage.getItem(key, (error, value) => {
            if (error) {
              // Fallback to localStorage on error
              resolve(this.getLocalStorageData(key))
            } else {
              resolve(value || null)
            }
          })
        })
      } else {
        // Fallback to localStorage
        return Promise.resolve(this.getLocalStorageData(key))
      }
    } catch (error) {
      console.warn('CloudStorage failed, using localStorage fallback:', error)
      return Promise.resolve(this.getLocalStorageData(key))
    }
  }

  async getCloudKeys(): Promise<string[]> {
    try {
      if (this.supportsCloudStorage && this.webApp?.CloudStorage) {
        return new Promise((resolve) => {
          this.webApp!.CloudStorage.getKeys((error, keys) => {
            if (error) {
              // Fallback to localStorage
              resolve(this.getLocalStorageKeys())
            } else {
              resolve(keys || [])
            }
          })
        })
      } else {
        // Fallback to localStorage
        return Promise.resolve(this.getLocalStorageKeys())
      }
    } catch (error) {
      console.warn('CloudStorage failed, using localStorage fallback:', error)
      return Promise.resolve(this.getLocalStorageKeys())
    }
  }

  // localStorage fallback methods
  private setLocalStorageData(key: string, value: string): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`pgpals_${key}`, value)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  private getLocalStorageData(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(`pgpals_${key}`)
      }
      return null
    } catch {
      return null
    }
  }

  private getLocalStorageKeys(): string[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys: string[] = []
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key?.startsWith('pgpals_')) {
            keys.push(key.replace('pgpals_', ''))
          }
        }
        return keys
      }
      return []
    } catch {
      return []
    }
  }

  // Helper method to check if cloud storage is available
  get hasCloudStorage(): boolean {
    return this.supportsCloudStorage
  }

  // Main button methods
  setMainButton(params: {
    text: string
    onClick: () => void
    color?: string
    isVisible?: boolean
  }) {
    if (!this.webApp) return

    this.webApp.MainButton.setText(params.text)
    this.webApp.MainButton.onClick(params.onClick)
    
    if (params.color) {
      this.webApp.MainButton.color = params.color
    }
    
    if (params.isVisible !== false) {
      this.webApp.MainButton.show()
    }
  }

  hideMainButton() {
    this.webApp?.MainButton.hide()
  }

  // Sharing methods
  shareToChat(text: string) {
    this.webApp?.switchInlineQuery(text)
  }

  // Popup methods
  showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.webApp?.showAlert(message, resolve)
    })
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.webApp?.showConfirm(message, resolve)
    })
  }

  // QR Scanner
  scanQR(text?: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.webApp?.showScanQrPopup(
        { text: text || 'Scan QR Code' },
        (result) => resolve(result || null)
      )
    })
  }

  // Close app
  close() {
    this.webApp?.close()
  }
}

export const telegramWebApp = TelegramWebApp.getInstance()
