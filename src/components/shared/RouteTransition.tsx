import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import Spinner from '@/components/ui/Spinner'

/**
 * RouteTransition component handles smooth page transitions
 * Shows a loading indicator when routes are pending
 */
export function RouteTransition() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isLoading) {
      // Delay showing loader to avoid flash for fast transitions
      timeout = setTimeout(() => {
        setShowLoader(true)
      }, 150)
    } else {
      setShowLoader(false)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [isLoading])

  if (!showLoader) return null

  return (
    <>
      {/* Progress bar at top */}
      <div className="route-progress-bar" />

      {/* Optional: Full overlay with spinner for slower loads */}
      {isLoading && (
        <div className="route-pending-overlay">
          <Spinner size={40} />
        </div>
      )}
    </>
  )
}

/**
 * PageTransitionWrapper wraps page content with transition classes
 */
export function PageTransitionWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="content-reveal">{children}</div>
}
