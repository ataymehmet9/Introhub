import { useCallback, useEffect, useState } from 'react'

// Default width for SSR (server-side rendering)
const DEFAULT_WIDTH = 1024

const useWindowWidth = (isResponsive: boolean = true): number => {
  // Check if window is available (client-side only)
  const [windowWidth, setWindowSize] = useState(
    typeof window !== 'undefined' ? window.innerWidth : DEFAULT_WIDTH,
  )

  const handleResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWindowSize(window.innerWidth)
    }
  }, [])

  useEffect(() => {
    // Set the actual window width on mount (client-side)
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWindowSize(window.innerWidth)
    }

    if (isResponsive && typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isResponsive, handleResize])

  return windowWidth
}

export default useWindowWidth
