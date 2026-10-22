import test from 'node:test'
import assert from 'node:assert/strict'
import { createRouteTransitionController } from '../src/route-transition.ts'
import type { RouteTransitionDirection } from '../src/route-transition.ts'

function deferred() {
  let resolve!: () => void
  let reject!: (reason: Error) => void
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

function nativeTransition(update: () => void) {
  const ready = deferred(), done = deferred(), finished = deferred()
  let skipped = 0
  return {
    handle: {
      ready: ready.promise,
      updateCallbackDone: done.promise,
      finished: finished.promise,
      skipTransition() { skipped++; ready.reject(new Error('animation skipped')) },
    },
    get skipped() { return skipped },
    update() {
      try {
        update()
        done.resolve()
        ready.resolve()
      } catch (error) {
        const failure = error instanceof Error ? error : new Error(String(error))
        done.reject(failure)
        ready.reject(failure)
        finished.reject(failure)
      }
    },
    finish: finished.resolve,
    fail() {
      const error = new Error('native transition failed')
      ready.reject(error)
      done.reject(error)
      finished.reject(error)
    },
  }
}

function harness(supported = true) {
  const native: ReturnType<typeof nativeTransition>[] = []
  const busyEvents: boolean[] = []
  let reduced = false
  let direction: RouteTransitionDirection | undefined
  const controller = createRouteTransitionController({
    start: supported ? update => {
      const transition = nativeTransition(update)
      native.push(transition)
      return transition.handle
    } : undefined,
    reducedMotion: () => reduced,
    commit: update => update(),
    setDirection: value => { direction = value },
    onBusyChange: value => busyEvents.push(value),
  })
  return {
    controller, native, busyEvents,
    setReduced(value: boolean) { reduced = value },
    get busy() { return busyEvents.at(-1) ?? false },
    get direction() { return direction },
  }
}

const tick = () => new Promise(resolve => setImmediate(resolve))

test('unsupported browsers commit immediately without an animation or direction attribute', () => {
  const h = harness(false)
  let route = 'home'
  h.controller.transition(() => { route = 'research' }, 'forward')
  assert.equal(route, 'research')
  assert.equal(h.native.length, 0)
  assert.equal(h.direction, undefined)
  assert.equal(h.busy, false)
})

test('the current reduced-motion preference is checked on each navigation', async () => {
  const h = harness()
  let route = 'home'
  h.setReduced(true)
  h.controller.transition(() => { route = 'research' }, 'forward')
  assert.equal(route, 'research')
  assert.equal(h.native.length, 0)
  h.setReduced(false)
  h.controller.transition(() => { route = 'reading' }, 'forward')
  assert.equal(h.native.length, 1)
  assert.equal(route, 'research')
  h.native[0].update()
  h.native[0].finish()
  await tick()
  assert.equal(route, 'reading')
  assert.equal(h.busy, false)
})

test('native transitions commit in the snapshot callback and remain busy until finished', async () => {
  const h = harness()
  let route = 'home'
  h.controller.transition(() => { route = 'research' }, 'forward')
  assert.equal(h.direction, 'forward')
  assert.equal(h.busy, true)
  assert.equal(route, 'home')
  h.native[0].update()
  await tick()
  assert.equal(route, 'research')
  assert.equal(h.busy, true)
  h.native[0].finish()
  await tick()
  assert.equal(h.busy, false)
  assert.equal(h.direction, undefined)
})

test('a skipped native animation still commits its active route after ready rejects', async () => {
  const h = harness()
  let route = 'home'
  h.controller.transition(() => { route = 'research' }, 'forward')
  h.native[0].handle.skipTransition()
  await tick()
  assert.equal(route, 'home')
  assert.equal(h.busy, true, 'ready rejection must not discard the pending update')
  h.native[0].update()
  h.native[0].finish()
  await tick()
  assert.equal(route, 'research')
  assert.equal(h.busy, false)
})

test('a quick click skips the previous snapshot and its delayed update cannot overwrite the latest route', async () => {
  const h = harness()
  const commits: string[] = []
  h.controller.transition(() => commits.push('research'), 'forward')
  h.controller.transition(() => commits.push('home'), 'backward')
  assert.equal(h.native[0].skipped, 1)
  h.native[1].update()
  h.native[0].update()
  h.native[0].finish()
  await tick()
  assert.deepEqual(commits, ['home'])
  assert.equal(h.direction, 'backward', 'old completion must not erase the new direction')
  assert.equal(h.busy, true)
  h.native[1].finish()
  await tick()
  assert.equal(h.busy, false)
})

test('a transition can be interrupted after its route has already committed', async () => {
  const h = harness()
  const commits: string[] = []
  h.controller.transition(() => commits.push('research'), 'forward')
  h.native[0].update()
  h.controller.transition(() => commits.push('reading'), 'forward')
  assert.equal(h.native[0].skipped, 1)
  h.native[0].finish()
  h.native[1].update()
  h.native[1].finish()
  await tick()
  assert.deepEqual(commits, ['research', 'reading'])
  assert.equal(h.busy, false)
})

test('switching to reduced motion interrupts an older animation and commits immediately', async () => {
  const h = harness()
  const commits: string[] = []
  h.controller.transition(() => commits.push('research'), 'forward')
  h.setReduced(true)
  h.controller.transition(() => commits.push('reading'), 'forward')
  assert.deepEqual(commits, ['reading'])
  assert.equal(h.native.length, 1)
  assert.equal(h.native[0].skipped, 1)
  assert.equal(h.direction, undefined)
  assert.equal(h.busy, false)
  h.native[0].update()
  h.native[0].finish()
  await tick()
  assert.deepEqual(commits, ['reading'])
})

test('native promise rejections release busy state without unhandled rejections', async () => {
  const h = harness()
  h.controller.transition(() => {}, 'neutral')
  h.native[0].fail()
  await tick()
  assert.equal(h.busy, false)
  assert.equal(h.direction, undefined)
})

test('a thrown native API falls back once, including a callback that arrives after the failure', () => {
  let delayedUpdate: (() => void) | undefined
  let commits = 0, busy = false
  let direction: RouteTransitionDirection | undefined
  const controller = createRouteTransitionController({
    start: update => { delayedUpdate = update; throw new Error('API unavailable') },
    reducedMotion: () => false,
    commit: update => update(),
    setDirection: value => { direction = value },
    onBusyChange: value => { busy = value },
  })
  controller.transition(() => { commits++ }, 'forward')
  delayedUpdate?.()
  assert.equal(commits, 1)
  assert.equal(busy, false)
  assert.equal(direction, undefined)
})

test('a synchronous application error is propagated without retrying its update', () => {
  let commits = 0, busy = false
  const controller = createRouteTransitionController({
    start: update => { update(); throw new Error('unreachable') },
    reducedMotion: () => false,
    commit: update => update(),
    setDirection: () => {},
    onBusyChange: value => { busy = value },
  })
  assert.throws(() => controller.transition(() => { commits++; throw new Error('application failure') }, 'neutral'), /application failure/)
  assert.equal(commits, 1)
  assert.equal(busy, false)
})

test('an asynchronous update error is not retried and its native rejections are consumed', async () => {
  const h = harness()
  let commits = 0
  h.controller.transition(() => { commits++; throw new Error('application failure') }, 'neutral')
  h.native[0].update()
  await tick()
  assert.equal(commits, 1)
  assert.equal(h.busy, false)
})

test('unmount cancels pending work and prevents late callbacks or state notifications', async () => {
  const h = harness()
  let commits = 0
  h.controller.transition(() => { commits++ }, 'forward')
  h.controller.dispose()
  const previousNotifications = [...h.busyEvents]
  assert.equal(h.native[0].skipped, 1)
  assert.equal(h.direction, undefined)
  h.native[0].update()
  h.native[0].finish()
  h.controller.transition(() => { commits++ }, 'backward')
  await tick()
  assert.equal(commits, 0)
  assert.deepEqual(h.busyEvents, previousNotifications)
})
