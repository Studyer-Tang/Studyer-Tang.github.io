import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { terrainHeight } from '../movement.ts'
import type { CircleObstacle } from '../movement.ts'
import { nearPath } from './landscape.ts'
import { createTreeSites, woodlandRandom } from './woodland.ts'
import { createBamboo } from './bamboo.ts'
import type { ArtResources } from './resources.ts'
import { isCloseForestView, viewCrossesCanopy } from './occlusion.ts'
import type { CanopyVolume } from './occlusion.ts'

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

// Keep whole photographed leaves in the horizon LOD. Dropping arbitrary
// triangles would shred the canopy; expanded complete cards retain its cover.
export function horizonCanopy(source: THREE.BufferGeometry) {
  const stride = 4
  const positions = source.getAttribute('position'), normals = source.getAttribute('normal'), uv = source.getAttribute('uv'), indices = source.getIndex()
  if (!indices || !normals || !uv || indices.count % 6) return source
  const vertices: number[] = [], directions: number[] = [], coordinates: number[] = [], output: number[] = []
  const scale = Math.sqrt(stride)
  for (let offset = 0; offset < indices.count; offset += stride * 6) {
    const corners = [...new Set(Array.from({ length: 6 }, (_, index) => indices.getX(offset + index)))]
    if (corners.length !== 4) return source
    const cx = corners.reduce((sum, index) => sum + positions.getX(index), 0) / 4
    const cy = corners.reduce((sum, index) => sum + positions.getY(index), 0) / 4
    const cz = corners.reduce((sum, index) => sum + positions.getZ(index), 0) / 4
    const first = vertices.length / 3
    for (const index of corners) {
      vertices.push(cx + (positions.getX(index) - cx) * scale, cy + (positions.getY(index) - cy) * scale, cz + (positions.getZ(index) - cz) * scale)
      directions.push(normals.getX(index), normals.getY(index), normals.getZ(index))
      coordinates.push(uv.getX(index), uv.getY(index))
    }
    for (let index = 0; index < 6; index++) output.push(first + corners.indexOf(indices.getX(offset + index)))
  }
  const shape = new THREE.BufferGeometry()
  shape.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  shape.setAttribute('normal', new THREE.Float32BufferAttribute(directions, 3))
  shape.setAttribute('uv', new THREE.Float32BufferAttribute(coordinates, 2))
  shape.setIndex(output)
  return shape
}

type TreeInstance = { original: THREE.Matrix4; crown?: CanopyVolume; hidden: boolean; bindings: { mesh: THREE.InstancedMesh; index: number }[] }

type TreeSector = { high: THREE.InstancedMesh; medium?: THREE.InstancedMesh; far?: THREE.InstancedMesh; level: number; visible: boolean; shadows: boolean }

