export type SwipeDirection = -1 | 1
export type SwipeWheel = {
  deltaX: number; deltaY: number; deltaMode?: number
  ctrlKey?: boolean; metaKey?: boolean
}

export const SWIPE_THRESHOLD = 64
export const SWIPE_QUIET_MS = 180
const REVERSE_THRESHOLD = 24

/** One horizontal wheel gesture can turn one page, including its momentum tail. */
export function createPageSwipeController() {
  let direction: SwipeDirection | 0 = 0
  let distance = 0
  let reversal = 0
  let latched = false
  let lastTime: number | undefined
  let busy = false

  const reset = () => {
    direction = 0
    distance = 0
    reversal = 0
    latched = false
    lastTime = undefined
  }

  return {
    reset,
    setBusy(value: boolean) {
      busy = value
      if (value) {
        distance = 0
        reversal = 0
        // Do not treat the remainder of an interrupted gesture as a new one.
        if (direction) latched = true
      }
    },
    handle(event: SwipeWheel, now: number, pageWidth = 800): { handled: boolean; direction: SwipeDirection | 0 } {
      const ignored = { handled: false, direction: 0 as const }
      if (event.ctrlKey || event.metaKey) {
        reset()
        return ignored
      }
      if (!Number.isFinite(event.deltaX) || !Number.isFinite(event.deltaY) || !Number.isFinite(now)) return ignored
      const pageUnit = Number.isFinite(pageWidth) && pageWidth > 0 ? pageWidth : 800
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageUnit : 1
      const x = event.deltaX * unit
      const y = event.deltaY * unit
      // Leave vertical scrolling and diagonal gestures to the browser.
      if (!(Math.abs(x) > Math.abs(y) * 1.5)) return ignored
      if (lastTime !== undefined && now - lastTime >= SWIPE_QUIET_MS) reset()
      lastTime = now
      const next: SwipeDirection = x > 0 ? 1 : -1
      const amount = Math.abs(x)
      if (busy) {
        direction = next
        distance = 0
        reversal = 0
        latched = true
        return { handled: true, direction: 0 }
      }
      if (!direction) direction = next
      if (latched) {
        if (next === direction) {
          reversal = 0
          return { handled: true, direction: 0 }
        }
        reversal += amount
        if (reversal < REVERSE_THRESHOLD) return { handled: true, direction: 0 }
        direction = next
        distance = reversal
        reversal = 0
        latched = false
      } else if (next === direction) {
        distance += amount
      } else {
        distance -= amount
        if (distance < 0) {
          direction = next
          distance = -distance
        }
      }
      if (distance < SWIPE_THRESHOLD) return { handled: true, direction: 0 }
      latched = true
      distance = 0
      return { handled: true, direction }
    },
  }
}

/** A native, non-passive listener so horizontal history navigation can be cancelled. */
export function bindPageSwipe(target: HTMLElement, onSwipe: (direction: SwipeDirection) => void, busy = false) {
  const controller = createPageSwipeController()
  controller.setBusy(busy)
  let timeout: ReturnType<typeof setTimeout> | undefined
  const wheel = (event: WheelEvent) => {
    if (event.defaultPrevented) return
    const result = controller.handle(event, performance.now(), target.clientWidth)
    if (!result.handled) return
    event.preventDefault()
    if (timeout !== undefined) clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = undefined
      controller.reset()
    }, SWIPE_QUIET_MS)
    if (result.direction) onSwipe(result.direction)
  }
  target.addEventListener('wheel', wheel, { passive: false })
  return {
    setBusy: controller.setBusy,
    dispose() {
      target.removeEventListener('wheel', wheel)
      if (timeout !== undefined) clearTimeout(timeout)
      controller.reset()
    },
  }
}
