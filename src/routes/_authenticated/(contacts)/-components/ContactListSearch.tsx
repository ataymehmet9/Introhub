import { TbSearch, TbX } from 'react-icons/tb'
import type { Ref } from 'react'
import DebounceInput from '@/components/shared/DebouceInput'
import { Button } from '@/components/ui'

type ContactListSearchProps = {
  onInputChange: (value: string) => void
  defaultValue?: string
  ref?: Ref<HTMLInputElement>
}

const ContactListSearch = (props: ContactListSearchProps) => {
  const { onInputChange, defaultValue, ref } = props

  const handleClear = () => {
    onInputChange('')
  }

  return (
    <DebounceInput
      key={defaultValue || 'empty'}
      ref={ref}
      placeholder="Quick search..."
      prefix={<TbSearch className="text-xl" />}
      suffix={
        defaultValue && (
          <Button
            size="xs"
            variant="plain"
            icon={<TbX />}
            onClick={handleClear}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          />
        )
      }
      defaultValue={defaultValue}
      onChange={(e: { target: { value: string } }) =>
        onInputChange(e.target.value)
      }
    />
  )
}

export default ContactListSearch
