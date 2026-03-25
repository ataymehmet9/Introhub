import { createContext } from 'react'

type RadioGroupContextProps = {
  vertical?: boolean
  name?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any
  radioClass?: string
  disabled?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (nextValue: any, e: MouseEvent) => void
}

const RadioGroupContext = createContext<RadioGroupContextProps>({})

// eslint-disable-next-line react-refresh/only-export-components
export const RadioGroupContextProvider = RadioGroupContext.Provider

export default RadioGroupContext
