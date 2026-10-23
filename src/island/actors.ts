import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

export type ActorState = { moving: boolean; running: boolean; distance: number }
export type SceneActor = {
  root: THREE.Group
  ready: Promise<boolean>
  update: (dt: number, state: ActorState) => void
  gesture: (action: 'pet' | 'feed' | 'follow' | 'stay') => void
  dispose: () => void
}

function disposeModel(model: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>(), skeletons = new Set<THREE.Skeleton>()
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    }
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton)
  })
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
  for (const texture of textures) {
    texture.dispose()
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close()
  }
  for (const skeleton of skeletons) skeleton.dispose()
}

function actor(path: string, height: number, rotation: number, human: boolean): SceneActor {
  const root = new THREE.Group()
  root.visible = false
  const abort = new AbortController()
  let disposed = false, model: THREE.Group | undefined, mixer: THREE.AnimationMixer | undefined
  let actions: { idle: THREE.AnimationAction; walk: THREE.AnimationAction; run: THREE.AnimationAction; interact?: THREE.AnimationAction } | undefined
  let active: THREE.AnimationAction | undefined, gestureRemaining = 0
  const choose = (next: THREE.AnimationAction) => {
    if (active === next) return
    active?.fadeOut(.24)
    next.reset().setEffectiveWeight(1).fadeIn(.24).play()
    active = next
  }
  const ready = fetch(path, { signal: abort.signal }).then(response => {
    if (!response.ok) throw new Error('Actor asset unavailable')
    return response.arrayBuffer()
  }).then(bytes => new GLTFLoader().parseAsync(bytes, '/actors/')).then(gltf => {
    if (disposed) { disposeModel(gltf.scene); return false }
    model = gltf.scene
    model.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(model)
    const scale = height / Math.max(.01, bounds.max.y - bounds.min.y)
    model.scale.multiplyScalar(scale)
    model.updateMatrixWorld(true)
    bounds.setFromObject(model)
    model.position.x -= (bounds.min.x + bounds.max.x) / 2
    model.position.z -= (bounds.min.z + bounds.max.z) / 2
    model.position.y -= bounds.min.y
    model.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      if (human) {
        const original = object.geometry
        const smooth = original.clone()
        smooth.deleteAttribute('normal')
        object.geometry = mergeVertices(smooth, .0001)
        object.geometry.computeVertexNormals()
        smooth.dispose()
        original.dispose()
      }
      for (const paint of Array.isArray(object.material) ? object.material : [object.material]) {
        if (paint instanceof THREE.MeshStandardMaterial) { paint.roughness = .84; paint.metalness = 0; paint.flatShading = false }
      }
    })
    const pivot = new THREE.Group()
    pivot.rotation.y = rotation
    pivot.add(model)
    root.add(pivot)
    mixer = new THREE.AnimationMixer(model)
    const clip = (name: string, fallback: number) => gltf.animations.find(item => item.name === name) ?? gltf.animations[fallback]
    const idle = clip(human ? 'Idle_Neutral' : 'Survey', 0)
    const walk = clip('Walk', 0), run = clip('Run', 0)
    if (!idle || !walk || !run) throw new Error('Actor animation unavailable')
    const interact = gltf.animations.find(item => item.name === 'Interact')
    actions = { idle: mixer.clipAction(idle), walk: mixer.clipAction(walk), run: mixer.clipAction(run), interact: interact ? mixer.clipAction(interact) : undefined }
    actions.interact?.setLoop(THREE.LoopOnce, 1)
    if (actions.interact) actions.interact.clampWhenFinished = true
    choose(actions.idle)
    mixer.update(0)
    root.visible = true
    return true
  }).catch(() => {
    if (model) { mixer?.stopAllAction(); mixer?.uncacheRoot(model); disposeModel(model); model.removeFromParent(); model = undefined }
    return false
  })
  return {
    root,
    ready,
    update(dt, state) {
      if (disposed || !actions || !mixer || dt <= 0) return
      if (state.moving) gestureRemaining = 0
      else gestureRemaining = Math.max(0, gestureRemaining - dt)
      const next = state.moving ? state.running ? actions.run : actions.walk : gestureRemaining > 0 && actions.interact ? actions.interact : actions.idle
      choose(next)
      if (state.moving) next.setEffectiveTimeScale(THREE.MathUtils.clamp(state.distance / dt / (human ? state.running ? 5.7 : 2 : state.running ? 4.5 : 1.6), .65, 1.9))
      else next.setEffectiveTimeScale(1)
      mixer.update(dt)
    },
    gesture(action) {
      if (disposed || !actions?.interact || (action !== 'pet' && action !== 'feed')) return
      gestureRemaining = actions.interact.getClip().duration
      choose(actions.interact)
    },
    dispose() {
      if (disposed) return
      disposed = true
      abort.abort()
      mixer?.stopAllAction()
      if (model) { mixer?.uncacheRoot(model); disposeModel(model) }
      root.removeFromParent()
      root.clear()
    },
  }
}

/** The source rigs include authored idle, walk and run cycles; roots face -Z. */
export const createWalker = () => actor('/actors/traveler.glb', 1.9, Math.PI, true)
export const createFox = () => actor('/actors/fox.glb', .85, Math.PI, false)
