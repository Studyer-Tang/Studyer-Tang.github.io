import test from 'node:test'
import assert from 'node:assert/strict'
import { manageSeaPlayback } from '../src/sea-playback.ts'
import type { SeaPlaybackState } from '../src/sea-playback.ts'

function deferred() {
  let resolve!: () => void, reject!: (reason: Error) => void
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

class Video extends EventTarget {
  src = ''
  paused = true
  readyState = 0
  loads = 0
  pauses = 0
  plays: ReturnType<typeof deferred>[] = []
  play() {
    const attempt = deferred()
    this.plays.push(attempt)
    return attempt.promise
  }
  pause() {
    this.pauses++
    if (!this.paused) { this.paused = true; this.dispatchEvent(new Event('pause')) }
  }
  load() { this.loads++; this.readyState = 0; this.dispatchEvent(new Event('loadstart')) }
  removeAttribute(name: string) { if (name === 'src') this.src = '' }
  start(index = this.plays.length - 1) {
    this.paused = false
    this.readyState = 4
    this.dispatchEvent(new Event('playing'))
    this.plays[index].resolve()
  }
}

class Visibility extends EventTarget {
  visibilityState: 'visible' | 'hidden' = 'visible'
  set(value: 'visible' | 'hidden') { this.visibilityState = value; this.dispatchEvent(new Event('visibilitychange')) }
}
class Motion extends EventTarget {
  matches = false
  set(value: boolean) { this.matches = value; this.dispatchEvent(new Event('change')) }
}

function harness({ reduced = false, hidden = false } = {}) {
  const video = new Video(), visibility = new Visibility(), motion = new Motion()
  visibility.visibilityState = hidden ? 'hidden' : 'visible'
  motion.matches = reduced
  const states: SeaPlaybackState[] = []
  const control = manageSeaPlayback(video as unknown as HTMLVideoElement, '/sea.mp4', visibility as unknown as Document, motion as unknown as MediaQueryList, state => states.push(state))
  return { video, visibility, motion, control, states, get state() { return states.at(-1) } }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('the displayed playing state waits for actual playback, with buffering distinct from failure', () => {
  const h = harness()
  assert.equal(h.video.src, '/sea.mp4')
  assert.equal(h.state, 'loading')
  assert.equal(h.video.plays.length, 1)
  h.video.start()
  assert.equal(h.state, 'playing')
  h.video.dispatchEvent(new Event('stalled'))
  assert.equal(h.state, 'playing', 'a network stall with buffered frames is not a playback stall')
  h.video.dispatchEvent(new Event('waiting'))
  assert.equal(h.state, 'loading')
  h.video.start()
  assert.equal(h.state, 'playing')
  h.control.dispose()
})

test('hiding suspends video and returning resumes only the previously requested playback', async () => {
  const h = harness()
  h.video.start()
  h.visibility.set('hidden')
  assert.equal(h.video.paused, true)
  assert.equal(h.state, 'paused')
  h.visibility.set('visible')
  assert.equal(h.video.plays.length, 2)
  h.video.start()
  h.control.toggle()
  assert.equal(h.state, 'paused')
  h.visibility.set('hidden')
  h.visibility.set('visible')
  assert.equal(h.video.plays.length, 2, 'manual pause survives a background/foreground cycle')
  await tick()
  assert.equal(h.video.paused, true)
  h.control.dispose()
})

test('initially hidden video defers its first play until visible', () => {
  const h = harness({ hidden: true })
  assert.equal(h.state, 'paused')
  assert.equal(h.video.plays.length, 0)
  h.visibility.set('visible')
  assert.equal(h.video.plays.length, 1)
  h.control.dispose()
})

test('reduced motion starts still and only an explicit action enables playback', () => {
  const h = harness({ reduced: true })
  assert.equal(h.state, 'paused')
  assert.equal(h.video.plays.length, 0)
  h.motion.set(false)
  assert.equal(h.video.plays.length, 0)
  h.control.toggle()
  h.video.start()
  assert.equal(h.state, 'playing')
  h.motion.set(true)
  assert.equal(h.video.paused, true)
  h.visibility.set('hidden')
  h.motion.set(false)
  h.visibility.set('visible')
  assert.equal(h.video.plays.length, 1, 'removing reduced motion does not cancel a deliberate stop')
  h.control.dispose()
})

test('blocked autoplay offers a direct retry through the play action without reloading the file', async () => {
  const h = harness()
  h.video.plays[0].reject(new DOMException('gesture required', 'NotAllowedError'))
  await tick()
  assert.equal(h.state, 'blocked')
  h.visibility.set('hidden')
  h.visibility.set('visible')
  assert.equal(h.video.plays.length, 1)
  h.control.toggle()
  assert.equal(h.video.plays.length, 2)
  assert.equal(h.video.loads, 1)
  h.video.start()
  assert.equal(h.state, 'playing')
  h.control.dispose()
})

test('an old rejected play cannot overwrite the current playback after hiding and resuming', async () => {
  const h = harness()
  h.visibility.set('hidden')
  h.visibility.set('visible')
  h.video.start(1)
  h.video.plays[0].reject(new DOMException('old load aborted', 'AbortError'))
  await tick()
  assert.equal(h.state, 'playing')
  assert.equal(h.video.paused, false)
  h.control.dispose()
})

test('late play completion after a manual pause cannot revive the video', async () => {
  const h = harness()
  h.control.toggle()
  h.video.start(0)
  await tick()
  assert.equal(h.video.paused, true)
  assert.equal(h.state, 'paused')
  h.control.dispose()
})

test('a current AbortError leaves a usable paused state rather than a broken media error', async () => {
  const h = harness()
  h.video.plays[0].reject(new DOMException('interrupted', 'AbortError'))
  await tick()
  assert.equal(h.state, 'paused')
  h.control.toggle()
  assert.equal(h.video.plays.length, 2)
  h.control.dispose()
})

test('a media failure remains an error while hidden and explicit retry resets and reloads it', async () => {
  const h = harness()
  h.video.dispatchEvent(new Event('error'))
  assert.equal(h.state, 'error')
  h.visibility.set('hidden')
  h.visibility.set('visible')
  assert.equal(h.state, 'error')
  assert.equal(h.video.plays.length, 1)
  h.control.retry()
  assert.equal(h.video.loads, 2)
  assert.equal(h.video.plays.length, 2)
  h.video.start(1)
  h.video.plays[0].reject(new DOMException('old attempt', 'NotSupportedError'))
  await tick()
  assert.equal(h.state, 'playing')
  h.control.dispose()
})

test('disposal releases the source, ignores late promises/events and is idempotent', async () => {
  const h = harness()
  h.control.dispose()
  const states = [...h.states], loads = h.video.loads, attempts = h.video.plays.length
  assert.equal(h.video.src, '')
  assert.equal(h.video.paused, true)
  assert.equal(loads, 2)
  h.visibility.set('hidden')
  h.visibility.set('visible')
  h.motion.set(true)
  h.video.dispatchEvent(new Event('error'))
  h.video.dispatchEvent(new Event('playing'))
  h.video.plays[0].reject(new DOMException('unmounted', 'AbortError'))
  h.control.toggle()
  h.control.retry()
  h.control.dispose()
  await tick()
  assert.deepEqual(h.states, states)
  assert.equal(h.video.loads, loads)
  assert.equal(h.video.plays.length, attempts)
})

test('a disposed controller cannot pause a new controller reusing the same video element', async () => {
  const h = harness()
  h.control.dispose()
  const oldStates = [...h.states], states: SeaPlaybackState[] = []
  const replacement = manageSeaPlayback(h.video as unknown as HTMLVideoElement, '/sea.mp4', h.visibility as unknown as Document, h.motion as unknown as MediaQueryList, state => states.push(state))
  h.video.start(1)
  h.video.plays[0].resolve()
  await tick()
  assert.equal(h.video.paused, false, 'late completion belongs to the disposed effect, not the new player')
  assert.equal(states.at(-1), 'playing')
  assert.deepEqual(h.states, oldStates)
  replacement.dispose()
})
