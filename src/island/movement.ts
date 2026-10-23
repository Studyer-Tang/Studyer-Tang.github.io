import { DOCK_BRIDGE, DOCK_HEIGHT, DOCK_PLATFORM, DOCK_RAMP, ISLAND_BOUNDS, islandRadiusAt, LAKE_BRIDGE, LAKE_BRIDGE_HEIGHT, LAKE_PAVILION, LAKE_PAVILION_RAMP, LAKE_RADII, lakeBridgeHeight, lakeRadiusAt, PALACE_STAIRS, PALACE_TERRACE, PALACE_TERRACE_HEIGHT, terrainHeight } from './layout.ts'
import type { Rect2 } from './layout.ts'

export { islandRadiusAt, terrainHeight } from './layout.ts'

export type Point2 = { x: number; z: number }
export type CircleObstacle = Point2 & { radius: number }

const WALKABLE_RADIUS = 0.94
// A conservative bound on |gradient(q)| for this ellipse and angular coast.
// Insetting q by this amount keeps the entire character disc on dry land.
const RADIUS_GRADIENT_BOUND = 0.023
const MAX_SUBSTEP = 0.2
const MAX_FRAME_DISTANCE = 200
const EPSILON = 1e-6

const finitePoint = (point: Point2) => Number.isFinite(point.x) && Number.isFinite(point.z)
const length = (point: Point2) => Math.hypot(point.x, point.z)
const add = (a: Point2, b: Point2): Point2 => ({ x: a.x + b.x, z: a.z + b.z })
const scale = (point: Point2, factor: number): Point2 => ({ x: point.x * factor, z: point.z * factor })

function normalizedRadius(point: Point2): number {
  return length(point) / islandRadiusAt(Math.atan2(point.z, point.x))
}

function contains(rect: Rect2, point: Point2): boolean {
  return point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ
}

/** Height of the actual traversable surface, including the ramps and raised decks. */
export function walkSurfaceHeight(x: number, z: number): number {
  const point = { x, z }
  if (contains(LAKE_PAVILION, point)) return LAKE_BRIDGE_HEIGHT
  if (contains(LAKE_BRIDGE, point)) return lakeBridgeHeight(x, z)
  if (contains(LAKE_PAVILION_RAMP, point)) {
    const t = (LAKE_PAVILION_RAMP.maxX - x) / (LAKE_PAVILION_RAMP.maxX - LAKE_PAVILION_RAMP.minX)
    const smooth = t * t * (3 - 2 * t)
    const ground = terrainHeight(LAKE_PAVILION_RAMP.maxX, z)
    return ground + (LAKE_BRIDGE_HEIGHT - ground) * smooth
  }
  if (contains(PALACE_TERRACE, point)) return PALACE_TERRACE_HEIGHT
  if (contains(PALACE_STAIRS, point)) {
    const t = (PALACE_STAIRS.maxZ - z) / (PALACE_STAIRS.maxZ - PALACE_STAIRS.minZ)
    const ground = terrainHeight(x, PALACE_STAIRS.maxZ)
    return ground + (PALACE_TERRACE_HEIGHT - ground) * t
  }
  if (contains(DOCK_BRIDGE, point) || contains(DOCK_PLATFORM, point)) {
    const t = Math.max(0, Math.min(1, (x - DOCK_RAMP.minX) / (DOCK_RAMP.maxX - DOCK_RAMP.minX)))
    const smooth = t * t * (3 - 2 * t)
    const ground = terrainHeight(x, z)
    return ground + (DOCK_HEIGHT - ground) * smooth
  }
  return terrainHeight(x, z)
}

function rectClearance(rect: Rect2, point: Point2): number {
  if (contains(rect, point)) return Math.min(point.x - rect.minX, rect.maxX - point.x, point.z - rect.minZ, rect.maxZ - point.z)
  return -Math.hypot(Math.max(rect.minX - point.x, 0, point.x - rect.maxX), Math.max(rect.minZ - point.z, 0, point.z - rect.maxZ))
}

