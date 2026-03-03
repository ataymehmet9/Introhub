import { HiTrendingDown, HiTrendingUp } from 'react-icons/hi'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui'
import classNames from '@/utils/classNames'

export interface StatCardProps {
  title: string
  value: string | number
  change?: number | null
  icon?: ReactNode
  description?: string
  loading?: boolean
  className?: string
  variant?: 'light' | 'dark'
}

export function StatCard({
  title,
  value,
  change,
  icon,
  description,
  loading = false,
  className,
  variant = 'dark',
}: StatCardProps) {
  const isPositive = change !== null && change !== undefined && change > 0
  const isNegative = change !== null && change !== undefined && change < 0
  const hasChange = change !== null && change !== undefined
  const isLightVariant = variant === 'light'

  if (loading) {
    return (
      <Card className="p-6 h-full">
        <div className="animate-pulse">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="mb-2 h-8 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={classNames(
        'p-6 transition-shadow hover:shadow-lg h-full',
        className,
      )}
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1">
          <p
            className={classNames(
              'mb-1 text-sm font-medium',
              isLightVariant
                ? 'text-gray-700 dark:text-gray-800'
                : 'text-gray-600 dark:text-gray-400',
            )}
          >
            {title}
          </p>
          <h3
            className={classNames(
              'mb-2 text-3xl font-bold',
              isLightVariant
                ? 'text-gray-900 dark:text-gray-950'
                : 'text-gray-900 dark:text-gray-100',
            )}
          >
            {value}
          </h3>
          {hasChange && (
            <div className="flex items-center gap-1">
              {isPositive && <HiTrendingUp className="text-lg text-success" />}
              {isNegative && <HiTrendingDown className="text-lg text-error" />}
              <span
                className={classNames(
                  'text-sm font-medium',
                  isPositive && 'text-success',
                  isNegative && 'text-error',
                  !isPositive &&
                    !isNegative &&
                    (isLightVariant
                      ? 'text-gray-700 dark:text-gray-800'
                      : 'text-gray-600 dark:text-gray-400'),
                )}
              >
                {isPositive && '+'}
                {change.toFixed(1)}%
              </span>
              <span
                className={classNames(
                  'text-sm',
                  isLightVariant
                    ? 'text-gray-600 dark:text-gray-700'
                    : 'text-gray-500 dark:text-gray-400',
                )}
              >
                vs last period
              </span>
            </div>
          )}
          {description && !hasChange && (
            <p
              className={classNames(
                'text-sm',
                isLightVariant
                  ? 'text-gray-600 dark:text-gray-700'
                  : 'text-gray-500 dark:text-gray-400',
              )}
            >
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center min-h-12 min-w-12 max-h-12 max-w-12 bg-gray-900 text-white rounded-full text-2xl">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
