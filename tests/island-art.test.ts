import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createArtResources } from '../src/island/art/resources.ts'
import { createPalace, roofShape } from '../src/island/art/palace.ts'
import { createDock } from '../src/island/art/landscape.ts'
import { moveWithCollisions, walkSurfaceHeight } from '../src/island/movement.ts'
import type { CircleObstacle } from '../src/island/movement.ts'

// Geometry checks deliberately avoid network images and do not create WebGL.
function resourcesWithoutImages() {
  const resources = createArtResources()
  return { ...resources, pbr: (_kind: string, color = '#ffffff') => resources.paint(color) }
}
function castDown(objects: THREE.Object3D[], x: number, z: number, recursive = false) {
  for (const object of objects) object.updateWorldMatrix(true, true)
  return new THREE.Raycaster(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0)).intersectObjects(objects, recursive)
}

test('PBR materials wait for images and repeat variants share one loaded texture source', async context => {
  const pending: { texture: THREE.Texture; finish: () => void }[] = []
  context.mock.method(THREE.TextureLoader.prototype, 'load', (_url: string, onLoad?: (texture: THREE.Texture) => void) => {
    const texture = new THREE.Texture()
    pending.push({ texture, finish: () => { texture.image = { width: 8, height: 8 }; onLoad?.(texture) } })
    return texture
  })
  const resources = createArtResources()
  const first = resources.pbr('stone', '#ffffff', 1), repeated = resources.pbr('stone', '#dddddd', 3)
  assert.equal(pending.length, 3, 'one image load per albedo, normal and ARM channel')
  assert.equal(first.map, null, 'an empty image must never be submitted to the renderer')
  assert.equal(repeated.map, null)
  for (const item of pending) item.finish()
  assert.equal(await resources.whenReady(), true)
  assert.ok(first.map?.image)
  assert.ok(repeated.map?.image)
  assert.equal(first.map.source, repeated.map.source)
  assert.equal(first.map.repeat.x, 1)
  assert.equal(repeated.map.repeat.x, 3)
  assert.equal(first.map.colorSpace, THREE.SRGBColorSpace)
  assert.equal(first.normalMap?.colorSpace, THREE.NoColorSpace)
  resources.dispose()
})

test('curved hip roof has finite upward-facing geometry and raised eave corners', () => {
  const roof = roofShape(34, 23, 3.5, 0.8)
  const positions = roof.geometry.getAttribute('position'), normals = roof.geometry.getAttribute('normal')
  for (let index = 0; index < positions.count; index++) {
    assert.ok(Number.isFinite(positions.getY(index)))
    assert.ok(normals.getY(index) > 0, 'the roof must be visible and lit from above')
  }
  assert.ok(roof.height(17, 11.5) > roof.height(0, 11.5) + 0.5)
  assert.ok(roof.height(0, 0) > roof.height(17, 11.5))
  roof.geometry.dispose()
})

test('palace stair stone and picking surfaces follow the same walkable rise', () => {
  const resources = resourcesWithoutImages(), parent = new THREE.Group(), obstacles: CircleObstacle[] = []
  const palace = createPalace(parent, resources, obstacles)
  for (let index = 0; index < 10; index++) {
    const z = 14.65 - index * 0.7
    const visible = castDown([palace.group], -14, z, true).find(hit => (hit.object as THREE.Mesh).material instanceof THREE.Material && ((hit.object as THREE.Mesh).material as THREE.Material).visible)
    assert.ok(visible, 'every tread should have a rendered surface')
    assert.ok(Math.abs(visible.point.y - walkSurfaceHeight(-14, z)) < 0.003)
    const pick = castDown(palace.pickSurfaces, -14, z)[0]
    assert.ok(pick)
    assert.ok(Math.abs(pick.point.y - walkSurfaceHeight(-14, z)) < 0.035)
  }
  const stopped = moveWithCollisions({ x: -14, z: -10 }, { x: 0, z: -5 }, obstacles)
  assert.ok(stopped.z > -12, 'the solid lectern must block a person walking into it')
  resources.dispose()
})

test('dock ramp picking matches its curved walk surface and the deck has no duplicate top boards', () => {
  const resources = resourcesWithoutImages(), parent = new THREE.Group(), obstacles: CircleObstacle[] = []
  const dock = createDock(parent, resources, obstacles)
  for (const x of [43.2, 45, 47.1, 49.7, 70, 93, 100]) {
    const hit = castDown(dock.pickSurfaces, x, 14)[0]
    assert.ok(hit)
    assert.ok(Math.abs(hit.point.y - walkSurfaceHeight(x, 14)) < 0.003)
  }
  const tops = castDown([dock.group], 88, 14.4, true).filter(hit => {
    const material = (hit.object as THREE.Mesh).material
    return material instanceof THREE.Material && material.visible && Math.abs(hit.point.y - 2.8) < 0.001
  })
  assert.equal(tops.length, 1, 'bridge and terminal platform must not overlap coplanar boards')
  resources.dispose()
})
