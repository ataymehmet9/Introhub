/**
 * View Transitions API utilities for smooth page transitions
 * Provides fallback for browsers that don't support the API
 */

/**
 * Check if the browser supports the View Transitions API
 */
export function supportsViewTransitions(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as any).startViewTransition === 'function'
  )
}

/**
 * Execute a callback with view transition if supported, otherwise just execute it
 * @param callback - The function to execute during the transition
 */
export async function withViewTransition(
  callback: () => void | Promise<void>,
): Promise<void> {
  if (!supportsViewTransitions()) {
    await callback()
    return
  }

  const doc = document as any
  const transition = doc.startViewTransition(async () => {
    await callback()
  })

  try {
    await transition.finished
  } catch (error) {
    // Transition was skipped or interrupted, which is fine
    console.debug('View transition interrupted:', error)
  }
}

/**
 * Apply view transition name to an element for targeted transitions
 * @param element - The element to apply the transition name to
 * @param name - The transition name
 */
export function setViewTransitionName(
  element: HTMLElement | null,
  name: string,
): void {
  if (!element || !supportsViewTransitions()) return

  element.style.viewTransitionName = name
}

/**
 * Remove view transition name from an element
 * @param element - The element to remove the transition name from
 */
export function removeViewTransitionName(element: HTMLElement | null): void {
  if (!element) return

  element.style.viewTransitionName = ''
}

/**
 * Hook-like function to manage view transitions for route changes
 * Call this before navigation to prepare for smooth transitions
 */
export function preparePageTransition(): void {
  if (!supportsViewTransitions()) return

  // Add a class to the document to indicate transition is starting
  document.documentElement.classList.add('view-transition-active')

  // Remove the class after transition completes
  setTimeout(() => {
    document.documentElement.classList.remove('view-transition-active')
  }, 500)
}
