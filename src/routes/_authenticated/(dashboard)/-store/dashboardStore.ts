import { create } from 'zustand'
import type { Granularity } from '@/schemas'

export type DateRangePreset =
  | 'last7'
  | 'last30'
  | 'last90'
  | 'thisMonth'
  | 'custom'

export interface DateRange {
  start: Date
  end: Date
}

type DashboardState = {
  dateRange: DateRange
  preset: DateRangePreset
  granularity: Granularity | null
}

type DashboardAction = {
  setDateRange: (range: DateRange) => void
  setPreset: (preset: DateRangePreset) => void
  setGranularity: (granularity: Granularity | null) => void
  setDateRangeWithPreset: (preset: DateRangePreset) => void
}

/**
 * Helper function to calculate date range based on preset
 */
function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const end = new Date()
  end.setHours(23, 59, 59, 999) // End of today

  const start = new Date()
  start.setHours(0, 0, 0, 0) // Start of day

  switch (preset) {
    case 'last7':
      start.setDate(start.getDate() - 6) // Last 7 days including today
      break
    case 'last30':
      start.setDate(start.getDate() - 29) // Last 30 days including today
      break
    case 'last90':
      start.setDate(start.getDate() - 89) // Last 90 days including today
      break
    case 'thisMonth':
      start.setDate(1) // First day of current month
      break
    case 'custom':
      // For custom, return last 30 days as default
      start.setDate(start.getDate() - 29)
      break
  }

  return { start, end }
}

// Initialize with last 30 days
const initialDateRange = getDateRangeFromPreset('last30')

const initialState: DashboardState = {
  dateRange: initialDateRange,
  preset: 'last30',
  granularity: null, // Auto-determine based on range
}

export const useDashboardStore = create<DashboardState & DashboardAction>(
  (set) => ({
    ...initialState,

    setDateRange: (range) =>
      set(() => ({
        dateRange: range,
        preset: 'custom',
      })),

    setPreset: (preset) =>
      set(() => ({
        preset,
      })),

    setGranularity: (granularity) =>
      set(() => ({
        granularity,
      })),

    setDateRangeWithPreset: (preset) =>
      set(() => ({
        dateRange: getDateRangeFromPreset(preset),
        preset,
        granularity: null, // Reset to auto-determine
      })),
  }),
)
