import test from 'node:test'
import assert from 'node:assert/strict'
import { bindPageSwipe, createPageSwipeController, SWIPE_QUIET_MS } from '../src/page-swipe.ts'

const wheel = (deltaX: number, deltaY = 0) => ({ deltaX, deltaY })

test('small horizontal deltas accumulate into exactly one page turn', () => {
  for (const direction of [-1, 1] as const) {
    const swipe = createPageSwipeController()
    for (let i = 0; i < 3; i++) assert.deepEqual(swipe.handle(wheel(20 * direction), i * 16), { handled: true, direction: 0 })
    assert.deepEqual(swipe.handle(wheel(20 * direction), 48), { handled: true, direction })
    for (let i = 4; i < 30; i++) assert.equal(swipe.handle(wheel(10 * direction), i * 16).direction, 0)
  }
})

test('vertical scrolling, diagonal scrolling and modified pinch events remain available', () => {
  const swipe = createPageSwipeController()
  for (const event of [wheel(0, 200), wheel(15, 40), wheel(50, 40), { ...wheel(200), ctrlKey: true }, { ...wheel(-200), metaKey: true }]) {
    assert.deepEqual(swipe.handle(event, 0), { handled: false, direction: 0 })
  }
  assert.equal(swipe.handle(wheel(40), 10).direction, 0)
  swipe.handle({ ...wheel(200), ctrlKey: true }, 20)
  assert.equal(swipe.handle(wheel(40), 30).direction, 0, 'pinch must discard earlier partial swipe')
})

test('line and page delta modes normalize to pixels before accumulation', () => {
  const lines = createPageSwipeController()
  assert.equal(lines.handle({ ...wheel(-2), deltaMode: 1 }, 0).direction, 0)
  assert.equal(lines.handle({ ...wheel(-2), deltaMode: 1 }, 10).direction, -1)
  const pages = createPageSwipeController()
  assert.equal(pages.handle({ ...wheel(0.12), deltaMode: 2 }, 0, 500).direction, 0)
  assert.equal(pages.handle({ ...wheel(0.02), deltaMode: 2 }, 10, 500).direction, 1)
  const pixels = createPageSwipeController()
  assert.equal(pixels.handle(wheel(4), 0, 500).direction, 0)
})

test('a quiet interval separates gestures without counting vertical noise as horizontal input', () => {
  const swipe = createPageSwipeController()
  assert.equal(swipe.handle(wheel(80), 0).direction, 1)
  assert.equal(swipe.handle(wheel(80), 100).direction, 0)
  swipe.handle(wheel(0, 100), 200)
  assert.equal(swipe.handle(wheel(80), 100 + SWIPE_QUIET_MS).direction, 1)
})

test('a deliberate reversal can turn back without a pause, while small counter-motion cannot', () => {
  const swipe = createPageSwipeController()
  assert.equal(swipe.handle(wheel(80), 0).direction, 1)
  assert.equal(swipe.handle(wheel(-8), 16).direction, 0)
  assert.equal(swipe.handle(wheel(-14), 32).direction, 0)
  assert.equal(swipe.handle(wheel(8), 48).direction, 0)
  assert.equal(swipe.handle(wheel(-30), 64).direction, 0)
  assert.equal(swipe.handle(wheel(-40), 80).direction, -1)
  assert.equal(swipe.handle(wheel(-120), 96).direction, 0)
})

test('counter-motion subtracts from a partial swipe instead of contributing to a turn', () => {
  const swipe = createPageSwipeController()
  assert.equal(swipe.handle(wheel(40), 0).direction, 0)
  assert.equal(swipe.handle(wheel(-30), 16).direction, 0)
  assert.equal(swipe.handle(wheel(40), 32).direction, 0)
  assert.equal(swipe.handle(wheel(20), 48).direction, 1)
})