// Each term is a conservative clearance for a whole circular body. Overlapping
// regions provide wide, continuous land/deck and bridge/platform connections.
function surfaceClearance(point: Point2, radius: number): number {
  const coast = Math.max((WALKABLE_RADIUS - normalizedRadius(point)) / RADIUS_GRADIENT_BOUND,
    rectClearance(DOCK_BRIDGE, point), rectClearance(DOCK_PLATFORM, point))
  // |gradient(lakeQ)| <= 1/min(radius), so this is a conservative
  // clearance of the complete body from the real elliptical waterline.
  const lake = Math.max((lakeRadiusAt(point.x, point.z) - 1) * Math.min(LAKE_RADII.x, LAKE_RADII.z),
    rectClearance(LAKE_BRIDGE, point), rectClearance(LAKE_PAVILION, point), rectClearance(LAKE_PAVILION_RAMP, point))
  return Math.min(coast, lake) - radius
}

type Wall = { a: Point2; b: Point2 }
const WALL_RADIUS = 0.02
const wall = (x1: number, z1: number, x2: number, z2: number): Wall => ({ a: { x: x1, z: z1 }, b: { x: x2, z: z2 } })
// The palace has one approach: the south ramp. Deck side rails prevent entering
// its raised section laterally from the overlapping dry land.
const walls: readonly Wall[] = [
  wall(PALACE_TERRACE.minX, PALACE_TERRACE.minZ, PALACE_TERRACE.maxX, PALACE_TERRACE.minZ),
  wall(PALACE_TERRACE.minX, PALACE_TERRACE.minZ, PALACE_TERRACE.minX, PALACE_TERRACE.maxZ),
  wall(PALACE_TERRACE.maxX, PALACE_TERRACE.minZ, PALACE_TERRACE.maxX, PALACE_TERRACE.maxZ),
  wall(PALACE_TERRACE.minX, PALACE_TERRACE.maxZ, PALACE_STAIRS.minX, PALACE_TERRACE.maxZ),
  wall(PALACE_STAIRS.maxX, PALACE_TERRACE.maxZ, PALACE_TERRACE.maxX, PALACE_TERRACE.maxZ),
  wall(PALACE_STAIRS.minX, PALACE_STAIRS.minZ, PALACE_STAIRS.minX, PALACE_STAIRS.maxZ),
  wall(PALACE_STAIRS.maxX, PALACE_STAIRS.minZ, PALACE_STAIRS.maxX, PALACE_STAIRS.maxZ),
  wall(DOCK_BRIDGE.minX, DOCK_BRIDGE.minZ, DOCK_PLATFORM.minX, DOCK_BRIDGE.minZ),
  wall(DOCK_BRIDGE.minX, DOCK_BRIDGE.maxZ, DOCK_PLATFORM.minX, DOCK_BRIDGE.maxZ),
  wall(DOCK_PLATFORM.minX, DOCK_PLATFORM.minZ, DOCK_PLATFORM.maxX, DOCK_PLATFORM.minZ),
  wall(DOCK_PLATFORM.minX, DOCK_PLATFORM.maxZ, DOCK_PLATFORM.maxX, DOCK_PLATFORM.maxZ),
  wall(DOCK_PLATFORM.maxX, DOCK_PLATFORM.minZ, DOCK_PLATFORM.maxX, DOCK_PLATFORM.maxZ),
  wall(DOCK_PLATFORM.minX, DOCK_PLATFORM.minZ, DOCK_PLATFORM.minX, DOCK_BRIDGE.minZ),
  wall(DOCK_PLATFORM.minX, DOCK_BRIDGE.maxZ, DOCK_PLATFORM.minX, DOCK_PLATFORM.maxZ),
  wall(LAKE_BRIDGE.minX, LAKE_BRIDGE.minZ, LAKE_PAVILION.minX, LAKE_BRIDGE.minZ),
  wall(LAKE_BRIDGE.minX, LAKE_BRIDGE.maxZ, LAKE_PAVILION.minX, LAKE_BRIDGE.maxZ),
  wall(LAKE_PAVILION.minX, LAKE_PAVILION.minZ, LAKE_PAVILION.maxX, LAKE_PAVILION.minZ),
  wall(LAKE_PAVILION.minX, LAKE_PAVILION.maxZ, LAKE_PAVILION.maxX, LAKE_PAVILION.maxZ),
  wall(LAKE_PAVILION.minX, LAKE_PAVILION.minZ, LAKE_PAVILION.minX, LAKE_BRIDGE.minZ),
  wall(LAKE_PAVILION.minX, LAKE_BRIDGE.maxZ, LAKE_PAVILION.minX, LAKE_PAVILION.maxZ),
  wall(LAKE_PAVILION.maxX, LAKE_PAVILION.minZ, LAKE_PAVILION.maxX, LAKE_PAVILION_RAMP.minZ),
  wall(LAKE_PAVILION.maxX, LAKE_PAVILION_RAMP.maxZ, LAKE_PAVILION.maxX, LAKE_PAVILION.maxZ),
  wall(LAKE_PAVILION_RAMP.minX, LAKE_PAVILION_RAMP.minZ, LAKE_PAVILION_RAMP.maxX, LAKE_PAVILION_RAMP.minZ),
  wall(LAKE_PAVILION_RAMP.minX, LAKE_PAVILION_RAMP.maxZ, LAKE_PAVILION_RAMP.maxX, LAKE_PAVILION_RAMP.maxZ),
]

