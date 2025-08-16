import { useCallback } from 'react'

interface ErrorHandlerOptions { showToast?: boolean; logToConsole?: boolean }

export function useErrorHandler() {
  const handleError = useCallback((error: Error | string, context?: string, options: ErrorHandlerOptions = {}) => {
    const { showToast = false, logToConsole = true } = options
    const errorMessage = typeof error === 'string' ? error : error.message
    const fullContext = context ? `${context}: ${errorMessage}` : errorMessage
    if (logToConsole && process.env.NODE_ENV === 'development') console.error(fullContext)
    if (showToast) {
      // no-op toast placeholder to avoid UI deps
    }
  }, [])

  const handleAsyncError = useCallback(async <T>(asyncFn: () => Promise<T>, context?: string, options?: ErrorHandlerOptions): Promise<T | null> => {
    try { return await asyncFn() } catch (error) { handleError(error as Error, context, options); return null }
  }, [handleError])

  return { handleError, handleAsyncError }
}


