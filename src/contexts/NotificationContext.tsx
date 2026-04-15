import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationSSE } from '@/hooks/useNotificationSSE'

type NotificationContextValue = ReturnType<typeof useNotifications> & {
  connectionStatus: ReturnType<typeof useNotificationSSE>['connectionStatus']
  isConnected: boolean
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  // Call hooks once at the provider level
  const notificationData = useNotifications()
  const { connectionStatus, isConnected } = useNotificationSSE()

  // Memoize the context value to prevent unnecessary re-renders
  const value: NotificationContextValue = useMemo(
    () => ({
      ...notificationData,
      connectionStatus,
      isConnected,
    }),
    [notificationData, connectionStatus, isConnected],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within NotificationProvider',
    )
  }
  return context
}

// Made with Bob
