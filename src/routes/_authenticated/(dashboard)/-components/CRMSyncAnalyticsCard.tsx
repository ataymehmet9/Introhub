import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiRefresh,
} from 'react-icons/hi'
import { Link } from '@tanstack/react-router'
import { useDashboardStore } from '../-store/dashboardStore'
import { Badge, Card, Tabs } from '@/components/ui'
import { useTRPC } from '@/integrations/trpc/react'
import classNames from '@/utils/classNames'

interface CRMIntegration {
  id: number
  provider: 'hubspot'
  status: 'active' | 'error' | 'expired'
}

interface SyncAnalytics {
  totalSyncs: number
  successRate: number
  avgSyncTime: number
  avgSyncTimeFormatted: string
  lastSyncStatus: {
    status: 'in_progress' | 'completed' | 'failed' | 'partial'
    timestamp: Date
    timeAgo: string
    successCount: number
    errorCount: number
    updatedCount: number
    skippedCount: number
  } | null
  completedSyncs: number
  failedSyncs: number
}

export interface CRMSyncAnalyticsCardProps {
  integrations: Array<CRMIntegration>
  loading?: boolean
}

export function CRMSyncAnalyticsCard({
  integrations,
  loading = false,
}: CRMSyncAnalyticsCardProps) {
  const { dateRange } = useDashboardStore()
  const [activeTab, setActiveTab] = useState<string>(
    integrations[0]?.provider || 'hubspot',
  )

  // If no integrations, don't render the card
  if (!loading && integrations.length === 0) {
    return null
  }

  if (loading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          CRM Sync Analytics
        </h3>
        <Link
          to="/crm-integrations"
          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          View CRM Integrations →
        </Link>
      </div>

      {integrations.length > 1 ? (
        <Tabs value={activeTab} onChange={setActiveTab}>
          <>
            <Tabs.TabList>
              {integrations.map((integration) => (
                <Tabs.TabNav
                  key={integration.provider}
                  value={integration.provider}
                >
                  {integration.provider === 'hubspot'
                    ? 'HubSpot'
                    : integration.provider}
                </Tabs.TabNav>
              ))}
            </Tabs.TabList>
            {integrations.map((integration) => (
              <Tabs.TabContent
                key={integration.provider}
                value={integration.provider}
              >
                <SyncMetrics
                  provider={integration.provider}
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                />
              </Tabs.TabContent>
            ))}
          </>
        </Tabs>
      ) : (
        <SyncMetrics
          provider={integrations[0].provider}
          startDate={dateRange.start}
          endDate={dateRange.end}
        />
      )}
    </Card>
  )
}

interface SyncMetricsProps {
  provider: 'hubspot'
  startDate: Date
  endDate: Date
}

function SyncMetrics({ provider, startDate, endDate }: SyncMetricsProps) {
  const trpc = useTRPC()

  const { data, isLoading } = useQuery({
    ...trpc.crm.getSyncAnalytics.queryOptions({
      provider,
      startDate,
      endDate,
    }),
  })

  const analytics = data as SyncAnalytics | undefined

  if (isLoading) {
    return (
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="mt-4 flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No sync data available for the selected period
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success">
            <HiCheckCircle className="mr-1" />
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-error/10 text-error">
            <HiExclamationCircle className="mr-1" />
            Failed
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-info/10 text-info">
            <HiRefresh className="mr-1 animate-spin" />
            In Progress
          </Badge>
        )
      case 'partial':
        return (
          <Badge className="bg-warning/10 text-warning">
            <HiExclamationCircle className="mr-1" />
            Partial
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Success Rate */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Success Rate
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.successRate}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {analytics.completedSyncs}/{analytics.totalSyncs}
            </p>
          </div>
        </div>

        {/* Total Syncs */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Total Syncs
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analytics.totalSyncs}
          </p>
        </div>

        {/* Avg Sync Time */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Avg Sync Time
          </p>
          <div className="flex items-center gap-1">
            <HiClock className="text-gray-500 dark:text-gray-400" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analytics.avgSyncTimeFormatted || 'N/A'}
            </p>
          </div>
        </div>

        {/* Failed Syncs */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Failed Syncs
          </p>
          <p
            className={classNames(
              'text-2xl font-bold',
              analytics.failedSyncs > 0
                ? 'text-error'
                : 'text-gray-900 dark:text-gray-100',
            )}
          >
            {analytics.failedSyncs}
          </p>
        </div>
      </div>

      {/* Last Sync Status */}
      {analytics.lastSyncStatus && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Sync
            </p>
            {getStatusBadge(analytics.lastSyncStatus.status)}
          </div>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p>{analytics.lastSyncStatus.timeAgo}</p>
            <div className="flex flex-wrap gap-3">
              <span className="text-success">
                ✓ {analytics.lastSyncStatus.successCount} success
              </span>
              {analytics.lastSyncStatus.errorCount > 0 && (
                <span className="text-error">
                  ✗ {analytics.lastSyncStatus.errorCount} errors
                </span>
              )}
              {analytics.lastSyncStatus.updatedCount > 0 && (
                <span>↻ {analytics.lastSyncStatus.updatedCount} updated</span>
              )}
              {analytics.lastSyncStatus.skippedCount > 0 && (
                <span>⊘ {analytics.lastSyncStatus.skippedCount} skipped</span>
              )}
            </div>
          </div>
        </div>
      )}

      {!analytics.lastSyncStatus && analytics.totalSyncs === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No syncs performed in the selected period
          </p>
        </div>
      )}
    </div>
  )
}

// Made with Bob