function wallDistanceSquared(point: Point2, segment: Wall): number {
  const x = Math.max(Math.min(segment.a.x, segment.b.x), Math.min(point.x, Math.max(segment.a.x, segment.b.x)))
  const z = Math.max(Math.min(segment.a.z, segment.b.z), Math.min(point.z, Math.max(segment.a.z, segment.b.z)))
  return (point.x - x) ** 2 + (point.z - z) ** 2
}

/** Union of dry land and the real dock, including body clearance and raised-edge barriers. */
export function isWalkable(point: Point2, radius = 0.45): boolean {
  return finitePoint(point) && Number.isFinite(radius) && radius >= 0
    && surfaceClearance(point, radius) >= -1e-10
    && walls.every(segment => wallDistanceSquared(point, segment) >= (radius + WALL_RADIUS) ** 2 - 1e-10)
}

function validObstacles(obstacles: readonly CircleObstacle[]): CircleObstacle[] {
  return obstacles.filter(obstacle => finitePoint(obstacle) && Number.isFinite(obstacle.radius) && obstacle.radius >= 0)
}

function isFree(point: Point2, obstacles: readonly CircleObstacle[], radius: number): boolean {
  return isWalkable(point, radius) && obstacles.every(obstacle =>
    Math.hypot(point.x - obstacle.x, point.z - obstacle.z) >= obstacle.radius + radius - EPSILON / 10)
}

type Contact = { time: number; normal: Point2; coast: boolean }

