import { useCallback } from 'react'
import { useToast } from './use-toast'

interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
}

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback((
    error: Error | string,
    context?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, logToConsole = true } = options
    
    const errorMessage = typeof error === 'string' ? error : error.message
    const fullContext = context ? `${context}: ${errorMessage}` : errorMessage

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.error(fullContext, error)
    }

    // Show user-friendly toast notification
    if (showToast) {
      toast({
        title: "Something went wrong",
        description: getUserFriendlyMessage(errorMessage),
        variant: "destructive",
      })
    }

    // In production, you could send this to an error reporting service
    // Example: reportError(error, context)
  }, [toast])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error as Error, context, options)
      return null
    }
  }, [handleError])

  return {
    handleError,
    handleAsyncError,
  }
}

function getUserFriendlyMessage(error: string): string {
  // Map technical errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Failed to load data': 'Unable to load your data. Please check your connection and try again.',
    'Failed to save data': 'Unable to save your changes. Please try again.',
    'Failed to save to cloud storage': 'Unable to sync your data. Your progress is saved locally.',
    'Network Error': 'Please check your internet connection and try again.',
    'Timeout': 'The request took too long. Please try again.',
  }

  // Look for partial matches
  for (const [key, message] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return message
    }
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.'
}