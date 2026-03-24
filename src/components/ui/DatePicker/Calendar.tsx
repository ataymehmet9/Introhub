import CalendarBase from './CalendarBase'
import { isSameDate } from './utils'
import type { CommonProps } from '../@types/common'
import type { CalendarSharedProps } from './CalendarBase'

export interface CalenderProps<MultipleSelection extends boolean = false>
  extends CommonProps, CalendarSharedProps {
  multipleSelection?: MultipleSelection
  value?: MultipleSelection extends true ? Array<Date> : Date | null
  onChange?: (
    value: MultipleSelection extends true ? Array<Date> : Date | null,
  ) => void
}

const Calendar = <MultipleSelection extends boolean = false>(
  props: CalenderProps<MultipleSelection>,
) => {
  const { multipleSelection, value, onChange, ...rest } = props

  const handleChange = (date: Date | Array<Date>) => {
    if (!multipleSelection) {
      return onChange?.(
        date as MultipleSelection extends true ? Array<Date> : Date,
      )
    }

    const isSelected = (value as Array<Date>)?.some((val) =>
      isSameDate(val, date as Date),
    )

    return onChange?.(
      (isSelected
        ? (value as Array<Date>)?.filter(
            (val: Date) => !isSameDate(val, date as Date),
          )
        : [...(value as Array<Date>), date]) as MultipleSelection extends true
        ? Array<Date>
        : Date,
    )
  }

  return <CalendarBase value={value} onChange={handleChange} {...rest} />
}

export default Calendar
