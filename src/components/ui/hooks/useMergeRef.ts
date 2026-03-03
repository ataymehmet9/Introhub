/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Dispatch, ForwardedRef, SetStateAction } from 'react'

type Ref<T> = Dispatch<SetStateAction<T>> | ForwardedRef<T>

const useMergeRef =
  <T = any>(...refs: Array<Ref<T>>) =>
  (element: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(element as SetStateAction<T> & (T | null))
      } else if (ref && typeof ref === 'object') {
        ref.current = element
      }
    })
  }

export default useMergeRef
