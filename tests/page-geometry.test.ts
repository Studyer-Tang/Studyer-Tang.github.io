import test from 'node:test'
import assert from 'node:assert/strict'
import { pageGeometry, TURN_SLICES } from '../src/page-geometry.ts'

const width = 420
const step = width / TURN_SLICES
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)
const shapeAt = (progress: number, direction: -1 | 1) => pageGeometry(progress, width, direction)
function worldPoint(x: number, z: number, rotation: number, direction: -1 | 1) {
  const local = x - (direction === -1 ? width : 0)
  return [width + local * Math.cos(rotation) + z * Math.sin(rotation), -local * Math.sin(rotation) + z * Math.cos(rotation)]
}

test('the sheet starts on the old page and ends on the correct, readable reverse page', () => {
  for (const direction of [-1, 1] as const) {
    for (const progress of [0, 1]) {
      const shape = shapeAt(progress, direction)
      shape.slices.forEach(slice => {
        near(slice.angle, 0)
        const center = worldPoint(slice.x + step / 2, slice.z, shape.rotation, direction)
        const index = progress === 0 ? slice.frontIndex : slice.backIndex
        const side = progress === 0 ? (direction === 1 ? width : 0) : (direction === 1 ? 0 : width)
        near(center[0], side + (index + 0.5) * step)
        near(center[1], 0)
      })
    }
  }
})

test('curved strips stay connected and conserve paper length throughout both turns', () => {
  for (const direction of [-1, 1] as const) for (let frame = 0; frame <= 100; frame++) {
    const shape = shapeAt(frame / 100, direction)
    let length = 0
    shape.slices.forEach((slice, index) => {
      const leadingX = slice.x + (direction === -1 ? step : 0)
      const trailing = [leadingX + direction * step * Math.cos(slice.angle), slice.z - direction * step * Math.sin(slice.angle)]
      length += Math.hypot(trailing[0] - leadingX, trailing[1] - slice.z)
      const next = shape.slices[index + 1]
      if (next) {
        near(trailing[0], next.x + (direction === -1 ? step : 0))
        near(trailing[1], next.z)
      }
    })
    near(length, width)
  }
})

test('forward and backward leaves mirror around the gutter and lift toward the viewer', () => {
  for (const progress of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const forward = shapeAt(progress, 1), backward = shapeAt(progress, -1)
    forward.slices.forEach((slice, index) => {
      const other = backward.slices[index]
      const a = worldPoint(slice.x, slice.z, forward.rotation, 1)
      const b = worldPoint(other.x + step, other.z, backward.rotation, -1)
      near(a[0] + b[0], 2 * width)
      near(a[1], b[1])
      assert.ok(a[1] >= -1e-8)
    })
  }
})

test('small frame overshoots settle on the endpoints and invalid dimensions are rejected', () => {
  assert.deepEqual(shapeAt(-0.01, 1), shapeAt(0, 1))
  assert.deepEqual(shapeAt(1.01, 1), shapeAt(1, 1))
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.throws(() => pageGeometry(invalid, width, 1), RangeError)
    assert.throws(() => pageGeometry(0.5, invalid, 1), RangeError)
  }
  for (const invalid of [0, -1]) assert.throws(() => pageGeometry(0.5, invalid, 1), RangeError)
})
