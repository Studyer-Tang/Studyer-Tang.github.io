import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { islandRadiusAt, terrainHeight } from '../movement.ts'
import type { CircleObstacle } from '../movement.ts'
import { nearPath, woodlandPool } from './landscape.ts'
import type { ArtResources } from './resources.ts'

function disposeUnattachedModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    }
  })
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
  const bitmaps = new Set<ImageBitmap>()
  for (const texture of textures) {
    texture.dispose()
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) bitmaps.add(texture.image)
  }
  for (const bitmap of bitmaps) bitmap.close()
}

export function createVegetation(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[], onChange: () => void) {
  let seed = 529138
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const treeSites: { x: number; z: number; size: number; angle: number }[] = []
  for (let attempt = 0; attempt < 1500 && treeSites.length < 132; attempt++) {
    const angle = random() * Math.PI * 2, q = 0.26 + random() * 0.58
    const x = Math.cos(angle) * islandRadiusAt(angle) * q, z = Math.sin(angle) * islandRadiusAt(angle) * q
    if (x > -39 && x < 11 && z > -27 && z < 18) continue
    // The largest scanned crown reaches about 7m sideways from its trunk.
    // Keep the palace approach and the camera behind it clear of entire crowns.
    if (Math.abs(x + 14) < 15 && z >= 8) continue
    if (nearPath(x, z, 3.4) || Math.hypot(x + 14, z - 27) < 7 || Math.hypot(x - 30, z + 26) < 8 || Math.hypot(x - woodlandPool.x, z - woodlandPool.z) < 9) continue
    if (treeSites.some(site => Math.hypot(x - site.x, z - site.z) < 3.3)) continue
    treeSites.push({ x, z, size: 0.8 + random() * 0.65, angle: random() * Math.PI * 2 })
  }
  for (const tree of treeSites) obstacles.push({ x: tree.x, z: tree.z, radius: tree.size * 1.05 })
  const sectors = new Map<string, { high: THREE.InstancedMesh; low?: THREE.InstancedMesh; distant: boolean; shadows: boolean }>()
  const sharedTreeMaterials = new Map<string, THREE.Material>()
  // Fern scans are optional enrichment; failed loading leaves a complete scene.
  let disposed = false
  let resolveReady: (value: boolean) => void
  const ready = new Promise<boolean>(resolve => { resolveReady = resolve })
  function installTrees(model: THREE.Object3D, height: number, groundY: number, low: boolean) {
    model.updateMatrixWorld(true)
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      resources.geometry(object.geometry)
      const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material
      resources.material(sourceMaterial)
      for (const value of Object.values(sourceMaterial)) if (value instanceof THREE.Texture) resources.texture(value)
      const material = low ? sharedTreeMaterials.get(sourceMaterial.name) : sourceMaterial
      if (!material) return
      if (!low) sharedTreeMaterials.set(sourceMaterial.name, material)
      const shape = resources.geometry(object.geometry.clone().applyMatrix4(object.matrixWorld).translate(0, -groundY, 0))
      if (material instanceof THREE.MeshStandardMaterial) {
        material.roughness = 0.86
        if (material.alphaTest > 0 || material.transparent) {
          material.side = THREE.DoubleSide
          material.alphaToCoverage = true
        }
      }
      const batches = new Map<string, ReturnType<ArtResources['batch']>>()
      for (const tree of treeSites) {
        const key = `${sourceMaterial.name}:${Math.floor(tree.x / 32)}:${Math.floor(tree.z / 32)}`
        if (!batches.has(key)) batches.set(key, resources.batch(shape, material, parent))
        const scale = 8.3 * tree.size / (height || 1)
        // Bury the scan's flat cut base slightly; exposed roots remain above
        // the terrain instead of every trunk standing on a pale scan disc.
        batches.get(key)!.add([tree.x, terrainHeight(tree.x, tree.z) - 0.12, tree.z], [scale, scale, scale], [0, tree.angle, 0])
      }
      for (const [key, batch] of batches) {
        const mesh = batch.finish()
        if (low) {
          mesh.visible = false
          const sector = sectors.get(key)
          if (sector) sector.low = mesh
        } else sectors.set(key, { high: mesh, distant: false, shadows: true })
      }
    })
  }
  new GLTFLoader().load('/world-assets/tree/island-tree.glb', gltf => {
    if (disposed) {
      disposeUnattachedModel(gltf.scene)
      resolveReady(false)
      return
    }
    gltf.scene.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(gltf.scene)
    const height = bounds.max.y - bounds.min.y
    // Both LODs use the high tree's exact root, height and instance matrices.
    // Centering an asymmetric crown by its AABB would detach its trunk collider.
    installTrees(gltf.scene, height, bounds.min.y, false)
    resolveReady(sectors.size > 0)
    onChange()
    new GLTFLoader().load('/world-assets/tree/island-tree-lod.glb', lod => {
      if (disposed) { disposeUnattachedModel(lod.scene); return }
      installTrees(lod.scene, height, bounds.min.y, true)
      onChange()
    }, undefined, () => {})
  }, undefined, () => resolveReady(false))
  new GLTFLoader().load('/world-assets/fern/fern.gltf', gltf => {
    if (disposed) {
      disposeUnattachedModel(gltf.scene)
      return
    }
    const meshes: THREE.Mesh[] = []
    gltf.scene.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object) })
    meshes.slice(0, 4).forEach((source, type) => {
      const shape = resources.geometry(source.geometry)
      shape.computeBoundingBox()
      const bounds = shape.boundingBox!, height = bounds.max.y - bounds.min.y
      const normalized = resources.geometry(shape.clone().translate(-(bounds.max.x + bounds.min.x) / 2, -bounds.min.y, -(bounds.max.z + bounds.min.z) / 2))
      const material = Array.isArray(source.material) ? source.material[0] : source.material
      resources.material(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) resources.texture(value)
      const ferns = resources.batch(normalized, material, parent, false)
      for (let index = type; index < Math.min(treeSites.length, 76); index += 4) {
        const tree = treeSites[index], x = tree.x + 1.5, z = tree.z + 0.9
        if (nearPath(x, z, 1.9)) continue
        const scale = (0.9 + random() * 0.7) / (height || 1)
        ferns.add([x, terrainHeight(x, z), z], [scale, scale, scale], [0, random() * Math.PI * 2, 0])
      }
      ferns.finish()
    })
    onChange()
  }, undefined, () => {})
  return {
    ready,
    update(camera: THREE.Camera) {
      let changed = false
      for (const sector of sectors.values()) {
        const center = sector.high.boundingSphere!.center
        const distance = Math.hypot(camera.position.x - center.x, camera.position.z - center.z)
        const distant = !!sector.low && (distance > (sector.distant ? 55 : 65) || camera.position.y > 46)
        const shadows = camera.position.y < 46 && distance < (sector.shadows ? 78 : 70)
        changed ||= distant !== sector.distant || shadows !== sector.shadows
        sector.distant = distant
        sector.shadows = shadows
        sector.high.visible = !distant
        sector.high.castShadow = shadows
        if (sector.low) { sector.low.visible = distant; sector.low.castShadow = shadows }
      }
      if (changed) onChange()
    },
    dispose() { disposed = true },
  }
}
