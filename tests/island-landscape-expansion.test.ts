import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { createArtResources } from '../src/island/art/resources.ts'
import { createLandscape, islandPaths, nearPath } from '../src/island/art/landscape.ts'
import { createTreeSites, inGardenClearing } from '../src/island/art/woodland.ts'
import { horizonCanopy } from '../src/island/art/vegetation.ts'
import { islandLandmarks } from '../src/island/landmarks.ts'
import { findWalkPath, isWalkable, walkSurfaceHeight } from '../src/island/movement.ts'
import type { CircleObstacle } from '../src/island/movement.ts'

function triangleArea(shape: THREE.BufferGeometry) {
  const vertices = shape.getAttribute('position'), indices = shape.getIndex()!
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  let area = 0
  for (let index = 0; index < indices.count; index += 3) {
    a.fromBufferAttribute(vertices, indices.getX(index))
    b.fromBufferAttribute(vertices, indices.getX(index + 1))
    c.fromBufferAttribute(vertices, indices.getX(index + 2))
    area += b.sub(a).cross(c.sub(a)).length() / 2
  }
  return area
}

// Read the real local geometry without fetching textures or creating WebGL.
function scannedLeafGeometry() {
  const file = readFileSync(new URL('../public/world-assets/tree/island-tree-lod.glb', import.meta.url))
  const jsonLength = file.readUInt32LE(12)
  const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString())
  const binary = file.subarray(28 + jsonLength)
  const primitive = gltf.meshes.flatMap((mesh: { primitives: { material: number }[] }) => mesh.primitives).find((item: { material: number }) => gltf.materials[item.material].name === 'photographic-leaves')
  const read = (id: number) => {
    const accessor = gltf.accessors[id], view = gltf.bufferViews[accessor.bufferView]
    const itemSize = accessor.type === 'VEC3' ? 3 : accessor.type === 'VEC2' ? 2 : 1
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
    const constructor = accessor.componentType === 5126 ? Float32Array : accessor.componentType === 5125 ? Uint32Array : Uint16Array
    const bytes = binary.subarray(start, start + accessor.count * itemSize * constructor.BYTES_PER_ELEMENT)
    return new THREE.BufferAttribute(new constructor(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)), itemSize)
  }
  const shape = new THREE.BufferGeometry()
  shape.setAttribute('position', read(primitive.attributes.POSITION))
  shape.setAttribute('normal', read(primitive.attributes.NORMAL))
  shape.setAttribute('uv', read(primitive.attributes.TEXCOORD_0))
  shape.setIndex(read(primitive.indices))
  return shape
}

test('expanded garden loops stay on walkable land and meet the lake through its real entrances', () => {
  for (const path of islandPaths) for (const point of path) assert.ok(isWalkable(point), `trail left the walking domain at ${point.x}, ${point.z}`)
  const resources = createArtResources()
  const mockResources = { ...resources, pbr: (_kind: string, color = '#ffffff') => resources.paint(color) }
  const obstacles: CircleObstacle[] = [], parent = new THREE.Group()
  const landscape = createLandscape(parent, mockResources, obstacles)
  parent.updateMatrixWorld(true)
  for (const x of [-118.9, -117.2, -115.1, -114.1, -100, -84, -74.1]) {
    const hits = new THREE.Raycaster(new THREE.Vector3(x, 100, -33), new THREE.Vector3(0, -1, 0)).intersectObjects([landscape.pickSurfaces.at(-1)!])
    assert.ok(hits.length)
    assert.ok(Math.abs(hits[0].point.y - walkSurfaceHeight(x, -33)) < 0.003, 'the visible bridge and picking must agree with walking height')
  }
  resources.dispose()
})

test('the denser scanned woodland keeps every destination and the palace axis reachable', () => {
  const sites = createTreeSites([])
  assert.equal(sites.length, 480)
  const obstacles = sites.map(site => ({ x: site.x, z: site.z, radius: site.size * 1.05 }))
  for (const site of sites) {
    assert.ok(isWalkable(site, site.size * 1.05))
    assert.equal(inGardenClearing(site.x, site.z), false)
    assert.equal(nearPath(site.x, site.z, 5.1), false)
  }
  for (const place of islandLandmarks) {
    const path = findWalkPath({ x: -14, z: 27 }, place.entry, obstacles)
    assert.ok(path, `forest blocked ${place.id}`)
    assert.ok(Math.hypot(path.at(-1)!.x - place.entry.x, path.at(-1)!.z - place.entry.z) < 0.01)
  }
})

test('horizon LOD preserves complete photographed leaf cards and their canopy area', () => {
  const original = scannedLeafGeometry(), distant = horizonCanopy(original)
  assert.equal(distant.getIndex()!.count, original.getIndex()!.count / 4)
  assert.equal(distant.getAttribute('position').count, 3800)
  const coverage = triangleArea(distant) / triangleArea(original)
  assert.ok(coverage > 0.95 && coverage < 1.05, `leaf coverage changed to ${coverage}`)
  const uv = distant.getAttribute('uv')
  for (let index = 0; index < uv.count; index++) assert.ok(uv.getX(index) >= 0 && uv.getX(index) <= 1 && uv.getY(index) >= 0 && uv.getY(index) <= 1)
  original.dispose()
  distant.dispose()
})
