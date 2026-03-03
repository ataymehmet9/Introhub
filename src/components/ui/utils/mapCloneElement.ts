/* eslint-disable @typescript-eslint/no-explicit-any */
import { Children, cloneElement, isValidElement } from 'react'
import type { DetailedReactHTMLElement, ReactNode } from 'react'

function map(children: ReactNode, func: any, context?: any) {
  let index = 0
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child
    }
    const handle = func.call(context, child, index)
    index += 1
    return handle
  })
}

function mapCloneElement(children: ReactNode, func: any, context?: any) {
  return map(
    children,
    (child: DetailedReactHTMLElement<any, HTMLElement>, index: number) =>
      cloneElement(child, {
        key: index,
        ...func(child, index),
      }),
    context,
  )
}

export default mapCloneElement
