import _Carousel from './Carousel'
import CarouselContent from './CarouselContent'
import CarouselItem from './CarouselItem'
import CarouselPrevious from './CarouselPrevious'
import CarouselNext from './CarouselNext'
import type { CarouselProps } from './Carousel';
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

export type { CarouselProps } from './Carousel'
export type { CarouselContentProps } from './CarouselContent'
export type { CarouselItemProps } from './CarouselItem'
export type { CarouselPreviousProps } from './CarouselPrevious'
export type { CarouselNextProps } from './CarouselNext'
export type { CarouselApi, CarouselOrientation } from './context'

type CompoundedComponent = ForwardRefExoticComponent<
  CarouselProps & RefAttributes<HTMLDivElement>
> & {
  Content: typeof CarouselContent
  Item: typeof CarouselItem
  Previous: typeof CarouselPrevious
  Next: typeof CarouselNext
}

const Carousel = _Carousel as CompoundedComponent

Carousel.Content = CarouselContent
Carousel.Item = CarouselItem
Carousel.Previous = CarouselPrevious
Carousel.Next = CarouselNext

export { Carousel }

export default Carousel
