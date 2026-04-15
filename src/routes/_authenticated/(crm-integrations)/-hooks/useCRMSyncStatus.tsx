import { useEffect, useState } from 'react'

interface SyncStatusData {
  provider: string
  syncStatus: string
  lastSyncedAt: Date | null
  lastSyncError: string | null
  syncStartedAt: Date | null
}

interface SyncStatusMap {
  [provider: string]: SyncStatusData
}

/**
 * Hook to consume CRM sync status updates via SSE
 *
 * Connects to the SSE endpoint and provides real-time sync status updates
 * for all CRM integrations.
 */
export function useCRMSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatusMap>({})
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      try {
        eventSource = new EventSource('/api/crm/sync-status/stream')

        eventSource.addEventListener('connected', () => {
          console.log('[CRM SSE] Connected to sync status stream')
          setIsConnected(true)
        })

        eventSource.addEventListener('sync_status', (event) => {
          try {
            const data = JSON.parse(event.data) as SyncStatusData
            setSyncStatus((prev) => ({
              ...prev,
              [data.provider]: {
                ...data,
                lastSyncedAt: data.lastSyncedAt
                  ? new Date(data.lastSyncedAt)
                  : null,
                syncStartedAt: data.syncStartedAt
                  ? new Date(data.syncStartedAt)
                  : null,
              },
            }))
          } catch (error) {
            console.error('[CRM SSE] Error parsing sync status:', error)
          }
        })

        eventSource.addEventListener('heartbeat', () => {
          // Heartbeat received - connection is alive
        })

        eventSource.onerror = () => {
          console.error('[CRM SSE] Connection error, will retry...')
          setIsConnected(false)
          eventSource?.close()

          // Retry connection after 5 seconds
          reconnectTimeout = setTimeout(() => {
            connect()
          }, 5000)
        }
      } catch (error) {
        console.error('[CRM SSE] Failed to connect:', error)
      }
    }

    connect()

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  return {
    syncStatus,
    isConnected,
  }
}

// Made with Bob
