import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createAcademy } from '../src/island/art/academy.ts'
import { createArtResources } from '../src/island/art/resources.ts'
import { islandLandmarks, landmarkById } from '../src/island/landmarks.ts'
import { findWalkPath, moveWithCollisions, stepToward, terrainHeight, walkSurfaceHeight } from '../src/island/movement.ts'
import { createPalace } from '../src/island/art/palace.ts'
import type { CircleObstacle } from '../src/island/movement.ts'

function build() {
  const resources = createArtResources()
  const imagesDisabled = { ...resources, pbr: (_kind: string, color = '#ffffff') => resources.paint(color) }
  const obstacles: CircleObstacle[] = []
  const parent = new THREE.Group()
  createPalace(parent, imagesDisabled, obstacles)
  const academy = createAcademy(parent, imagesDisabled, obstacles)
  academy.group.updateWorldMatrix(true, true)
  return { resources, academy, obstacles }
}

test('five academy districts keep their marked entrances free of solid furnishings', () => {
  const { resources, academy, obstacles } = build()
  assert.deepEqual(academy.structures.map(place => place.id), ['gate', 'lake', 'history', 'studio', 'ridge'])
  for (const { id } of academy.structures) {
    const entry = landmarkById(id).entry
    assert.ok(obstacles.every(o => Math.hypot(o.x - entry.x, o.z - entry.z) > o.radius + 0.5), `${id} entry must fit the traveler`)
  }
  // Doors and columns must not turn the bridge or ramp into a hidden barrier.
  for (let x = -74; x <= -55; x += 0.25) {
    assert.ok(obstacles.every(o => Math.hypot(o.x - x, o.z + 33) > o.radius + 0.5), `lake crossing blocked at ${x}`)
  }
  resources.dispose()
})

test('academy floors and lake ramp picking agree with the controller surface', () => {
  const { resources, academy } = build()
  for (const id of ['gate', 'lake', 'history', 'studio', 'ridge'] as const) {
    const { entry } = landmarkById(id)
    const hit = new THREE.Raycaster(new THREE.Vector3(entry.x, 100, entry.z), new THREE.Vector3(0, -1, 0)).intersectObjects(academy.pickSurfaces)[0]
    assert.ok(hit, `${id} entry must have a ground picking surface`)
    assert.ok(Math.abs(hit.point.y - walkSurfaceHeight(entry.x, entry.z)) < 0.04)
  }
  for (const x of [-73.9, -70, -64, -60, -59.5, -58.1, -55.2]) {
    const hit = new THREE.Raycaster(new THREE.Vector3(x, 100, -33), new THREE.Vector3(0, -1, 0)).intersectObjects(academy.pickSurfaces)[0]
    assert.ok(hit)
    assert.ok(Math.abs(hit.point.y - walkSurfaceHeight(x, -33)) < 0.025)
  }
  resources.dispose()
})

test('academy meshes have finite bounds and share a bounded number of instance draws', () => {
  const { resources, academy } = build()
  let batches = 0, roofCount = 0, triangles = 0
  academy.group.traverse(object => {
    if (object instanceof THREE.Group && object.name.endsWith('-curved-roof')) roofCount++
    if (!(object instanceof THREE.Mesh)) return
    if (object instanceof THREE.InstancedMesh) {
      batches++
      const matrix = new THREE.Matrix4()
      for (let index = 0; index < object.count; index++) {
        object.getMatrixAt(index, matrix)
        assert.ok(matrix.determinant() > 0, 'terrain must not invert a column or pier below its roof')
      }
    }
    const positions = object.geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      assert.ok(Number.isFinite(positions.getX(i)) && Number.isFinite(positions.getY(i)) && Number.isFinite(positions.getZ(i)))
    }
    triangles += (object.geometry.index?.count ?? positions.count) / 3 * (object instanceof THREE.InstancedMesh ? object.count : 1)
  })
  assert.ok(batches <= 16, 'architectural details are grouped by material, not one object per book or tile')
  assert.ok(roofCount >= 12, 'districts contain distinct roofed wings and galleries')
  assert.ok(triangles < 180_000, `geometry should remain suitable for an optional web scene: ${triangles}`)
  academy.setDusk(true)
  academy.setDusk(false)
  resources.dispose()
})

test('all ten landmarks remain reachable through the combined architecture by real bounded steps', () => {
  const { resources, obstacles } = build()
  const start = { x: -14, z: 27 }
  for (const place of islandLandmarks) {
    const path = findWalkPath(start, place.entry, obstacles)
    assert.ok(path.length, `${place.id} must have a route through the actual furniture and columns`)
    let position = { ...start }
    for (const waypoint of path) {
      let arrived = false
      for (let frame = 0; frame < 2500; frame++) {
        const desired = stepToward(position, waypoint, 0.19).position
        const next = moveWithCollisions(position, { x: desired.x - position.x, z: desired.z - position.z }, obstacles)
        assert.ok(Math.abs(walkSurfaceHeight(next.x, next.z) - walkSurfaceHeight(position.x, position.z)) < 0.28,
          `${place.id}: no step may jump from the ground into a raised terrace`)
        position = next
        if (Math.hypot(position.x - waypoint.x, position.z - waypoint.z) < 1e-4) { arrived = true; break }
      }
      assert.ok(arrived, `${place.id}: a planned waypoint must be reachable with real movement`)
    }
    assert.ok(Math.hypot(position.x - place.entry.x, position.z - place.entry.z) < 1e-4)
  }
  resources.dispose()
})

test('ridge and history architectural clearings remain horizontal underneath their spanning roofs', () => {
  for (const [id, halfWidth, halfDepth] of [['history', 13.8, 10.4], ['ridge', 10, 9]] as const) {
    const { position } = landmarkById(id)
    const base = terrainHeight(position.x, position.z)
    for (let x = -halfWidth; x <= halfWidth; x += 0.5) for (let z = -halfDepth; z <= halfDepth; z += 0.5) {
      assert.ok(Math.abs(terrainHeight(position.x + x, position.z + z) - base) < 0.05,
        `${id}: buildings need an actual level terrain shelf, not roofs intersecting a steep mountain`)
    }
  }
})