function firstContact(position: Point2, delta: Point2, obstacles: readonly CircleObstacle[], radius: number): Contact | null {
  const distanceSquared = delta.x ** 2 + delta.z ** 2
  let contact: Contact | null = null
  const circleContact = (obstacle: CircleObstacle) => {
    const offset = { x: position.x - obstacle.x, z: position.z - obstacle.z }
    const expanded = obstacle.radius + radius
    const projection = offset.x * delta.x + offset.z * delta.z
    if (projection >= 0) return
    const discriminant = projection ** 2 - distanceSquared * (length(offset) ** 2 - expanded ** 2)
    if (discriminant < 0) return
    const time = Math.max(0, (-projection - Math.sqrt(discriminant)) / distanceSquared)
    if (time > 1 || (contact && time >= contact.time)) return
    const normalOffset = add(offset, scale(delta, time))
    const normalLength = length(normalOffset)
    if (normalLength < EPSILON) return
    const normal = scale(normalOffset, 1 / normalLength)
    if (normal.x * delta.x + normal.z * delta.z >= -EPSILON) return
    contact = { time, normal, coast: false }
  }
  for (const obstacle of obstacles) circleContact(obstacle)
  const end = add(position, delta)
  for (const segment of walls) {
    const expanded = radius + WALL_RADIUS
    const minX = Math.min(segment.a.x, segment.b.x), maxX = Math.max(segment.a.x, segment.b.x)
    const minZ = Math.min(segment.a.z, segment.b.z), maxZ = Math.max(segment.a.z, segment.b.z)
    if (Math.max(position.x, end.x) < minX - expanded || Math.min(position.x, end.x) > maxX + expanded
      || Math.max(position.z, end.z) < minZ - expanded || Math.min(position.z, end.z) > maxZ + expanded) continue
    circleContact({ ...segment.a, radius: WALL_RADIUS })
    circleContact({ ...segment.b, radius: WALL_RADIUS })
    const vertical = minX === maxX
    const offset = vertical ? position.x - minX : position.z - minZ
    const travel = vertical ? delta.x : delta.z
    if (offset * travel >= 0 || Math.abs(travel) < EPSILON) continue
    const sign = offset >= 0 ? 1 : -1
    const time = (sign * expanded - offset) / travel
    if (time < 0 || time > 1 || (contact && time >= contact.time)) continue
    const along = vertical ? position.z + delta.z * time : position.x + delta.x * time
    if (along < (vertical ? minZ : minX) || along > (vertical ? maxZ : maxX)) continue
    contact = { time, normal: vertical ? { x: sign, z: 0 } : { x: 0, z: sign }, coast: false }
  }

  // This boundary is the complete land/bridge/platform union, not a radial coast.
  let previous = 0
  for (let index = 1; index <= 4; index++) {
    const time = index / 4
    if (surfaceClearance(add(position, scale(delta, time)), radius) >= 0) {
      previous = time
      continue
    }
    let low = previous, high = time
    for (let iteration = 0; iteration < 28; iteration++) {
      const middle = (low + high) / 2
      if (surfaceClearance(add(position, scale(delta, middle)), radius) >= 0) low = middle
      else high = middle
    }
    if (!contact || low < contact.time) {
      const point = add(position, scale(delta, low))
      const gradient = surfaceGradient(point, radius)
      contact = { time: low, normal: scale(gradient, 1 / length(gradient)), coast: true }
    }
    break
  }
  return contact
}

function surfaceGradient(point: Point2, radius: number): Point2 {
  const h = 0.001
  return {
    x: (surfaceClearance({ x: point.x + h, z: point.z }, radius) - surfaceClearance({ x: point.x - h, z: point.z }, radius)) / (2 * h),
    z: (surfaceClearance({ x: point.x, z: point.z + h }, radius) - surfaceClearance({ x: point.x, z: point.z - h }, radius)) / (2 * h),
  }
}

function slideStep(position: Point2, delta: Point2, obstacles: readonly CircleObstacle[], radius: number): Point2 {
  let current = position, remaining = delta
  for (let iteration = 0; iteration < 4 && length(remaining) > EPSILON; iteration++) {
    const contact = firstContact(current, remaining, obstacles, radius)
    if (!contact) {
      const destination = add(current, remaining)
      return isFree(destination, obstacles, radius) ? destination : current
    }
    const time = Math.max(0, contact.time - EPSILON / length(remaining))
    current = add(current, scale(remaining, time))
    remaining = scale(remaining, 1 - contact.time)
    const inward = Math.min(0, remaining.x * contact.normal.x + remaining.z * contact.normal.z)
    remaining = {
      x: remaining.x - inward * contact.normal.x,
      z: remaining.z - inward * contact.normal.z,
    }
    if (contact.coast) {
      let destination = add(current, remaining)
      for (let correction = 0; correction < 6; correction++) {
        const clearance = surfaceClearance(destination, radius)
        if (clearance >= EPSILON) break
        const gradient = surfaceGradient(destination, radius)
        const magnitudeSquared = gradient.x ** 2 + gradient.z ** 2
        if (magnitudeSquared < EPSILON) break
        const inward = scale(gradient, (EPSILON - clearance) / magnitudeSquared)
        destination = add(destination, scale(inward, Math.min(1, MAX_SUBSTEP / length(inward))))
      }
      remaining = { x: destination.x - current.x, z: destination.z - current.z }
    }
  }
  return current
}

