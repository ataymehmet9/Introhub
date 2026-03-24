import _Segment from './Segment'
import SegmentItem from './SegmentItem'
import type { SegmentProps } from './Segment'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

export type { SegmentProps } from './Segment'
export type { SegmentItemProps } from './SegmentItem'

type CompoundedComponent = ForwardRefExoticComponent<
  SegmentProps & RefAttributes<HTMLHtmlElement>
> & {
  Item: typeof SegmentItem
}

const Segment = _Segment as CompoundedComponent

Segment.Item = SegmentItem

export { Segment }

export default Segment
