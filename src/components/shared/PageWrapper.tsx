import { useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { preparePageTransition } from '@/utils/view-transitions'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * PageWrapper component that handles smooth page transitions
 * Wraps page content and manages view transitions
 */
export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Prepare for view transitions on route changes
    const unsubscribe = router.subscribe('onBeforeLoad', () => {
      preparePageTransition()
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  return (
    <div
      ref={contentRef}
      className={`content-reveal transition-container ${className}`}
    >
      {children}
    </div>
  )
}

// Made with Bob
