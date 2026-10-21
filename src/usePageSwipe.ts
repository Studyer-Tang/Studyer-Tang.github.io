import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { bindPageSwipe } from './page-swipe'
import type { SwipeDirection } from './page-swipe'

/** Bind to the book only; keep the target element mounted while this hook is active. */
export function usePageSwipe(target: RefObject<HTMLElement | null>, onSwipe: (direction: SwipeDirection) => void, busy = false) {
  const latest = useRef({ onSwipe, busy })
  const bindingRef = useRef<ReturnType<typeof bindPageSwipe> | null>(null)
  useLayoutEffect(() => {
    latest.current = { onSwipe, busy }
    bindingRef.current?.setBusy(busy)
  }, [onSwipe, busy])

  useEffect(() => {
    const node = target.current
    if (!node) return
    const binding = bindPageSwipe(node, direction => latest.current.onSwipe(direction), latest.current.busy)
    bindingRef.current = binding
    return () => {
      binding.dispose()
      if (bindingRef.current === binding) bindingRef.current = null
    }
  }, [target])
}
