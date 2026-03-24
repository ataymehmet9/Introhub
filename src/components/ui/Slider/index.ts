import _Slider from './Slider'
import RangeSlider from './RangeSlider'
import type { SliderProps } from './Slider'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

export type { SliderProps } from './Slider'
export type { RangeSliderProps } from './RangeSlider'

type CompoundedComponent = ForwardRefExoticComponent<
  SliderProps & RefAttributes<HTMLSpanElement>
> & {
  Range: typeof RangeSlider
}

const Slider = _Slider as CompoundedComponent

Slider.Range = RangeSlider

export { Slider }

export default Slider
