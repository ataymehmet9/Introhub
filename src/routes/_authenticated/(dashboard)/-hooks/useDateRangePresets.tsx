import { useMemo } from 'react'
import { useDashboardStore } from '../-store/dashboardStore'
import type { DateRangePreset } from '../-store/dashboardStore'

export interface DateRangePresetOption {
  value: DateRangePreset
  label: string
  description: string
}

/**
 * Hook to manage date range presets
 */
export function useDateRangePresets() {
  const { preset, setDateRangeWithPreset } = useDashboardStore()

  const presets: Array<DateRangePresetOption> = useMemo(
    () => [
      {
        value: 'last7',
        label: 'Last 7 days',
        description: 'View data from the past week',
      },
      {
        value: 'last30',
        label: 'Last 30 days',
        description: 'View data from the past month',
      },
      {
        value: 'last90',
        label: 'Last 90 days',
        description: 'View data from the past quarter',
      },
      {
        value: 'thisMonth',
        label: 'This month',
        description: 'View data from the current month',
      },
      {
        value: 'custom',
        label: 'Custom range',
        description: 'Select a custom date range',
      },
    ],
    [],
  )

  const currentPreset = useMemo(
    () => presets.find((p) => p.value === preset),
    [preset, presets],
  )

  return {
    presets,
    currentPreset,
    activePreset: preset,
    setPreset: setDateRangeWithPreset,
  }
}
