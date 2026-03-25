import { createContext } from 'react'

export type CheckboxValue = string | number | boolean
export type CheckboxGroupValue = Array<string>

export interface CheckboxGroupContextProps {
  checkboxClass?: string
  name?: string
  onChange?: (
    value: CheckboxValue,
    checked: boolean,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void
  value?: CheckboxGroupValue
  vertical?: boolean
}

const CheckboxGroupContext = createContext<CheckboxGroupContextProps>({})

// eslint-disable-next-line react-refresh/only-export-components
export const CheckboxGroupContextProvider = CheckboxGroupContext.Provider

export default CheckboxGroupContext