/** Swept circle contacts prevent tunnelling; short substeps allow obstacle/coast sliding.
 * Invalid starts stay put. A single frame is capped to 200 world units to bound work
 * after a suspended tab resumes; this exceeds the entire land-and-dock map width.
 */
export function moveWithCollisions(position: Point2, delta: Point2, obstacles: readonly CircleObstacle[], bodyRadius = 0.45): Point2 {
  const currentObstacles = validObstacles(obstacles)
  if (!finitePoint(delta) || !isFree(position, currentObstacles, bodyRadius)) return { ...position }
  const distance = length(delta)
  if (!Number.isFinite(distance) || distance <= EPSILON) return { ...position }
  const travel = Math.min(distance, MAX_FRAME_DISTANCE)
  const steps = Math.ceil(travel / MAX_SUBSTEP)
  const increment = scale(delta, travel / distance / steps)
  let current = { ...position }
  for (let step = 0; step < steps; step++) {
    const next = slideStep(current, increment, currentObstacles, bodyRadius)
    if (Math.hypot(next.x - current.x, next.z - current.z) <= EPSILON) break
    current = next
  }
  return current
}

/** A bounded desired step. Pass its displacement through moveWithCollisions afterwards. */
export function stepToward(position: Point2, target: Point2, maxDistance: number): { position: Point2; arrived: boolean } {
  if (!finitePoint(position) || !finitePoint(target)) return { position: { ...position }, arrived: false }
  const delta = { x: target.x - position.x, z: target.z - position.z }
  const distance = length(delta)
  if (distance <= EPSILON) return { position: { ...target }, arrived: true }
  if (!Number.isFinite(maxDistance) || maxDistance <= 0) return { position: { ...position }, arrived: false }
  if (distance <= maxDistance) return { position: { ...target }, arrived: true }
  return { position: add(position, scale(delta, maxDistance / distance)), arrived: false }
}

/** Reject sea/obstacle clicks; a target never relocates the character by itself. */
export function findWalkTarget(point: Point2, obstacles: readonly CircleObstacle[]): Point2 | null {
  return isFree(point, validObstacles(obstacles), 0.45) ? { ...point } : null
}

const GRID_SPACING = 1.5
const GRID_MIN_X = Math.floor(ISLAND_BOUNDS.minX / GRID_SPACING)
const GRID_MAX_X = Math.ceil(Math.max(ISLAND_BOUNDS.maxX, DOCK_PLATFORM.maxX) / GRID_SPACING)
const GRID_MIN_Z = Math.floor(ISLAND_BOUNDS.minZ / GRID_SPACING)
const GRID_MAX_Z = Math.ceil(ISLAND_BOUNDS.maxZ / GRID_SPACING)
const GRID_COLUMNS = GRID_MAX_X - GRID_MIN_X + 1
const GRID_ROWS = GRID_MAX_Z - GRID_MIN_Z + 1

/** Search-local indexing avoids mutable-world caches and whole-forest scans at
 * every grid node. An expanded circle is registered in every cell it touches. */
