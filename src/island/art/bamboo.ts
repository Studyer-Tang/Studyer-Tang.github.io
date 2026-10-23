import * as THREE from 'three'
import { terrainHeight } from '../layout.ts'
import { isWalkable } from '../movement.ts'
import type { CircleObstacle } from '../movement.ts'
import { nearPath } from './landscape.ts'
import { woodlandRandom } from './woodland.ts'
import { addRod } from './resources.ts'
import type { ArtResources } from './resources.ts'

/** Jointed canes carry photographed alpha leaves; the footpath stays open. */
export function createBamboo(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[], onChange: () => void) {
  const group = new THREE.Group()
  group.visible = false
  parent.add(group)
  const random = woodlandRandom()
  const stems = resources.batch(resources.geometry(new THREE.CylinderGeometry(0.065, 0.09, 1, 8)), resources.paint('#758d4c'), group, false)
  const joints = resources.batch(resources.geometry(new THREE.CylinderGeometry(0.103, 0.103, 0.045, 8)), resources.paint('#b0b582'), group, false)
  const branches = resources.batch(resources.geometry(new THREE.CylinderGeometry(1, 1, 1, 5)), resources.paint('#849255'), group, false)
  const leafMaterial = resources.material(new THREE.MeshStandardMaterial({ color: '#c3d2a6', roughness: 0.9, alphaTest: 0.44, alphaToCoverage: true, side: THREE.DoubleSide }))
  const leafShape = resources.geometry(new THREE.PlaneGeometry(0.36, 1))
  leafShape.translate(0, 0.5, 0)
  const leaves = resources.batch(leafShape, leafMaterial, group, false)
  const sites: { x: number; z: number }[] = []
  for (let attempt = 0; attempt < 1500 && sites.length < 62; attempt++) {
    const x = -128 + random() * 45, z = 43 + random() * 47
    if (!isWalkable({ x, z }, 2.5) || nearPath(x, z, 3.8) || Math.hypot(x + 97, z - 65) < 4.5 || sites.some(site => Math.hypot(x - site.x, z - site.z) < 3.1)) continue
    sites.push({ x, z })
    obstacles.push({ x, z, radius: 0.8 })
    for (let cane = 0; cane < 3; cane++) {
      const angle = random() * Math.PI * 2, px = x + Math.cos(angle) * 0.5, pz = z + Math.sin(angle) * 0.5
      const y = terrainHeight(px, pz), height = 6.4 + random() * 3.9
      stems.add([px, y + height / 2, pz], [1, height, 1], [0.025 * Math.sin(angle), angle, 0.025 * Math.cos(angle)])
      for (let level = 0.7; level < height; level += 0.75) joints.add([px, y + level, pz], [1, 1, 1])
      for (let branch = 0; branch < 4; branch++) {
        const a = angle + branch * 2.4, by = y + height * (0.56 + branch * 0.1), length = 1.3 + random() * 0.6
        const end = new THREE.Vector3(px + Math.cos(a) * length, by + 0.45, pz + Math.sin(a) * length)
        addRod(branches, new THREE.Vector3(px, by, pz), end, 0.025)
        for (let index = 0; index < 8; index++) {
          const q = 0.28 + index / 10, side = index % 2 ? 1 : -1
          const lx = px + Math.cos(a) * length * q, lz = pz + Math.sin(a) * length * q
          const scale = 0.75 + random() * 0.45
          leaves.add([lx, by + q * 0.45, lz], [scale, scale, scale], [0.5, -(a + side * 0.65), -Math.PI / 2 + 0.12 + random() * 0.3])
        }
      }
    }
  }
  for (const batch of [stems, joints, branches, leaves]) batch.finish()
  let disposed = false, loaded = false
  resources.texture(new THREE.TextureLoader().load('/world-assets/leaf.webp', texture => {
    if (disposed) { texture.dispose(); return }
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    leafMaterial.map = texture
    leafMaterial.needsUpdate = true
    group.visible = loaded = true
    onChange()
  }, undefined, () => {}))
  return {
    update(camera: THREE.Camera) {
      group.visible = loaded && Math.hypot(camera.position.x + 105, camera.position.z - 66) < 205
    },
    dispose() { disposed = true },
  }
}
