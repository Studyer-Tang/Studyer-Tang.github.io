import test from 'node:test'
import assert from 'node:assert/strict'
import { findWalkPath, findWalkTarget, islandRadiusAt, isWalkable, moveWithCollisions, stepToward, terrainHeight, walkSurfaceHeight } from '../src/island/movement.ts'
import type { Point2 } from '../src/island/movement.ts'
import { DOCK_BRIDGE, DOCK_HEIGHT, DOCK_PLATFORM, HISTORY_TERRACE, HISTORY_TERRACE_HEIGHT, ISLAND_BOUNDS, LAKE_BRIDGE, LAKE_BRIDGE_HEIGHT, LAKE_CENTER, LAKE_PAVILION, LAKE_PAVILION_RAMP, LAKE_RADII, LAKE_WATER_HEIGHT, OBSERVATORY_CENTER, OBSERVATORY_HEIGHT, OBSERVATORY_RADIUS, PALACE_TERRACE_HEIGHT, RIDGE_TERRACE, RIDGE_TERRACE_HEIGHT } from '../src/island/layout.ts'
import { islandLandmarks } from '../src/island/landmarks.ts'

const near = (actual: number, expected: number, tolerance = 1e-5) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`)
const radialPoint = (angle: number, q: number): Point2 => ({ x: Math.cos(angle) * islandRadiusAt(angle) * q, z: Math.sin(angle) * islandRadiusAt(angle) * q })

test('the asymmetric shoreline expands inland and its walkable inset includes body clearance', () => {
  near(islandRadiusAt(0), 71.26)
  near(islandRadiusAt(Math.PI / 2), 126.75)
  near(islandRadiusAt(Math.PI), 162.03)
  near(islandRadiusAt(-Math.PI / 2), 148.625)
  for (let index = 0; index < 64; index++) {
    const angle = index * Math.PI / 32
    const point = radialPoint(angle, 0.94)
    if (point.x > DOCK_BRIDGE.minX && point.z > DOCK_BRIDGE.minZ - 1 && point.z < DOCK_BRIDGE.maxZ + 1) continue
    assert.equal(isWalkable(radialPoint(angle, 0.94), 0), true)
    assert.equal(isWalkable(radialPoint(angle, 0.941), 0), false)
    assert.equal(isWalkable(radialPoint(angle, 0.94)), false)
    assert.equal(isWalkable(radialPoint(angle, 0.91)), true)
  }
  assert.equal(isWalkable({ x: NaN, z: 0 }), false)
  assert.equal(isWalkable({ x: 0, z: 0 }, -1), false)
})

test('the continuous terrain contains a true northern ridge while the palace axis stays gentle', () => {
  assert.ok(terrainHeight(0, 0) >= 3 && terrainHeight(0, 0) <= 4, 'the centre remains a modest broad rise')
  assert.ok(terrainHeight(-25, -104) >= 21, 'the lookout has a real elevated architectural clearing')
  assert.ok(terrainHeight(-10, -83) > 29, 'the surrounding ridge is real traversable terrain, not a scenic object')
  assert.ok(terrainHeight(27, -84) > 23, 'the observatory stands on the eastern continuation of the ridge')
  assert.ok(terrainHeight(-14, 56) < 3, 'the southern entrance remains a gentle approach')
  for (let index = 0; index < 24; index++) {
    const angle = index * Math.PI / 12
    const shore = radialPoint(angle, 1)
    near(terrainHeight(shore.x, shore.z), 1.1)
    for (let radius = 0; radius < islandRadiusAt(angle); radius += 0.25) {
      const p = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }
      const next = { x: Math.cos(angle) * (radius + 0.25), z: Math.sin(angle) * (radius + 0.25) }
      assert.ok(Math.abs(terrainHeight(p.x, p.z) - terrainHeight(next.x, next.z)) < 0.34,
        'mountain slopes and lake banks stay continuous at walking scale')
    }
  }
})

test('unobstructed movement preserves distance and never mutates inputs', () => {
  const position = Object.freeze({ x: 0, z: 0 }), delta = Object.freeze({ x: 2, z: 1 })
  const result = moveWithCollisions(position, delta, [])
  near(result.x, 2)
  near(result.z, 1)
  assert.notEqual(result, position)
})

test('large frame deltas cannot tunnel through either a normal or a tiny circular obstacle', () => {
  for (const [radius, bodyRadius] of [[1, 0.45], [0.01, 0]] as const) {
    const result = moveWithCollisions({ x: -5.037, z: 0 }, { x: 1000, z: 0 }, [{ x: 0, z: 0, radius }], bodyRadius)
    assert.ok(result.x <= -(radius + bodyRadius))
    assert.ok(result.x > -(radius + bodyRadius) - 0.001)
    near(result.z, 0)
  }
})

test('oblique contact slides along an obstacle instead of sticking or penetrating', () => {
  const result = moveWithCollisions({ x: -2, z: -1 }, { x: 3, z: 0 }, [{ x: 0, z: 0, radius: 1 }])
  assert.ok(result.x > -1.6, 'a tangent component should keep making progress')
  assert.ok(result.z < -1, 'the normal component must deflect away from the circle')
  assert.ok(Math.hypot(result.x, result.z) >= 1.45 - 1e-6)
})

test('large movement stops at the coast and sustained diagonal input can follow the shore', () => {
  const stopped = moveWithCollisions({ x: 10, z: 0 }, { x: 1000, z: 0 }, [])
  assert.equal(isWalkable(stopped), true)
  assert.ok(stopped.x > 55)
  const pushed = moveWithCollisions(stopped, { x: 1000, z: 0 }, [])
  assert.ok(pushed.x - stopped.x < 0.03, 'held input stays at the shoreline while allowing a small tangent slide')
  assert.equal(isWalkable(pushed), true)
  let position = radialPoint(Math.PI, 0.92)
  const start = { ...position }
  for (let frame = 0; frame < 120; frame++) {
    const angle = Math.atan2(position.z, position.x)
    position = moveWithCollisions(position, {
      x: Math.cos(angle) * 0.15 - Math.sin(angle) * 0.35,
      z: Math.sin(angle) * 0.15 + Math.cos(angle) * 0.35,
    }, [])
    assert.equal(isWalkable(position), true)
  }
  assert.ok(Math.hypot(position.x - start.x, position.z - start.z) > 10)
})

test('blocked starts stay put and invalid deltas cannot move a character', () => {
  const water = radialPoint(0.8, 1.1)
  assert.deepEqual(moveWithCollisions(water, { x: -10, z: 0 }, []), water)
  assert.deepEqual(moveWithCollisions({ x: 0, z: 0 }, { x: 10, z: 0 }, [{ x: 0, z: 0, radius: 1 }]), { x: 0, z: 0 })
  assert.deepEqual(moveWithCollisions({ x: 1, z: 1 }, { x: Infinity, z: 0 }, []), { x: 1, z: 1 })
})

test('click targets reject sea, the body clearance strip, and expanded obstacle discs', () => {
  assert.equal(findWalkTarget(radialPoint(1.2, 1.1), []), null)
  assert.equal(findWalkTarget(radialPoint(1.2, 0.94), []), null)
  const obstacles = [{ x: 0, z: 0, radius: 1 }]
  assert.equal(findWalkTarget({ x: 1.3, z: 0 }, obstacles), null)
  const point = { x: 3, z: 2 }
  const target = findWalkTarget(point, obstacles)
  assert.deepEqual(target, point)
  assert.notEqual(target, point)
})

test('target stepping respects its speed limit, reports arrival, and cannot overshoot', () => {
  const first = stepToward({ x: 0, z: 0 }, { x: 3, z: 4 }, 2)
  near(first.position.x, 1.2)
  near(first.position.z, 1.6)
  assert.equal(first.arrived, false)
  assert.deepEqual(stepToward(first.position, { x: 3, z: 4 }, 10), { position: { x: 3, z: 4 }, arrived: true })
  assert.deepEqual(stepToward({ x: 3, z: 4 }, { x: 3, z: 4 }, 0), { position: { x: 3, z: 4 }, arrived: true })
  assert.deepEqual(stepToward({ x: 0, z: 0 }, { x: 3, z: 4 }, -1), { position: { x: 0, z: 0 }, arrived: false })
})

test('click navigation finds a traversable route around a tree and keeps the exact target', () => {
  const start = { x: -6, z: 28 }, target = { x: 6, z: 28 }
  const obstacles = [{ x: 0, z: 28, radius: 2 }]
  const path = findWalkPath(start, target, obstacles)
  assert.ok(path.length > 1)
  assert.deepEqual(path.at(-1), target)
  assert.ok(path.some(point => Math.abs(point.z - 28) > 2.45))
  let position = start
  for (const waypoint of path) {
    const reached = moveWithCollisions(position, { x: waypoint.x - position.x, z: waypoint.z - position.z }, obstacles)
    near(reached.x, waypoint.x)
    near(reached.z, waypoint.z)
    let arrived = false
    for (let frame = 0; frame < 150; frame++) {
      const desired = stepToward(position, waypoint, 0.17).position
      position = moveWithCollisions(position, { x: desired.x - position.x, z: desired.z - position.z }, obstacles)
      assert.equal(isWalkable(position), true)
      assert.ok(Math.hypot(position.x, position.z - 28) >= 2.45 - 1e-6)
      if (Math.hypot(position.x - waypoint.x, position.z - waypoint.z) < 1e-4) {
        arrived = true
        break
      }
    }
    assert.equal(arrived, true, 'small real movement steps must reach each waypoint without stalling')
  }
  near(position.x, target.x)
  near(position.z, target.z)
  assert.deepEqual(findWalkPath(start, { x: -5, z: 29 }, obstacles), [{ x: -5, z: 29 }])
})

test('pathfinding rejects sea and a dry coastal target cut off by rocks without crossing water', () => {
  const start = { x: 0, z: 0 }
  assert.deepEqual(findWalkPath(start, radialPoint(0, 1.1), []), [])
  const target = radialPoint(0, 0.86)
  const rocks = [{ x: 47, z: -30, radius: 30 }, { x: 47, z: 30, radius: 30 }]
  assert.notEqual(findWalkTarget(target, rocks), null, 'target itself is safe but its component is disconnected')
  assert.deepEqual(findWalkPath(start, target, rocks), [])
  assert.deepEqual(findWalkPath(start, { x: 47, z: 0 }, rocks), [])
})

function walkPath(start: Point2, path: Point2[], obstacles: { x: number; z: number; radius: number }[] = []): Point2 {
  assert.ok(path.length, 'a real walking route must exist')
  let position = { ...start }
  for (const waypoint of path) {
    let arrived = false
    for (let frame = 0; frame < 2500; frame++) {
      const desired = stepToward(position, waypoint, 0.19).position
      const next = moveWithCollisions(position, { x: desired.x - position.x, z: desired.z - position.z }, obstacles)
      assert.equal(isWalkable(next), true)
      assert.ok(Math.abs(walkSurfaceHeight(next.x, next.z) - walkSurfaceHeight(position.x, position.z)) < 0.28,
        'walking must not jump between raised and ground surfaces')
      position = next
      if (Math.hypot(position.x - waypoint.x, position.z - waypoint.z) < 1e-4) { arrived = true; break }
    }
    assert.equal(arrived, true, 'every waypoint must be reachable by bounded movement frames')
  }
  return position
}

test('the offshore bridge and terminal platform are real walkable surfaces with a continuous entrance ramp', () => {
  const start = { x: 40, z: 14 }, target = { x: 100, z: 14 }
  near(walkSurfaceHeight(43, 14), terrainHeight(43, 14))
  near(walkSurfaceHeight(50, 14), DOCK_HEIGHT)
  near(walkSurfaceHeight(target.x, target.z), DOCK_HEIGHT)
  assert.ok(terrainHeight(target.x, target.z) < DOCK_HEIGHT - 1)
  assert.equal(isWalkable({ x: 75, z: 14 }), true, 'the bridge is walkable even beyond the radial coastline')
  const path = findWalkPath(start, target, [])
  const reached = walkPath(start, path)
  near(reached.x, target.x)
  near(reached.z, target.z)
  const returned = walkPath(reached, findWalkPath(reached, start, []))
  near(returned.x, start.x)
  near(returned.z, start.z)
})

test('lateral motion is bounded by the actual bridge and platform edges, not the old radial coast', () => {
  const lower = moveWithCollisions({ x: 75, z: 14 }, { x: 0, z: -100 }, [])
  assert.equal(isWalkable(lower), true)
  assert.ok(lower.z >= DOCK_BRIDGE.minZ + 0.45)
  assert.ok(lower.z < DOCK_BRIDGE.minZ + 0.5)
  const upper = moveWithCollisions({ x: 95, z: 14 }, { x: 0, z: 100 }, [])
  assert.equal(isWalkable(upper), true)
  assert.ok(upper.z <= DOCK_PLATFORM.maxZ - 0.45)
  assert.ok(upper.z > DOCK_PLATFORM.maxZ - 0.5)
  const end = moveWithCollisions({ x: 95, z: 14 }, { x: 100, z: 0 }, [])
  assert.ok(end.x <= DOCK_PLATFORM.maxX - 0.45)
  assert.ok(end.x > DOCK_PLATFORM.maxX - 0.5)
  assert.equal(findWalkTarget({ x: 75, z: 23 }, []), null)
  assert.equal(findWalkTarget({ x: 105, z: 14 }, []), null)
  assert.notEqual(findWalkTarget({ x: 100, z: 23 }, []), null)
})

test('expanded-map pathfinding reaches both the terminal corner and the distant island around an obstacle', () => {
  const start = { x: 100, z: 23 }, target = { x: -45, z: 20 }
  const obstacles = [{ x: 70, z: 14, radius: 1.5 }]
  const path = findWalkPath(start, target, obstacles)
  assert.deepEqual(path.at(-1), target)
  const reached = walkPath(start, path, obstacles)
  near(reached.x, target.x)
  near(reached.z, target.z)
  assert.deepEqual(findWalkPath(start, { x: 75, z: 23 }, obstacles), [])
})

test('the palace terrace is reached through its south ramp, never by crossing a raised side edge', () => {
  near(walkSurfaceHeight(-14, -10), PALACE_TERRACE_HEIGHT)
  near(walkSurfaceHeight(-14, 15), terrainHeight(-14, 15))
  near(walkSurfaceHeight(-14, 8), PALACE_TERRACE_HEIGHT)
  const side = moveWithCollisions({ x: 8, z: -10 }, { x: -30, z: 0 }, [])
  assert.ok(side.x > 6.45)
  assert.ok(walkSurfaceHeight(side.x, side.z) < PALACE_TERRACE_HEIGHT - 1)
  const front = moveWithCollisions({ x: 0, z: 10 }, { x: 0, z: -30 }, [])
  assert.ok(front.z > 8.45)
  const start = { x: 8, z: -10 }, target = { x: -14, z: -10 }
  const path = findWalkPath(start, target, [])
  assert.ok(path.some(point => point.z >= 15))
  const reached = walkPath(start, path)
  near(reached.x, target.x)
  near(reached.z, target.z)
})

function scatteredForest() {
  let seed = 931217
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const start = { x: 100, z: 23 }, target = { x: -45, z: 20 }
  const obstacles = [{ x: 70, z: 14, radius: 1.5 }]
  while (obstacles.length < 130) {
    const point = { x: -53 + random() * 106, z: -40 + random() * 80, radius: 0.45 + random() * 0.4 }
    if (!isWalkable(point) || Math.hypot(point.x - target.x, point.z - target.z) < 3
      || Math.hypot(point.x - start.x, point.z - start.z) < 3) continue
    obstacles.push(point)
  }
  return { start, target, obstacles }
}

test('dense-forest paths have clear straight segments and remain traversable with actual small steps', () => {
  const { start, target, obstacles } = scatteredForest()
  assert.equal(obstacles.length, 130)
  const path = findWalkPath(start, target, obstacles)
  assert.deepEqual(path.at(-1), target)
  let from = start
  for (const to of path) {
    const dx = to.x - from.x, dz = to.z - from.z, squared = dx * dx + dz * dz
    for (const obstacle of obstacles) {
      const time = squared ? Math.max(0, Math.min(1, ((obstacle.x - from.x) * dx + (obstacle.z - from.z) * dz) / squared)) : 0
      const distance = Math.hypot(from.x + dx * time - obstacle.x, from.z + dz * time - obstacle.z)
      assert.ok(distance >= obstacle.radius + 0.45 - 2e-6, 'no straight waypoint edge may cut through an expanded tree circle')
    }
    from = to
  }
  const reached = walkPath(start, path, obstacles)
  near(reached.x, target.x)
  near(reached.z, target.z)
})

test('a direct tangent remains usable, but an intersecting straight shortcut must route around the circle', () => {
  const start = { x: -6, z: 28 }, target = { x: 6, z: 28 }
  assert.deepEqual(findWalkPath(start, target, [{ x: 0, z: 29.45, radius: 1 }]), [target])
  const detour = findWalkPath(start, target, [{ x: 0, z: 29.4, radius: 1 }])
  assert.ok(detour.length > 1)
  const reached = walkPath(start, detour, [{ x: 0, z: 29.4, radius: 1 }])
  near(reached.x, target.x)
  near(reached.z, target.z)
})

test('the expanded landscape offers over forty thousand square metres of usable ground within its bounds', () => {
  let area = 0
  for (let x = ISLAND_BOUNDS.minX; x <= ISLAND_BOUNDS.maxX; x++) {
    for (let z = ISLAND_BOUNDS.minZ; z <= ISLAND_BOUNDS.maxZ; z++) {
      if (isWalkable({ x, z })) area++
    }
  }
  assert.ok(area > 40_000 && area < 48_000, `usable mainland area: ${area} square units`)
  for (let index = 0; index < 360; index++) {
    const shore = radialPoint(index * Math.PI / 180, 1)
    assert.ok(shore.x >= ISLAND_BOUNDS.minX && shore.x <= ISLAND_BOUNDS.maxX)
    assert.ok(shore.z >= ISLAND_BOUNDS.minZ && shore.z <= ISLAND_BOUNDS.maxZ)
  }
})

test('the elliptical lake is real water with a continuous bed and cannot be crossed outside its bridge', () => {
  near(terrainHeight(LAKE_CENTER.x, LAKE_CENTER.z), LAKE_WATER_HEIGHT - 1)
  for (let index = 0; index < 32; index++) {
    const angle = index * Math.PI / 16
    const shore = { x: LAKE_CENTER.x + Math.cos(angle) * LAKE_RADII.x, z: LAKE_CENTER.z + Math.sin(angle) * LAKE_RADII.z }
    near(terrainHeight(shore.x, shore.z), LAKE_WATER_HEIGHT)
    const inside = { x: LAKE_CENTER.x + Math.cos(angle) * LAKE_RADII.x * 0.8, z: LAKE_CENTER.z + Math.sin(angle) * LAKE_RADII.z * 0.8 }
    if (inside.z >= LAKE_BRIDGE.minZ && inside.z <= LAKE_BRIDGE.maxZ) continue
    assert.equal(isWalkable(inside), false)
    assert.equal(findWalkTarget(inside, []), null)
  }
  const stopped = moveWithCollisions({ x: LAKE_CENTER.x, z: LAKE_CENTER.z - 20 }, { x: 0, z: 40 }, [])
  assert.equal(isWalkable(stopped), true)
  assert.ok(stopped.z < LAKE_CENTER.z - LAKE_RADII.z - 0.44)
})

test('the lake bridge and pavilion have physical railings and continuous dry-bank ramps at both approaches', () => {
  const start = { x: LAKE_BRIDGE.minX - 3, z: LAKE_CENTER.z }
  const target = { x: LAKE_PAVILION_RAMP.maxX + 3, z: LAKE_CENTER.z }
  near(walkSurfaceHeight(LAKE_BRIDGE.minX, LAKE_CENTER.z), terrainHeight(LAKE_BRIDGE.minX, LAKE_CENTER.z))
  near(walkSurfaceHeight(LAKE_CENTER.x, LAKE_CENTER.z), LAKE_BRIDGE_HEIGHT)
  near(walkSurfaceHeight(LAKE_PAVILION.maxX, LAKE_CENTER.z), LAKE_BRIDGE_HEIGHT)
  near(walkSurfaceHeight(LAKE_PAVILION_RAMP.maxX, LAKE_CENTER.z), terrainHeight(LAKE_PAVILION_RAMP.maxX, LAKE_CENTER.z))
  const crossed = walkPath(start, findWalkPath(start, target, []))
  near(crossed.x, target.x)
  near(crossed.z, target.z)
  const returned = walkPath(crossed, findWalkPath(crossed, start, []))
  near(returned.x, start.x)
  const bridgeSide = moveWithCollisions(LAKE_CENTER, { x: 0, z: 20 }, [])
  assert.ok(bridgeSide.z < LAKE_BRIDGE.maxZ - 0.45)
  const pavilionSide = moveWithCollisions({ x: -64, z: -29 }, { x: 0, z: 20 }, [])
  assert.ok(pavilionSide.z < LAKE_PAVILION.maxZ - 0.45)
})

test('all ten destinations are reached from the arrival court by real bounded walking steps', () => {
  const start = { x: -14, z: 27 }
  assert.equal(islandLandmarks.length, 10)
  for (const place of islandLandmarks) {
    assert.equal(isWalkable(place.entry), true, `${place.id} entry is on a physical surface`)
    const path = findWalkPath(start, place.entry, [])
    assert.deepEqual(path.at(-1), place.entry, `${place.id} needs a continuous route`)
    const arrived = walkPath(start, path)
    near(arrived.x, place.entry.x)
    near(arrived.z, place.entry.z)
  }
})

test('architectural mountain clearings meet their surrounding paths without a hidden step or blocked rim', () => {
  for (const { rect, height, entry } of [
    { rect: HISTORY_TERRACE, height: HISTORY_TERRACE_HEIGHT, entry: { x: -109, z: -68 } },
    { rect: RIDGE_TERRACE, height: RIDGE_TERRACE_HEIGHT, entry: { x: -25, z: -104 } },
  ]) {
    for (let fraction = 0; fraction <= 1; fraction += 0.125) {
      const x = rect.minX + (rect.maxX - rect.minX) * fraction
      const z = rect.minZ + (rect.maxZ - rect.minZ) * fraction
      for (const point of [
        { x, z: rect.minZ - 0.001 }, { x, z: rect.maxZ + 0.001 },
        { x: rect.minX - 0.001, z }, { x: rect.maxX + 0.001, z },
      ]) {
        near(terrainHeight(point.x, point.z), height, 1e-5)
        assert.equal(isWalkable(point), true, 'the floor meets dry traversable mountainside')
      }
    }
    for (const point of [
      { x: rect.minX - 4, z: (rect.minZ + rect.maxZ) / 2 },
      { x: rect.maxX + 4, z: (rect.minZ + rect.maxZ) / 2 },
      { x: (rect.minX + rect.maxX) / 2, z: rect.minZ - 4 },
      { x: (rect.minX + rect.maxX) / 2, z: rect.maxZ + 4 },
    ]) {
      const arrived = walkPath(entry, findWalkPath(entry, point, []))
      near(arrived.x, point.x)
      near(arrived.z, point.z)
    }
  }
})

test('the observatory has a level circular pad and a continuous southern mountain approach', () => {
  for (let radius = 0; radius <= OBSERVATORY_RADIUS; radius += 0.5) {
    for (let index = 0; index < 32; index++) {
      const angle = index * Math.PI / 16
      const x = OBSERVATORY_CENTER.x + Math.cos(angle) * radius
      const z = OBSERVATORY_CENTER.z + Math.sin(angle) * radius
      near(terrainHeight(x, z), OBSERVATORY_HEIGHT)
      near(walkSurfaceHeight(x, z), OBSERVATORY_HEIGHT)
    }
  }
  const entry = { x: OBSERVATORY_CENTER.x, z: OBSERVATORY_CENTER.z + OBSERVATORY_RADIUS }
  const lower = { x: entry.x, z: entry.z + 20 }
  const arrived = walkPath(lower, findWalkPath(lower, entry, []))
  near(arrived.x, entry.x)
  near(arrived.z, entry.z)
  near(terrainHeight(entry.x, entry.z + 0.001), OBSERVATORY_HEIGHT, 1e-5)
})

test('full-map forest indexing preserves route correctness with twelve hundred collision obstacles', () => {
  let seed = 934017
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const start = { x: 100, z: 23 }, target = { x: -109, z: -68 }
  const obstacles = [{ x: 70, z: 14, radius: 1.5 }]
  while (obstacles.length < 1200) {
    const point = { x: -158 + random() * 218, z: -134 + random() * 257, radius: 0.3 + random() * 0.4 }
    if (!isWalkable(point) || [start, target, ...islandLandmarks.map(place => place.entry)].some(entry => Math.hypot(point.x - entry.x, point.z - entry.z) < 4)) continue
    obstacles.push(point)
  }
  const path = findWalkPath(start, target, obstacles)
  assert.deepEqual(path.at(-1), target)
  const arrived = walkPath(start, path, obstacles)
  near(arrived.x, target.x)
  near(arrived.z, target.z)
})
