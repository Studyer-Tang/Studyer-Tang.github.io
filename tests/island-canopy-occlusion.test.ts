import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { createVegetation } from '../src/island/art/vegetation.ts'
import { createTreeSites } from '../src/island/art/woodland.ts'
import { createArtResources } from '../src/island/art/resources.ts'
import { terrainHeight } from '../src/island/layout.ts'
import { isCloseForestView, viewCrossesCanopy } from '../src/island/art/occlusion.ts'
import type { CanopyVolume } from '../src/island/art/occlusion.ts'

const camera = { x: 0, y: 4, z: 20 }, focus = { x: 0, y: 4, z: 0 }
const crown: CanopyVolume = { x: 0, y: 4, z: 10, radiusX: 2, radiusY: 3, radiusZ: 2, yaw: 0 }

test('only foreground crowns crossing the finite camera-to-person corridor are removed', () => {
  assert.equal(viewCrossesCanopy(camera, focus, crown, 0.65), true)
  assert.equal(viewCrossesCanopy(camera, focus, { ...crown, x: 8 }, 0.65), false)
  assert.equal(viewCrossesCanopy(camera, focus, { ...crown, z: -8 }, 0.65), false, 'a tree behind the person stays')
  assert.equal(viewCrossesCanopy(camera, focus, { ...crown, z: 28 }, 0.65), false, 'a tree behind the camera stays')
  assert.equal(viewCrossesCanopy(camera, focus, { ...crown, y: 12 }, 0.65), false, 'high crowns outside the sightline stay')
})

test('rotated asymmetric crowns use their actual narrow and broad axes', () => {
  const wide = { ...crown, x: 4, radiusX: 5, radiusZ: 1 }
  assert.equal(viewCrossesCanopy(camera, focus, wide, 0.1), true)
  assert.equal(viewCrossesCanopy(camera, focus, { ...wide, yaw: Math.PI / 2 }, 0.1), false)
})

test('the restore margin prevents trees flickering at the corridor edge', () => {
  const boundary = { ...crown, x: 3 }
  assert.equal(viewCrossesCanopy(camera, focus, boundary, 0.65), false, 'visible tree remains at the outer edge')
  assert.equal(viewCrossesCanopy(camera, focus, boundary, 1.35), true, 'hidden tree waits for a clear separation')
  assert.equal(viewCrossesCanopy(camera, focus, { ...boundary, x: 3.5 }, 1.35), false)
})

test('near elevated trails get clear sightlines but aerial and distant views retain all trees', () => {
  assert.equal(isCloseForestView({ x: 0, y: 10, z: 30 }, focus), true)
  assert.equal(isCloseForestView({ x: 0, y: 38, z: 30 }, { x: 0, y: 30, z: 0 }), true, 'use relative elevation on a mountain')
  assert.equal(isCloseForestView({ x: 0, y: 60, z: 20 }, focus), false)
  assert.equal(isCloseForestView({ x: 0, y: 10, z: 100 }, focus), false)
  assert.equal(isCloseForestView(focus, focus), false)
})


test('one obscuring tree hides and restores every LOD instance without changing cached bounds', context => {
  const model = () => {
    const group = new THREE.Group()
    for (const [name, width, height, y] of [['scanned-trunk', 0.3, 3, 1.5], ['scanned-branches', 0.8, 2, 2.5], ['photographic-leaves', 4, 3, 3]] as const) {
      const material = new THREE.MeshStandardMaterial()
      material.name = name
      group.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, width).translate(0, y, 0), material))
    }
    return group
  }
  let finishLod = () => {}
  context.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  context.mock.method(GLTFLoader.prototype, 'load', (url: string, onLoad: (gltf: GLTF) => void) => {
    if (url.endsWith('island-tree.glb')) onLoad({ scene: model() } as GLTF)
    else if (url.endsWith('island-tree-lod.glb')) finishLod = () => onLoad({ scene: model() } as GLTF)
    else onLoad({ scene: new THREE.Group() } as GLTF)
  })
  const parent = new THREE.Group(), resources = createArtResources(), site = createTreeSites([])[0]
  let changes = 0
  const vegetation = createVegetation(parent, resources, [], () => { changes++ })
  const instances = () => {
    const result: { mesh: THREE.InstancedMesh; index: number; matrix: THREE.Matrix4 }[] = []
    parent.traverse(object => {
      if (!(object instanceof THREE.InstancedMesh) || !['scanned-trunk', 'scanned-branches', 'photographic-leaves'].includes((object.material as THREE.Material).name)) return
      for (let index = 0; index < object.count; index++) {
        const matrix = new THREE.Matrix4()
        object.getMatrixAt(index, matrix)
        if (Math.abs(matrix.elements[12] - site.x) < 0.001 && Math.abs(matrix.elements[14] - site.z) < 0.001) result.push({ mesh: object, index, matrix })
      }
    })
    return result
  }
  const high = instances(), original = high[0].matrix.clone(), bounds = high.map(instance => instance.mesh.boundingSphere!.clone())
  assert.equal(high.length, 3)
  const base = terrainHeight(site.x, site.z), camera = new THREE.PerspectiveCamera()
  camera.position.set(site.x, base + 7, site.z + 20)
  const focus = new THREE.Vector3(site.x, base + 1, site.z - 10)
  vegetation.update(camera, focus)
  for (const instance of instances()) assert.equal(instance.matrix.elements[0] ** 2 + instance.matrix.elements[1] ** 2 + instance.matrix.elements[2] ** 2, 0)
  finishLod()
  assert.equal(instances().length, 9)
  for (const instance of instances()) {
    assert.equal(instance.matrix.elements[0] ** 2 + instance.matrix.elements[1] ** 2 + instance.matrix.elements[2] ** 2, 0, 'a late LOD must inherit the hidden state')
    assert.equal(instance.mesh.instanceMatrix.usage, THREE.DynamicDrawUsage)
    assert.ok(instance.mesh.boundingSphere!.radius > 1)
  }
  camera.position.y = base + 80
  vegetation.update(camera, focus)
  for (const instance of instances()) {
    instance.matrix.elements.forEach((value, index) => assert.ok(Math.abs(value - original.elements[index]) < 0.00001))
    assert.ok(instance.mesh.instanceMatrix.updateRanges.length <= instance.mesh.count, 'invisible LODs retain bounded, deduplicated dirty ranges')
  }
  high.forEach((instance, index) => assert.ok(instance.mesh.boundingSphere!.equals(bounds[index])))
  assert.ok(changes >= 3, 'matrix changes must invalidate the static shadow map')
  vegetation.dispose()
  resources.dispose()
})
