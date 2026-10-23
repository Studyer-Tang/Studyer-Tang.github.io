import * as THREE from 'three'

export type ArtResources = ReturnType<typeof createArtResources>

/** Owns every procedural GPU resource, including the per-instance buffers. */
export function createArtResources(onChange: () => void = () => {}) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  const instances: THREE.InstancedMesh[] = []
  const palette = new Map<string, THREE.MeshStandardMaterial>()
  const pbrTextures = new Map<string, THREE.Texture>()
  const textureSources = new Map<string, Promise<THREE.Texture>>()
  const pendingMaterials: Promise<void>[] = []
  const textureLoader = new THREE.TextureLoader()
  let disposed = false
  const geometry = <T extends THREE.BufferGeometry>(value: T): T => { geometries.add(value); return value }
  const material = <T extends THREE.Material>(value: T): T => { materials.add(value); return value }
  const texture = <T extends THREE.Texture>(value: T): T => { textures.add(value); return value }
  function paint(color: string, roughness = 0.85, metalness = 0) {
    const key = `${color}:${roughness}:${metalness}`
    if (!palette.has(key)) palette.set(key, material(new THREE.MeshStandardMaterial({ color, roughness, metalness })))
    return palette.get(key)!
  }
  function pbr(kind: 'stone' | 'wood' | 'roof' | 'bark' | 'ground', color = '#ffffff', repeat = 1) {
    const surface = material(new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 }))
    const load = (suffix: string, colorSpace: THREE.ColorSpace = THREE.NoColorSpace) => {
      const sourceKey = `${kind}:${suffix}`
      if (!textureSources.has(sourceKey)) {
        const promise = new Promise<THREE.Texture>((resolve, reject) => {
          const value = texture(textureLoader.load(`/world-assets/${kind}-${suffix}.webp`, loaded => {
            if (disposed) loaded.dispose()
            resolve(loaded)
          }, undefined, reject))
          value.colorSpace = colorSpace
          value.wrapS = value.wrapT = THREE.RepeatWrapping
          value.anisotropy = 4
        })
        textureSources.set(sourceKey, promise)
      }
      return textureSources.get(sourceKey)!.then(source => {
        if (disposed) return source
        const key = `${sourceKey}:${repeat}`
        if (!pbrTextures.has(key)) {
          // Clone only after the source image exists. Three's clone marks the
          // texture for upload, which must never happen with an empty Source.
          const value = repeat === 1 ? source : texture(source.clone())
          value.repeat.set(repeat, repeat)
          pbrTextures.set(key, value)
        }
        return pbrTextures.get(key)!
      })
    }
    const ready = Promise.all([load('albedo', THREE.SRGBColorSpace), load('normal'), load('arm')]).then(([albedo, normal, arm]) => {
      if (disposed) return
      surface.map = albedo
      surface.normalMap = normal
      surface.aoMap = surface.roughnessMap = surface.metalnessMap = arm
      surface.aoMapIntensity = 0.45
      surface.roughness = surface.metalness = 1
      surface.normalScale.set(0.6, 0.6)
      surface.needsUpdate = true
      onChange()
    })
    pendingMaterials.push(ready)
    void ready.catch(() => { if (!disposed) onChange() })
    return surface
  }
  function mesh(shape: THREE.BufferGeometry, surface: THREE.Material, parent: THREE.Object3D, shadows = true) {
    const object = new THREE.Mesh(shape, surface)
    object.castShadow = shadows
    object.receiveShadow = true
    parent.add(object)
    return object
  }
  function batch(shape: THREE.BufferGeometry, surface: THREE.Material, parent: THREE.Object3D, shadows = true) {
    const matrices: THREE.Matrix4[] = []
    const colors: THREE.Color[] = []
    const dummy = new THREE.Object3D()
    return {
      add(position: [number, number, number], scale: [number, number, number], rotation: [number, number, number] = [0, 0, 0], color?: string) {
        dummy.position.set(...position)
        dummy.scale.set(...scale)
        dummy.rotation.set(...rotation)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
        if (color) colors.push(new THREE.Color(color))
      },
      finish() {
        const object = new THREE.InstancedMesh(shape, surface, matrices.length)
        matrices.forEach((matrix, index) => object.setMatrixAt(index, matrix))
        if (colors.length === matrices.length) colors.forEach((color, index) => object.setColorAt(index, color))
        object.castShadow = shadows
        object.receiveShadow = true
        object.computeBoundingSphere()
        parent.add(object)
        instances.push(object)
        return object
      },
    }
  }
  return {
    geometry, material, texture, paint, pbr, mesh, batch,
    whenReady: async () => (await Promise.allSettled(pendingMaterials)).every(result => result.status === 'fulfilled'),
    dispose() {
      disposed = true
      for (const object of instances) object.dispose()
      for (const item of geometries) item.dispose()
      for (const item of materials) item.dispose()
      const bitmaps = new Set<ImageBitmap>()
      for (const item of textures) {
        item.dispose()
        if (typeof ImageBitmap !== 'undefined' && item.image instanceof ImageBitmap) bitmaps.add(item.image)
      }
      for (const bitmap of bitmaps) bitmap.close()
    },
  }
}

export function addRod(batch: ReturnType<ArtResources['batch']>, from: THREE.Vector3, to: THREE.Vector3, radius: number) {
  const direction = to.clone().sub(from)
  const middle = from.clone().add(to).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
  const rotation = new THREE.Euler().setFromQuaternion(quaternion)
  batch.add(middle.toArray(), [radius, direction.length(), radius], [rotation.x, rotation.y, rotation.z])
}
