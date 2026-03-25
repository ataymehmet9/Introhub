import { useEffect } from 'react'
import type { Direction } from '@/@types/theme'
import { useThemeStore } from '@/store/themeStore'

function useDirection(): [
  direction: Direction,
  setDirection: (dir: Direction) => void,
] {
  const direction = useThemeStore((state) => state.direction)
  const setDirection = useThemeStore((state) => state.setDirection)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (window === undefined) {
      return
    }
    const root = window.document.documentElement
    root.setAttribute('dir', direction)
  }, [direction])

  return [direction, setDirection]
}

export default useDirection
