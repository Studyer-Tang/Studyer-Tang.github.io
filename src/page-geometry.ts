/** A paper leaf bends along its width while rotating around the book's gutter. */
export type TurnDirection = -1 | 0 | 1
export const TURN_SLICES = 12
export const TURN_DURATION = 1050

export function pageGeometry(progress: number, width: number, direction: -1 | 1) {
  if (!Number.isFinite(progress) || !Number.isFinite(width) || width <= 0) {
    throw new RangeError('A page needs finite progress and a positive width')
  }
  const t = Math.max(0, Math.min(1, progress))
  const eased = t * t * (3 - 2 * t)
  const rotation = -direction * Math.PI * eased
  const bend = direction * 0.72 * Math.sin(Math.PI * eased)
  const step = width / TURN_SLICES
  let leadingX = direction === 1 ? 0 : width
  let leadingZ = 0
  const slices = Array.from({ length: TURN_SLICES }, (_, index) => {
    const angle = bend * (index + 0.5) / TURN_SLICES
    const frontIndex = direction === 1 ? index : TURN_SLICES - index - 1
    const slice = {
      x: leadingX - (direction === -1 ? step : 0), z: leadingZ, angle,
      frontIndex, backIndex: TURN_SLICES - frontIndex - 1,
      shade: 0.2 * Math.abs(Math.sin(rotation + angle)),
    }
    leadingX += direction * step * Math.cos(angle)
    leadingZ -= direction * step * Math.sin(angle)
    return slice
  })
  return { rotation, slices, shadow: Math.sin(Math.PI * eased), sweep: direction * (0.5 - eased) * width }
}