export function createVegetation(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[], onChange: () => void) {
  const random = woodlandRandom(), treeSites = createTreeSites(obstacles)
  const fernSites = treeSites.slice(0, 220).map(tree => ({ x: tree.x + 1.6, z: tree.z + 1.1 }))
  for (const x of [-34, 6]) for (let z = 20; z < 53; z += 4) for (let index = 0; index < 3; index++) fernSites.push({ x: x + Math.sin(index * 2.4) * 1.1, z: z + Math.cos(index * 2.4) * 1.1 })
  for (const tree of treeSites) obstacles.push({ x: tree.x, z: tree.z, radius: tree.size * 1.05 })
  const bamboo = createBamboo(parent, resources, obstacles, onChange)
  const sectors = new Map<string, TreeSector>()
  const trees: TreeInstance[] = treeSites.map(() => ({ original: new THREE.Matrix4(), hidden: false, bindings: [] }))
  const hiddenMatrix = new THREE.Matrix4(), zeroScale = new THREE.Vector3(0, 0, 0)
  const pendingInstances = new WeakMap<THREE.InstancedMesh, Set<number>>()
  function bindTreeInstances(mesh: THREE.InstancedMesh, sites: number[]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const pending = new Set<number>()
    pendingInstances.set(mesh, pending)
    mesh.instanceMatrix.onUpload(() => pending.clear())
    sites.forEach((site, index) => {
      const tree = trees[site]
      if (!tree.bindings.length) mesh.getMatrixAt(index, tree.original)
      tree.bindings.push({ mesh, index })
      if (tree.hidden) mesh.setMatrixAt(index, hiddenMatrix.copy(tree.original).scale(zeroScale))
    })
    mesh.instanceMatrix.needsUpdate = true
    // batch.finish() computed full-crown bounds before any instance was hidden.
    // Keep them fixed so restoring a tree cannot move its culling boundary.
  }
  const fernSectors: THREE.InstancedMesh[] = []
  const sharedTreeMaterials = new Map<string, THREE.Material>()
  let disposed = false
  let resolveReady: (value: boolean) => void
  const ready = new Promise<boolean>(resolve => { resolveReady = resolve })
  function installTrees(model: THREE.Object3D, height: number, groundY: number, medium: boolean) {
    model.updateMatrixWorld(true)
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      resources.geometry(object.geometry)
      const sourceMaterial = Array.isArray(object.material) ? object.material[0] : object.material
      resources.material(sourceMaterial)
      for (const value of Object.values(sourceMaterial)) if (value instanceof THREE.Texture) resources.texture(value)
      const material = medium ? sharedTreeMaterials.get(sourceMaterial.name) : sourceMaterial
      if (!material) return
      if (!medium) sharedTreeMaterials.set(sourceMaterial.name, material)
      const shape = resources.geometry(object.geometry.clone().applyMatrix4(object.matrixWorld).translate(0, -groundY, 0))
      const distantShape = medium && sourceMaterial.name === 'photographic-leaves' ? resources.geometry(horizonCanopy(shape)) : shape
      if (material instanceof THREE.MeshStandardMaterial) {
        material.roughness = 0.86
        if (material.alphaTest > 0 || material.transparent) {
          material.side = THREE.DoubleSide
          material.alphaToCoverage = true
        }
      }
      const batches = new Map<string, ReturnType<ArtResources['batch']>>()
      const batchSites = new Map<string, number[]>()
      const crown = !medium && sourceMaterial.name === 'photographic-leaves' ? new THREE.Box3().setFromBufferAttribute(shape.getAttribute('position') as THREE.BufferAttribute) : null
      const farBatches = new Map<string, ReturnType<ArtResources['batch']>>()
      for (const [siteIndex, tree] of treeSites.entries()) {
        const key = `${sourceMaterial.name}:${Math.floor(tree.x / 32)}:${Math.floor(tree.z / 32)}`
        if (!batches.has(key)) { batches.set(key, resources.batch(shape, material, parent, false)); batchSites.set(key, []) }
        batchSites.get(key)!.push(siteIndex)
        if (medium && !farBatches.has(key)) farBatches.set(key, resources.batch(distantShape, material, parent, false))
        const scale = 8.3 * tree.size / (height || 1)
        const position: [number, number, number] = [tree.x, terrainHeight(tree.x, tree.z) - 0.12, tree.z]
        const size: [number, number, number] = [scale, scale, scale], angle: [number, number, number] = [0, tree.angle, 0]
        batches.get(key)!.add(position, size, angle)
        if (crown) {
          const cx = (crown.min.x + crown.max.x) / 2 * scale, cz = (crown.min.z + crown.max.z) / 2 * scale
          trees[siteIndex].crown = {
            x: tree.x + Math.cos(tree.angle) * cx + Math.sin(tree.angle) * cz,
            y: position[1] + (crown.min.y + crown.max.y) / 2 * scale,
            z: tree.z - Math.sin(tree.angle) * cx + Math.cos(tree.angle) * cz,
            radiusX: (crown.max.x - crown.min.x) / 2 * scale,
            radiusY: (crown.max.y - crown.min.y) / 2 * scale,
            radiusZ: (crown.max.z - crown.min.z) / 2 * scale, yaw: tree.angle,
          }
        }
        farBatches.get(key)?.add(position, size, angle)
      }
      for (const [key, batch] of batches) {
        const mesh = batch.finish()
        bindTreeInstances(mesh, batchSites.get(key)!)
        if (medium) {
          mesh.visible = false
          const far = farBatches.get(key)!.finish()
          bindTreeInstances(far, batchSites.get(key)!)
          far.visible = false
          const sector = sectors.get(key)
          if (sector) { sector.medium = mesh; sector.far = far }
        } else sectors.set(key, { high: mesh, level: 0, visible: true, shadows: false })
      }
    })
  }
  new GLTFLoader().load('/world-assets/tree/island-tree.glb', gltf => {
    if (disposed) { disposeUnattachedModel(gltf.scene); resolveReady(false); return }
    gltf.scene.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(gltf.scene)
    const height = bounds.max.y - bounds.min.y
    // Every LOD shares the scan's exact root and normalization. Recentring an
    // asymmetric crown by its AABB would detach it from its trunk collider.
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
    if (disposed) { disposeUnattachedModel(gltf.scene); return }
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
      const batches = new Map<string, ReturnType<ArtResources['batch']>>()
      for (let index = type; index < fernSites.length; index += 4) {
        const { x, z } = fernSites[index]
        if (nearPath(x, z, 2.3)) continue
        const key = `${Math.floor(x / 32)}:${Math.floor(z / 32)}`
        if (!batches.has(key)) batches.set(key, resources.batch(normalized, material, parent, false))
        const scale = (0.8 + random() * 0.8) / (height || 1)
        batches.get(key)!.add([x, terrainHeight(x, z), z], [scale, scale, scale], [0, random() * Math.PI * 2, 0])
      }
      for (const batch of batches.values()) fernSectors.push(batch.finish())
    })
    onChange()
  }, undefined, () => {})
  return {
    ready,
    update(camera: THREE.Camera, focus: THREE.Vector3) {
      let changed = false
      const clearSightline = isCloseForestView(camera.position, focus)
      for (const tree of trees) {
        const hidden = clearSightline && !!tree.crown && viewCrossesCanopy(camera.position, focus, tree.crown, tree.hidden ? 1.35 : 0.65)
        if (hidden === tree.hidden) continue
        tree.hidden = hidden
        const matrix = hidden ? hiddenMatrix.copy(tree.original).scale(zeroScale) : tree.original
        for (const { mesh, index } of tree.bindings) {
          mesh.setMatrixAt(index, matrix)
          const pending = pendingInstances.get(mesh)!
          if (!pending.has(index)) { mesh.instanceMatrix.addUpdateRange(index * 16, 16); pending.add(index) }
          mesh.instanceMatrix.needsUpdate = true
        }
        changed = true
      }
      for (const sector of sectors.values()) {
        const center = sector.high.boundingSphere!.center
        const distance = Math.hypot(camera.position.x - center.x, camera.position.z - center.z)
        const visible = distance < (sector.visible ? 235 : 220)
        const far = !!sector.far && distance > (sector.level === 2 ? 90 : 103)
        const medium = !!sector.medium && (distance > (sector.level >= 1 ? 39 : 48) || camera.position.y > 55)
        const level = far ? 2 : medium ? 1 : 0
        const shadows = visible && level < 2 && camera.position.y < 55 && distance < (sector.shadows ? 52 : 45)
        changed ||= level !== sector.level || visible !== sector.visible || shadows !== sector.shadows
        sector.level = level
        sector.visible = visible
        sector.shadows = shadows
        sector.high.visible = visible && level === 0
        sector.high.castShadow = shadows
        if (sector.medium) { sector.medium.visible = visible && level === 1; sector.medium.castShadow = shadows }
        if (sector.far) { sector.far.visible = visible && level === 2; sector.far.castShadow = false }
      }
      for (const sector of fernSectors) {
        const center = sector.boundingSphere!.center
        sector.visible = Math.hypot(camera.position.x - center.x, camera.position.z - center.z) < 85
      }
      bamboo.update(camera)
      if (changed) onChange()
    },
    dispose() { disposed = true; bamboo.dispose() },
  }
}