test('busy time discards partial input and consumes its momentum after the animation settles', () => {
  const swipe = createPageSwipeController()
  assert.equal(swipe.handle(wheel(40), 0).direction, 0)
  swipe.setBusy(true)
  assert.deepEqual(swipe.handle(wheel(100), 16), { handled: true, direction: 0 })
  swipe.setBusy(false)
  assert.equal(swipe.handle(wheel(100), 32).direction, 0)
  assert.equal(swipe.handle(wheel(100), 32 + SWIPE_QUIET_MS).direction, 1)
})

test('a gesture started while busy cannot accumulate a delayed turn', () => {
  const swipe = createPageSwipeController()
  swipe.setBusy(true)
  assert.equal(swipe.handle(wheel(-100), 0).direction, 0)
  swipe.setBusy(false)
  assert.equal(swipe.handle(wheel(-100), 16).direction, 0)
  assert.equal(swipe.handle(wheel(80), 32).direction, 1, 'an explicit new direction remains usable')
})

test('reset clears a latch, and invalid or zero input cannot trigger a page', () => {
  const swipe = createPageSwipeController()
  assert.equal(swipe.handle(wheel(80), 0).direction, 1)
  swipe.reset()
  assert.equal(swipe.handle(wheel(80), 16).direction, 1)
  for (const event of [wheel(0), wheel(NaN), wheel(Infinity), wheel(80, NaN)]) {
    assert.deepEqual(swipe.handle(event, 32), { handled: false, direction: 0 })
  }
})

function bookTarget() {
  return Object.assign(new EventTarget(), { clientWidth: 500 }) as unknown as HTMLElement
}
function dispatch(target: HTMLElement, deltaX: number, deltaY = 0, modifiers = {}) {
  const event = Object.assign(new Event('wheel', { cancelable: true }), wheel(deltaX, deltaY), modifiers)
  target.dispatchEvent(event)
  return event
}

test('the native binding cancels only horizontal input inside the book and removes its listener', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const book = bookTarget(), outside = bookTarget(), turns: number[] = []
  const binding = bindPageSwipe(book, direction => turns.push(direction))
  assert.equal(dispatch(outside, 100).defaultPrevented, false)
  assert.equal(dispatch(book, 10, 100).defaultPrevented, false)
  assert.equal(dispatch(book, 100, 0, { ctrlKey: true }).defaultPrevented, false)
  assert.equal(dispatch(book, 100).defaultPrevented, true)
  assert.deepEqual(turns, [1])
  binding.dispose()
  assert.equal(dispatch(book, -100).defaultPrevented, false)
  t.mock.timers.tick(SWIPE_QUIET_MS)
  assert.deepEqual(turns, [1])
})

test('native idle timeout releases momentum, and cleanup plus rebind starts a fresh gesture', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const book = bookTarget(), turns: number[] = []
  const first = bindPageSwipe(book, direction => turns.push(direction))
  dispatch(book, 100)
  dispatch(book, 100)
  assert.deepEqual(turns, [1])
  t.mock.timers.tick(SWIPE_QUIET_MS)
  dispatch(book, 100)
  assert.deepEqual(turns, [1, 1])
  first.dispose()
  const second = bindPageSwipe(book, direction => turns.push(direction))
  dispatch(book, 40)
  assert.deepEqual(turns, [1, 1], 'strict-mode remount must not retain a partial gesture or duplicate listeners')
  dispatch(book, 30)
  assert.deepEqual(turns, [1, 1, 1])
  second.dispose()
})

test('the native binding updates busy state without losing momentum suppression', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const book = bookTarget(), turns: number[] = []
  const binding = bindPageSwipe(book, direction => turns.push(direction))
  dispatch(book, 40)
  binding.setBusy(true)
  dispatch(book, 100)
  binding.setBusy(false)
  dispatch(book, 100)
  assert.deepEqual(turns, [])
  t.mock.timers.tick(SWIPE_QUIET_MS)
  dispatch(book, -100)
  assert.deepEqual(turns, [-1])
  binding.dispose()
})