function indexObstacles(obstacles: readonly CircleObstacle[]) {
  const cellSize = 12
  const buckets = new Map<string, CircleObstacle[]>()
  const cell = (value: number) => Math.floor(value / cellSize)
  const minCellX = cell(ISLAND_BOUNDS.minX) - 1, maxCellX = cell(DOCK_PLATFORM.maxX) + 1
  const minCellZ = cell(ISLAND_BOUNDS.minZ) - 1, maxCellZ = cell(ISLAND_BOUNDS.maxZ) + 1
  for (const obstacle of obstacles) {
    const radius = obstacle.radius + 0.45
    for (let z = Math.max(minCellZ, cell(obstacle.z - radius)); z <= Math.min(maxCellZ, cell(obstacle.z + radius)); z++) {
      for (let x = Math.max(minCellX, cell(obstacle.x - radius)); x <= Math.min(maxCellX, cell(obstacle.x + radius)); x++) {
        const key = `${x},${z}`
        const bucket = buckets.get(key)
        if (bucket) bucket.push(obstacle)
        else buckets.set(key, [obstacle])
      }
    }
  }
  return {
    at: (point: Point2) => buckets.get(`${cell(point.x)},${cell(point.z)}`) ?? [],
    between: (a: Point2, b: Point2) => {
      const result = new Set<CircleObstacle>()
      for (let z = cell(Math.min(a.z, b.z)); z <= cell(Math.max(a.z, b.z)); z++) {
        for (let x = cell(Math.min(a.x, b.x)); x <= cell(Math.max(a.x, b.x)); x++) {
          for (const obstacle of buckets.get(`${x},${z}`) ?? []) result.add(obstacle)
        }
      }
      return result
    },
  }
}

type SearchEntry = { key: number; score: number }

function enqueue(heap: SearchEntry[], entry: SearchEntry): void {
  heap.push(entry)
  let child = heap.length - 1
  while (child > 0) {
    const parent = (child - 1) >> 1
    if (heap[parent].score <= entry.score) break
    heap[child] = heap[parent]
    child = parent
  }
  heap[child] = entry
}

