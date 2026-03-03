import { useEffect, useMemo, useRef } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */
function useCallbackRef<T extends (...args: Array<any>) => any>(
  cb: T | undefined,
): T {
  const cbRef = useRef(cb)

  useEffect(() => {
    cbRef.current = cb
  })

  return useMemo(() => ((...args) => cbRef.current?.(...args)) as T, [])
}

export default useCallbackRef
