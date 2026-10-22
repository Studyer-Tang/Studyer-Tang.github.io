export type RouteTransitionDirection = 'forward' | 'backward' | 'neutral'

type NativeTransition = Pick<ViewTransition, 'ready' | 'updateCallbackDone' | 'finished' | 'skipTransition'>
type TransitionEnvironment = {
  start?: (update: () => void) => NativeTransition
  reducedMotion: () => boolean
  commit: (update: () => void) => void
  setDirection: (direction: RouteTransitionDirection | undefined) => void
  onBusyChange: (busy: boolean) => void
}
type PendingTransition = { native?: NativeTransition; committed: boolean }

/** Keep navigation independent of animation, including callbacks from skipped transitions. */
export function createRouteTransitionController(environment: TransitionEnvironment) {
  let active: PendingTransition | undefined
  let disposed = false

  const cancel = () => {
    const previous = active
    active = undefined
    // skipTransition still runs the native update callback; invalidate it first.
    previous?.native?.skipTransition()
    if (previous) environment.setDirection(undefined)
  }
  const settle = (pending: PendingTransition) => {
    if (disposed || active !== pending) return
    active = undefined
    environment.setDirection(undefined)
    environment.onBusyChange(false)
  }

  return {
    transition(update: () => void, direction: RouteTransitionDirection) {
      if (disposed) return
      cancel()
      if (!environment.start || environment.reducedMotion()) {
        environment.onBusyChange(false)
        environment.commit(update)
        return
      }

      const pending: PendingTransition = { committed: false }
      active = pending
      environment.setDirection(direction)
      environment.onBusyChange(true)
      const commit = () => {
        if (disposed || active !== pending || pending.committed) return
        pending.committed = true
        environment.commit(update)
      }

      try {
        const native = environment.start(commit)
        pending.native = native
        // Skipping an animation can reject ready; an update failure can reject all three.
        void native.ready.catch(() => {})
        void native.updateCallbackDone.catch(() => {})
        void native.finished.then(() => settle(pending), () => settle(pending))
        if (disposed || active !== pending) native.skipTransition()
      } catch (error) {
        if (active !== pending || disposed) return
        try {
          // A browser API failure must not lose navigation or call the update twice.
          if (pending.committed) throw error
          commit()
        } finally {
          settle(pending)
        }
      }
    },
    dispose() {
      disposed = true
      cancel()
    },
  }
}
