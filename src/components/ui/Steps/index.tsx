import _Steps from './Steps'
import StepItem from './StepItem'
import type { StepsProps } from './Steps'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

export type { StepsProps } from './Steps'
export type { StepItemProps } from './StepItem'

type CompoundedComponent = ForwardRefExoticComponent<
  StepsProps & RefAttributes<HTMLDivElement>
> & {
  Item: typeof StepItem
}

const Steps = _Steps as CompoundedComponent

Steps.Item = StepItem

export { Steps }

export default Steps
