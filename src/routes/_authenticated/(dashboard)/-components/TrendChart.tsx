import { useMemo } from 'react'
import type { TrendData } from '@/schemas'
import { Card } from '@/components/ui'
import Chart from '@/components/shared/Chart'

export interface TrendChartProps {
  data: TrendData | undefined
  loading?: boolean
  title?: string
}

export function TrendChart({
  data,
  loading = false,
  title = 'Request Trends',
}: TrendChartProps) {
  const chartData = useMemo(() => {
    if (!data?.dataPoints) {
      return {
        categories: [],
        series: [],
      }
    }

    const categories = data.dataPoints.map((point) => {
      const date = new Date(point.date)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    })

    const series = [
      {
        name: 'Requests Made',
        data: data.dataPoints.map((point) => point.requestsMade),
      },
      {
        name: 'Requests Received',
        data: data.dataPoints.map((point) => point.requestsReceived),
      },
      {
        name: 'Approved',
        data: data.dataPoints.map((point) => point.requestsApproved),
      },
      {
        name: 'Declined',
        data: data.dataPoints.map((point) => point.requestsDeclined),
      },
    ]

    return { categories, series }
  }, [data])

  if (loading) {
    return (
      <Card className="p-3 sm:p-6">
        <div className="mb-2 sm:mb-4">
          <div className="h-5 sm:h-6 w-32 sm:w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="h-56 sm:h-80 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </Card>
    )
  }

  if (!data || chartData.series.length === 0) {
    return (
      <Card className="p-3 sm:p-6">
        <h3 className="mb-2 sm:mb-4 text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <div className="flex h-56 sm:h-80 items-center justify-center text-xs sm:text-base text-gray-500 dark:text-gray-400">
          No data available for the selected period
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3 sm:p-6">
      <h3 className="mb-2 sm:mb-4 text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <Chart
        type="area"
        series={chartData.series}
        xAxis={chartData.categories}
        height={280}
        customOptions={{
          chart: {
            toolbar: {
              show: true,
              tools: {
                download: true,
                selection: false,
                zoom: false,
                zoomin: false,
                zoomout: false,
                pan: false,
                reset: false,
              },
            },
          },
          stroke: {
            curve: 'smooth',
            width: 2,
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.1,
              stops: [0, 90, 100],
            },
          },
          dataLabels: {
            enabled: false,
          },
          legend: {
            position: 'top',
            horizontalAlign: 'center',
            floating: false,
            fontSize: '11px',
            fontWeight: 500,
            offsetY: 0,
            markers: {
              width: 7,
              height: 7,
              radius: 12,
            },
            itemMargin: {
              horizontal: 6,
              vertical: 0,
            },
          },
          tooltip: {
            shared: true,
            intersect: false,
          },
        }}
      />
    </Card>
  )
}
