import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRouteTransitionController } from './route-transition'
import type { RouteTransitionDirection } from './route-transition'

export type { RouteTransitionDirection } from './route-transition'

/** Call from navigation events; the persistent main element owns view-transition-name: page. */
export function useRouteTransition() {
  const [busy, setBusy] = useState(false)
  const controllerRef = useRef<ReturnType<typeof createRouteTransitionController> | null>(null)

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const supportsNative = typeof document.startViewTransition === 'function'
    const rootElement = document.documentElement
    rootElement.dataset.transitions = supportsNative ? 'native' : 'entry'
    const controller = createRouteTransitionController({
      start: supportsNative
        ? update => document.startViewTransition(update)
        : undefined,
      reducedMotion: () => reduced.matches,
      commit: update => flushSync(update),
      setDirection: direction => {
        if (direction) document.documentElement.dataset.direction = direction
        else delete document.documentElement.dataset.direction
      },
      onBusyChange: setBusy,
    })
    controllerRef.current = controller
    return () => {
      controllerRef.current = null
      controller.dispose()
      delete rootElement.dataset.transitions
    }
  }, [])

  const transition = useCallback((update: () => void, direction: RouteTransitionDirection) => {
    controllerRef.current?.transition(update, direction)
  }, [])

  return { transition, busy }
}
