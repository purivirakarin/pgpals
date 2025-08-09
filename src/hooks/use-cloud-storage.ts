import { useState, useEffect, useCallback } from 'react'
import { useTelegram } from './use-telegram'
import { useErrorHandler } from './use-error-handler'
import { ERROR_MESSAGES } from '@/lib/constants'

export function useCloudStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false)
  const telegram = useTelegram()
  const { getCloudData, setCloudData, hasCloudStorage } = telegram
  const { handleAsyncError } = useErrorHandler()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      setIsUsingLocalStorage(!hasCloudStorage)
      const result = await handleAsyncError(
        async () => {
          const cloudData = await getCloudData(key)
          if (cloudData) {
            const parsedData = JSON.parse(cloudData)
            setData(parsedData)
          }
        },
        'Loading storage data',
        { showToast: false }
      )
      if (result === null) {
        setError(hasCloudStorage ? ERROR_MESSAGES.CLOUD_STORAGE_LOAD_FAILED : 'Using local storage')
      }
      setLoading(false)
    }
    loadData()
  }, [key, getCloudData, handleAsyncError, hasCloudStorage])

  const saveData = useCallback(async (newData: T) => {
    setError(null)
    const result = await handleAsyncError(
      async () => {
        const success = await setCloudData(key, JSON.stringify(newData))
        if (success) {
          setData(newData)
          return success
        } else {
          throw new Error(ERROR_MESSAGES.CLOUD_STORAGE_SAVE_ERROR)
        }
      },
      'Saving to cloud storage'
    )
    if (result === null) {
      setError(ERROR_MESSAGES.CLOUD_STORAGE_SAVE_FAILED)
    }
  }, [key, setCloudData, handleAsyncError])

  return { data, setData: saveData, loading, error, isUsingLocalStorage, hasCloudStorage }
}


