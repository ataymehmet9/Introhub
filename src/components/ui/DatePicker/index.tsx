import _DatePicker from './DatePicker'
import DatePickerRange from './DatePickerRange'
import DateTimepicker from './DateTimepicker'
import type { DatePickerProps } from './DatePicker';
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

export type { DatePickerProps } from './DatePicker'
export type { DatePickerRangeProps } from './DatePickerRange'
export type { DateTimepickerProps } from './DateTimepicker'

type CompoundedComponent = ForwardRefExoticComponent<
  DatePickerProps & RefAttributes<HTMLSpanElement>
> & {
  DatePickerRange: typeof DatePickerRange
  DateTimepicker: typeof DateTimepicker
}

const DatePicker = _DatePicker as CompoundedComponent

DatePicker.DatePickerRange = DatePickerRange
DatePicker.DateTimepicker = DateTimepicker

export { DatePicker }

export default DatePicker
