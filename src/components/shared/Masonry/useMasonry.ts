import { Children, isValidElement, useMemo } from 'react'

import useColumnsCount from './useCoulmnsCount'
import type { ReactNode} from 'react';
import type { Columns } from './types'

const createEmptyColumns = (count: number): Array<[]> => {
  return Array.from({ length: count }, () => [])
}

const useMasonry = (children: ReactNode, columns?: Columns): Array<Array<ReactNode>> => {
  const noOfColumns = useColumnsCount(columns)

  const columnsChildren = useMemo(() => {
    const group: Array<Array<ReactNode>> = createEmptyColumns(noOfColumns)

    Children.forEach(children, (child, index) => {
      if (isValidElement(child)) {
        group[index % noOfColumns].push(child)
      }
    })

    return group
  }, [noOfColumns, children])

  return columnsChildren
}

export default useMasonry
