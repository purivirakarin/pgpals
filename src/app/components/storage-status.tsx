"use client"

import { AlertCircle, Cloud, HardDrive } from 'lucide-react'
import { useTelegram } from '@/hooks/use-telegram'

interface StorageStatusProps {
  isUsingLocalStorage: boolean
  className?: string
}

export function StorageStatus({ isUsingLocalStorage, className = "" }: StorageStatusProps) {
  const { hasCloudStorage } = useTelegram()

  if (hasCloudStorage && !isUsingLocalStorage) {
    return (
      <div className={`flex items-center gap-2 text-xs text-emerald-300/80 ${className}`}>
        <Cloud className="h-3 w-3" />
        <span>Synced to Telegram Cloud</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-amber-300/80 ${className}`}>
      <HardDrive className="h-3 w-3" />
      <span>Saved locally on this device</span>
      {!hasCloudStorage && (
        <div className="flex items-center gap-1 ml-2">
          <AlertCircle className="h-3 w-3" />
          <span className="text-amber-200">Telegram v6.1+ required for cloud sync</span>
        </div>
      )}
    </div>
  )
}


