import { useState } from 'react'
import { HiCalendar } from 'react-icons/hi'
import { useDashboardStore } from '../-store/dashboardStore'
import { useDateRangePresets } from '../-hooks/useDateRangePresets'
import { DatePicker, Select } from '@/components/ui'

export function DateRangeSelector() {
  const { dateRange, setDateRange, preset } = useDashboardStore()
  const { presets, setPreset } = useDateRangePresets()
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const handlePresetChange = (value: string) => {
    const selectedPreset = value as any
    setPreset(selectedPreset)
    if (selectedPreset !== 'custom') {
      setShowCustomPicker(false)
    } else {
      setShowCustomPicker(true)
    }
  }

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setDateRange({
        start: date,
        end: dateRange.end,
      })
    }
  }

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setDateRange({
        start: dateRange.start,
        end: date,
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <HiCalendar className="text-xl text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Show by:
        </span>
      </div>

      <Select
        value={presets.find((p) => p.value === preset)}
        options={presets}
        onChange={(option: any) => handlePresetChange(option.value)}
        className="w-full sm:w-48"
        placeholder="Select date range"
      />

      {(preset === 'custom' || showCustomPicker) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <DatePicker
            value={dateRange.start}
            onChange={handleStartDateChange}
            placeholder="Start date"
            maxDate={dateRange.end}
            className="w-full sm:w-40"
          />
          <span className="hidden text-gray-500 sm:inline">to</span>
          <DatePicker
            value={dateRange.end}
            onChange={handleEndDateChange}
            placeholder="End date"
            minDate={dateRange.start}
            maxDate={new Date()}
            className="w-full sm:w-40"
          />
        </div>
      )}
    </div>
  )
}
