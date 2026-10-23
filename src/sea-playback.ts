export type SeaPlaybackState = 'loading' | 'playing' | 'paused' | 'blocked' | 'error'

export function manageSeaPlayback(video: HTMLVideoElement, source: string, visibility: Document, motion: MediaQueryList, onState: (state: SeaPlaybackState) => void) {
  let disposed = false, failed = false, revision = 0
  let requested = !motion.matches
  let state: SeaPlaybackState | undefined
  const visible = () => visibility.visibilityState !== 'hidden'
  const shouldPlay = () => requested && visible() && !failed && !disposed
  const report = (next: SeaPlaybackState) => {
    if (disposed || state === next) return
    state = next
    onState(next)
  }
  const suspend = () => {
    revision++
    video.pause()
    if (!failed && state !== 'blocked') report('paused')
  }
  const fail = () => {
    failed = true
    requested = false
    revision++
    video.pause()
    report('error')
  }
  const play = () => {
    if (!shouldPlay()) return
    const current = ++revision
    report('loading')
    const rejected = (error: unknown) => {
      if (disposed || current !== revision || !shouldPlay()) return
      requested = false
      const name = error instanceof Error ? error.name : ''
      if (name === 'NotAllowedError') { video.pause(); report('blocked') }
      else if (name === 'AbortError') { video.pause(); report('paused') }
      else fail()
    }
    try {
      void video.play().then(() => {
        if (disposed) return
        // A delayed start must not revive playback after a pause or hiding.
        if (!shouldPlay()) video.pause()
      }, rejected)
    } catch (error) { rejected(error) }
  }
  const playing = () => {
    if (shouldPlay()) report('playing')
    else suspend()
  }
  const paused = () => { if (video.paused && !failed && state !== 'blocked') report('paused') }
  const waiting = () => { if (shouldPlay()) report('loading') }
  const stalled = () => { if (video.readyState < 3) waiting() }
  const loading = () => { if (shouldPlay()) report('loading'); else paused() }
  const changedVisibility = () => { if (visible()) play(); else suspend() }
  const changedMotion = () => {
    if (!motion.matches) return
    requested = false
    suspend()
    if (!failed) report('paused')
  }
  const events: [string, EventListener][] = [
    ['playing', playing], ['pause', paused], ['waiting', waiting],
    ['stalled', stalled], ['loadstart', loading], ['error', fail],
  ]
  for (const [event, listener] of events) video.addEventListener(event, listener)
  visibility.addEventListener('visibilitychange', changedVisibility)
  motion.addEventListener('change', changedMotion)
  report(shouldPlay() ? 'loading' : 'paused')
  video.src = source
  video.load()
  play()

  return {
    toggle() {
      if (disposed || failed) return
      if (requested && (state === 'playing' || state === 'loading')) {
        requested = false
        suspend()
      } else {
        requested = true
        play()
      }
    },
    retry() {
      if (disposed) return
      revision++
      failed = false
      requested = true
      video.pause()
      report(visible() ? 'loading' : 'paused')
      video.src = source
      video.load()
      play()
    },
    dispose() {
      if (disposed) return
      disposed = true
      requested = false
      revision++
      for (const [event, listener] of events) video.removeEventListener(event, listener)
      visibility.removeEventListener('visibilitychange', changedVisibility)
      motion.removeEventListener('change', changedMotion)
      video.pause()
      video.removeAttribute('src')
      video.load()
    },
  }
}
