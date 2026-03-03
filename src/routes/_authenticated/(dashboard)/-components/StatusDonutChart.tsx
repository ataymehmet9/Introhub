import { useMemo } from 'react'
import type { StatusBreakdown } from '@/schemas'
import { Card } from '@/components/ui'
import Chart from '@/components/shared/Chart'

export interface StatusDonutChartProps {
  data: StatusBreakdown | undefined
  loading?: boolean
  title?: string
}

export function StatusDonutChart({
  data,
  loading = false,
  title = 'Request Status Breakdown',
}: StatusDonutChartProps) {
  const chartData = useMemo(() => {
    if (!data) {
      return {
        series: [],
        labels: [],
      }
    }

    return {
      series: [data.pending, data.approved, data.declined],
      labels: ['Pending', 'Approved', 'Declined'],
    }
  }, [data])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="h-80 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </Card>
    )
  }

  if (!data || data.total === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex h-80 items-center justify-center text-gray-500 dark:text-gray-400">
          No requests in the selected period
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <div className="flex flex-col items-center">
        <Chart
          type="donut"
          series={chartData.series}
          height={280}
          donutTitle="Total"
          donutText={data.total.toString()}
          customOptions={{
            labels: chartData.labels,
            colors: ['#F59E0B', '#10B981', '#EF4444'], // warning, success, danger
            legend: {
              position: 'bottom',
              horizontalAlign: 'center',
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '70%',
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontSize: '14px',
                      fontWeight: 600,
                    },
                    value: {
                      show: true,
                      fontSize: '24px',
                      fontWeight: 700,
                    },
                    total: {
                      show: true,
                      label: 'Total Requests',
                      fontSize: '14px',
                      fontWeight: 600,
                    },
                  },
                },
              },
            },
            dataLabels: {
              enabled: true,
              formatter: (val: number) => `${val.toFixed(1)}%`,
            },
            tooltip: {
              y: {
                formatter: (val: number) => `${val} requests`,
              },
            },
          }}
        />
        <div className="mt-4 grid w-full grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-lg font-semibold text-warning-600 dark:text-warning-400">
              {data.pending}
            </p>
            <p className="text-xs text-gray-500">
              {data.pendingPercentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
            <p className="text-lg font-semibold text-success-600 dark:text-success-400">
              {data.approved}
            </p>
            <p className="text-xs text-gray-500">
              {data.approvedPercentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Declined</p>
            <p className="text-lg font-semibold text-danger-600 dark:text-danger-400">
              {data.declined}
            </p>
            <p className="text-xs text-gray-500">
              {data.declinedPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