function dequeue(heap: SearchEntry[]): SearchEntry {
  const first = heap[0], last = heap.pop()!
  if (heap.length) {
    let parent = 0
    while (parent * 2 + 1 < heap.length) {
      let child = parent * 2 + 1
      if (child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++
      if (heap[child].score >= last.score) break
      heap[parent] = heap[child]
      parent = child
    }
    heap[parent] = last
  }
  return first
}

/** Coarse click navigation: waypoints are reached by walking, never by teleporting.
 * The bounded 1.5-unit grid covers the expanded island and the offshore dock.
 * Only free nodes are expanded. Narrower passages can be
 * conservatively rejected; direct unobstructed routes still keep the exact target.
 */
export function findWalkPath(start: Point2, target: Point2, obstacles: readonly CircleObstacle[]): Point2[] {
  const currentObstacles = validObstacles(obstacles)
  if (!isFree(start, currentObstacles, 0.45) || !isFree(target, currentObstacles, 0.45)) return []
  const obstacleIndex = indexObstacles(currentObstacles)
  const clear = (from: Point2, to: Point2) => {
    const delta = { x: to.x - from.x, z: to.z - from.z }
    const distanceSquared = delta.x ** 2 + delta.z ** 2
    if (distanceSquared <= EPSILON ** 2) return true
    const minX = Math.min(from.x, to.x), maxX = Math.max(from.x, to.x)
    const minZ = Math.min(from.z, to.z), maxZ = Math.max(from.z, to.z)
    // Test each tree once against the entire straight edge, rather than sliding
    // through every tree on every 0.2-unit physics substep. Exact tangency is safe.
    for (const obstacle of obstacleIndex.between(from, to)) {
      const radius = Math.max(0, obstacle.radius + 0.45 - EPSILON)
      if (obstacle.x < minX - radius || obstacle.x > maxX + radius
        || obstacle.z < minZ - radius || obstacle.z > maxZ + radius) continue
      const time = Math.max(0, Math.min(1, ((obstacle.x - from.x) * delta.x + (obstacle.z - from.z) * delta.z) / distanceSquared))
      const x = from.x + delta.x * time - obstacle.x, z = from.z + delta.z * time - obstacle.z
      if (x * x + z * z < radius * radius) return false
    }
    // Capsule walls are swept analytically by this existing contact query. A
    // path edge must not rely on the physics solver sliding around a raised edge.
    const contact = firstContact(from, delta, [], 0.45)
    if (contact && contact.time < 1 - EPSILON) return false
    // Keep the actual candidate segment straight while checking the land/deck
    // union at the same quarter-substep spacing as real boundary queries. No slide can turn an
    // obstructed smoothing shortcut into an allegedly clear edge.
    const steps = Math.ceil(Math.sqrt(distanceSquared) / (MAX_SUBSTEP / 4))
    for (let step = 1; step <= steps; step++) {
      if (surfaceClearance(add(from, scale(delta, step / steps)), 0.45) < -1e-10) return false
    }
    return true
  }
  if (clear(start, target)) return [{ ...target }]

  const nodeCount = GRID_COLUMNS * GRID_ROWS
  const costs = new Float64Array(nodeCount).fill(Infinity)
  const parents = new Int32Array(nodeCount).fill(-1)
  const closed = new Uint8Array(nodeCount)
  const availability = new Int8Array(nodeCount)
  const edges = new Map<number, boolean>()
  const heap: SearchEntry[] = []
  const gridPoint = (key: number): Point2 => ({
    x: (key % GRID_COLUMNS + GRID_MIN_X) * GRID_SPACING,
    z: (Math.floor(key / GRID_COLUMNS) + GRID_MIN_Z) * GRID_SPACING,
  })
  const available = (key: number) => {
    if (!availability[key]) {
      const point = gridPoint(key)
      availability[key] = isFree(point, obstacleIndex.at(point), 0.45) ? 1 : -1
    }
    return availability[key] === 1
  }
  const heuristic = (point: Point2) => Math.hypot(point.x - target.x, point.z - target.z)
  const startColumn = Math.round(start.x / GRID_SPACING) - GRID_MIN_X
  const startRow = Math.round(start.z / GRID_SPACING) - GRID_MIN_Z
  // Connect the exact starting position to nearby grid nodes without snapping it.
  for (let row = Math.max(0, startRow - 2); row <= Math.min(GRID_ROWS - 1, startRow + 2); row++) {
    for (let column = Math.max(0, startColumn - 2); column <= Math.min(GRID_COLUMNS - 1, startColumn + 2); column++) {
      const key = row * GRID_COLUMNS + column
      if (!available(key)) continue
      const point = gridPoint(key)
      if (!clear(start, point)) continue
      costs[key] = Math.hypot(point.x - start.x, point.z - start.z)
      enqueue(heap, { key, score: costs[key] + heuristic(point) })
    }
  }

  while (heap.length) {
    const { key } = dequeue(heap)
    if (closed[key]) continue
    closed[key] = 1
    const point = gridPoint(key)
    if (heuristic(point) <= GRID_SPACING * 2 && clear(point, target)) {
      const reversePath: Point2[] = [{ ...target }]
      for (let cursor = key; cursor !== -1; cursor = parents[cursor]) reversePath.push(gridPoint(cursor))
      const path = reversePath.reverse()
      const smoothed: Point2[] = []
      let from = start, cursor = 0
      while (cursor < path.length) {
        let next = path.length - 1
        while (next > cursor && !clear(from, path[next])) next--
        smoothed.push(path[next])
        from = path[next]
        cursor = next + 1
      }
      return smoothed
    }
    const column = key % GRID_COLUMNS, row = Math.floor(key / GRID_COLUMNS)
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dz) || column + dx < 0 || column + dx >= GRID_COLUMNS || row + dz < 0 || row + dz >= GRID_ROWS) continue
      const nextKey = (row + dz) * GRID_COLUMNS + column + dx
      if (closed[nextKey] || !available(nextKey)) continue
      const next = gridPoint(nextKey)
      const cost = costs[key] + Math.hypot(dx, dz) * GRID_SPACING
      if (cost >= costs[nextKey]) continue
      const edge = Math.min(key, nextKey) * nodeCount + Math.max(key, nextKey)
      let passable = edges.get(edge)
      if (passable === undefined) { passable = clear(point, next); edges.set(edge, passable) }
      if (!passable) continue
      costs[nextKey] = cost
      parents[nextKey] = key
      enqueue(heap, { key: nextKey, score: cost + heuristic(next) })
    }
  }
  return []
}
