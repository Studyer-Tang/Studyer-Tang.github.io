import * as THREE from 'three'
import { islandLandmarks, landmarkById } from './landmarks'
import type { LandmarkChapter, LandmarkId } from './landmarks'
import { findWalkPath, findWalkTarget, moveWithCollisions, walkSurfaceHeight } from './movement'
import type { Point2 } from './movement'
import { createIslandArt } from './art'
import { createWalker, createFox } from './actors'

export type IslandPose = { x: number; z: number; heading: number }
export type AnimalAction = 'pet' | 'feed' | 'follow' | 'stay'
export type IslandCallbacks = {
  onNearLandmark: (id: LandmarkId | null) => void
  onVisit: (chapter: LandmarkChapter) => void
  onReady: () => void
  onError: (message: string) => void
  onExplore?: (id: LandmarkId) => void
  onPose?: (pose: IslandPose) => void
  onRoute?: (id: LandmarkId | null) => void
  onObserve?: () => void
  onNearAnimal?: (id: string | null) => void
  onAnimal?: (action: AnimalAction) => void
}
export type IslandController = {
  /** Camera-relative: positive x moves right; positive z moves backwards. */
  setMove: (x: number, z: number) => void
  setRunning: (running: boolean) => void
  setPaused: (paused: boolean) => void
  interactAnimal: (action: AnimalAction) => void
  walkTo: (id: LandmarkId) => boolean
  cancelWalk: () => void
  setDusk: (value: boolean) => void
  lookAround: () => void
  reset: () => void
  dispose: () => void
}
const SPAWN: Point2 = { x: -14, z: 27 }
const FOX_SPAWN: Point2 = { x: -8, z: 23 }
const CAMERA_DISTANCE = 32
const CAMERA_PITCH = 0.22
const idleController: IslandController = {
  setMove() {}, setRunning() {}, setPaused() {}, interactAnimal() {}, walkTo() { return false }, cancelWalk() {}, setDusk() {}, lookAround() {}, reset() {}, dispose() {},
}

export function mountIsland(canvas: HTMLCanvasElement, callbacks: IslandCallbacks): IslandController {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  } catch {
    callbacks.onError('The 3D island is unavailable in this browser. You can still explore the rest of the site.')
    return idleController
  }
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#b8d9ea')
  scene.fog = new THREE.Fog('#b8d9ea', 120, 260)
  const camera = new THREE.PerspectiveCamera(50, 1, 0.12, 900)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  const ambient = new THREE.HemisphereLight('#dbeaff', '#b6bea1', 2.6)
  scene.add(ambient)
  const sunlight = new THREE.DirectionalLight('#fff0d5', 3)
  sunlight.position.set(-55, 100, 55)
  sunlight.castShadow = true
  sunlight.shadow.mapSize.set(2048, 2048)
  sunlight.shadow.camera.left = sunlight.shadow.camera.bottom = -58
  sunlight.shadow.camera.right = sunlight.shadow.camera.top = 58
  sunlight.shadow.camera.near = 1
  sunlight.shadow.camera.far = 250
  sunlight.shadow.normalBias = 0.05
  sunlight.shadow.bias = -0.00015
  scene.add(sunlight, sunlight.target)
  const sunOffset = new THREE.Vector3(-55, 100, 55)
  const shadowTarget = new THREE.Vector3(Infinity, 0, Infinity)
  const art = createIslandArt(scene, () => {
    renderer.shadowMap.needsUpdate = true
    renderOnce()
  })
  const obstacles = art.obstacles
  const walkerActor = createWalker()
  const walker = walkerActor.root
  scene.add(walker)
  const foxActor = createFox()
  const fox = foxActor.root
  scene.add(fox)
  const targetGeometry = new THREE.RingGeometry(0.32, 0.46, 40)
  const targetMaterial = new THREE.MeshBasicMaterial({ color: '#d9bd82', transparent: true, opacity: 0.8, depthWrite: false })
  const targetMarker = new THREE.Mesh(targetGeometry, targetMaterial)
  targetMarker.rotation.x = -Math.PI / 2
  targetMarker.visible = false
  scene.add(targetMarker)
  let position: Point2 = { ...SPAWN }
  const velocity = new THREE.Vector2()
  const externalMove = new THREE.Vector2()
  const keys = new Set<string>()
  let externalRunning = false
  let paused = false
  let disposed = false
  let failed = false
  let ready = false
  let walkerLoaded = false
  let usableSize = false
  let frameId = 0
  let lastFrame: number | undefined
  let elapsed = 0
  let waypoints: Point2[] = []
  let route: LandmarkId | null = null
  let lastPoseTime = -1
  let lastPoseX = Infinity, lastPoseZ = Infinity, lastHeading = Infinity
  let near: LandmarkId | null = null
  let nearAnimal = false
  let foxPosition: Point2 = { ...FOX_SPAWN }
  let foxWaypoints: Point2[] = []
  let animalAction: AnimalAction | 'roam' = 'roam'
  let resumeAnimalAction: 'follow' | 'stay' | 'roam' = 'roam'
  let animalTimer = 3
  let foxSeed = 8309
  let cameraYaw = 0
  let cameraPitch = CAMERA_PITCH
  let cameraDistance = CAMERA_DISTANCE
  const followTarget = new THREE.Vector3(SPAWN.x, walkSurfaceHeight(SPAWN.x, SPAWN.z) + 1.4, SPAWN.z)
  const desiredCamera = new THREE.Vector3()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let drag: { id: number; startX: number; startY: number; x: number; y: number; moved: boolean; button: number } | null = null
  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight'])

  function interactAnimal(action: AnimalAction) {
    if (disposed || failed || paused || !fox.visible || (action !== 'stay' && Math.hypot(position.x - foxPosition.x, position.z - foxPosition.z) > 5)) return
    if (action === 'pet' || action === 'feed') {
      if (animalAction === 'follow' || animalAction === 'stay' || animalAction === 'roam') resumeAnimalAction = animalAction
      animalTimer = 3
      cancelWalk()
      velocity.set(0, 0)
      externalMove.set(0, 0)
      keys.clear()
      walker.rotation.y = Math.atan2(-(foxPosition.x - position.x), -(foxPosition.z - position.z))
      walkerActor.gesture(action)
    } else animalTimer = 0
    animalAction = action
    foxWaypoints = []
    callbacks.onAnimal?.(action)
  }
  function updateFox(dt: number) {
    if (!fox.visible) return
    animalTimer -= dt
    const playerDistance = Math.hypot(position.x - foxPosition.x, position.z - foxPosition.z)
    if ((animalAction === 'pet' || animalAction === 'feed') && animalTimer <= 0) animalAction = resumeAnimalAction
    const automaticMotion = !reducedMotion.matches || animalAction === 'follow'
    if (automaticMotion && animalAction === 'follow') {
      if (playerDistance < 2.1) foxWaypoints = []
      else if (animalTimer <= 0) {
        foxWaypoints = findWalkPath(foxPosition, position, obstacles)
        animalTimer = 1.1
      }
    } else if (automaticMotion && animalAction === 'roam' && animalTimer <= 0 && !foxWaypoints.length) {
      foxSeed = (foxSeed * 1664525 + 1013904223) >>> 0
      const angle = foxSeed / 4294967296 * Math.PI * 2
      const target = findWalkTarget({ x: FOX_SPAWN.x + Math.cos(angle) * 5.2, z: FOX_SPAWN.z + Math.sin(angle) * 5.2 }, obstacles)
      if (target) foxWaypoints = findWalkPath(foxPosition, target, obstacles)
      animalTimer = 7
    }
    if (!automaticMotion || animalAction === 'stay' || animalAction === 'pet' || animalAction === 'feed') foxWaypoints = []
    while (foxWaypoints.length && Math.hypot(foxWaypoints[0].x - foxPosition.x, foxWaypoints[0].z - foxPosition.z) < 0.04) foxWaypoints.shift()
    const nextTarget = foxWaypoints[0]
    const speed = animalAction === 'follow' ? (playerDistance > 8 ? 6 : 3.3) : 1.5
    let travelled = 0
    if (nextTarget) {
      const dx = nextTarget.x - foxPosition.x, dz = nextTarget.z - foxPosition.z, distance = Math.hypot(dx, dz)
      const step = Math.min(speed * dt, distance)
      const next = moveWithCollisions(foxPosition, { x: dx / distance * step, z: dz / distance * step }, obstacles, 0.32)
      travelled = Math.hypot(next.x - foxPosition.x, next.z - foxPosition.z)
      if (travelled > 0.00001) {
        const heading = Math.atan2(-(next.x - foxPosition.x), -(next.z - foxPosition.z))
        fox.rotation.y += Math.atan2(Math.sin(heading - fox.rotation.y), Math.cos(heading - fox.rotation.y)) * (1 - Math.exp(-9 * dt))
        renderer.shadowMap.needsUpdate = true
      }
      foxPosition = next
    } else if (animalAction === 'pet' || animalAction === 'feed') {
      const heading = Math.atan2(-(position.x - foxPosition.x), -(position.z - foxPosition.z))
      fox.rotation.y += Math.atan2(Math.sin(heading - fox.rotation.y), Math.cos(heading - fox.rotation.y)) * (1 - Math.exp(-6 * dt))
    }
    fox.position.set(foxPosition.x, walkSurfaceHeight(foxPosition.x, foxPosition.z), foxPosition.z)
    foxActor.update(reducedMotion.matches && travelled < 0.00001 ? 0 : dt, { moving: travelled > 0.00001, running: speed > 4 && travelled > 0, distance: travelled })
    const nextNear = playerDistance < (nearAnimal ? 4.5 : 3.7)
    if (nextNear !== nearAnimal) { nearAnimal = nextNear; callbacks.onNearAnimal?.(nextNear ? 'fox' : null) }
  }

  function updateNear() {
    let next: LandmarkId | null = null
    let closest = Infinity
    for (const landmark of islandLandmarks) {
      const distance = Math.hypot(position.x - landmark.position.x, position.z - landmark.position.z)
      if (distance < landmark.radius + (near === landmark.id ? 0.5 : 0) && distance < closest) {
        closest = distance
        next = landmark.id
      }
    }
    if (next !== near) { near = next; callbacks.onNearLandmark(next) }
    art.setNear(near)
  }
  function updateCamera(dt: number, immediate = false) {
    const blend = immediate || reducedMotion.matches ? 1 : 1 - Math.exp(-6 * dt)
    followTarget.lerp(new THREE.Vector3(position.x, walkSurfaceHeight(position.x, position.z) + 1.4, position.z), blend)
    desiredCamera.set(Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance, Math.sin(cameraPitch) * cameraDistance, Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance).add(followTarget)
    desiredCamera.y = Math.max(desiredCamera.y, walkSurfaceHeight(desiredCamera.x, desiredCamera.z) + 2)
    camera.position.lerp(desiredCamera, blend)
    camera.lookAt(followTarget)
  }
  function renderOnce() {
    if (disposed || failed || !usableSize) return
    try {
      renderer.render(scene, camera)
      if (!ready && walkerLoaded) { ready = true; callbacks.onReady() }
    } catch {
      failed = true
      stop()
      callbacks.onError('The 3D view was interrupted. Please reopen the island to try again.')
    }
  }
  function stop() {
    if (frameId) cancelAnimationFrame(frameId)
    frameId = 0
    lastFrame = undefined
  }
  function start() {
    if (!frameId && !disposed && !failed && !paused && usableSize && document.visibilityState !== 'hidden') frameId = requestAnimationFrame(frame)
  }
  function frame(now: number) {
    frameId = 0
    if (disposed || failed || paused || !usableSize || document.visibilityState === 'hidden') return
    const interval = coarsePointer || (!waypoints.length && velocity.lengthSq() < 0.01 && !keys.size && externalMove.lengthSq() < 0.01 && !drag) ? 1000 / 30 : 1000 / 60
    if (lastFrame !== undefined && now - lastFrame < interval - 1) { start(); return }
    const dt = lastFrame === undefined ? 1 / 60 : Math.min((now - lastFrame) / 1000, 0.05)
    lastFrame = now
    elapsed += dt
    const inputX = externalMove.x + Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'))
    const inputZ = externalMove.y + Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'))
    let x = inputX
    let z = inputZ
    let waypointDistance = Infinity
    const manual = Math.hypot(x, z) > 0.04
    if (manual) {
      if (waypoints.length || route !== null) cancelWalk()
      const length = Math.max(1, Math.hypot(x, z))
      const rx = x / length
      const rz = z / length
      x = rx * Math.cos(cameraYaw) + rz * Math.sin(cameraYaw)
      z = -rx * Math.sin(cameraYaw) + rz * Math.cos(cameraYaw)
    } else {
      const wasFollowingPath = waypoints.length > 0
      while (waypoints.length && Math.hypot(waypoints[0].x - position.x, waypoints[0].z - position.z) < (waypoints.length === 1 ? 0.15 : 0.0001)) waypoints.shift()
      if (waypoints.length) {
        const dx = waypoints[0].x - position.x
        const dz = waypoints[0].z - position.z
        const length = Math.hypot(dx, dz)
        waypointDistance = length
        const slow = waypoints.length === 1 ? Math.min(1, length / 0.8) : 1
        x = dx / length * slow
        z = dz / length * slow
      } else { x = z = 0; if (wasFollowingPath) cancelWalk() }
    }
    const running = externalRunning || keys.has('ShiftLeft') || keys.has('ShiftRight')
    const speed = running ? 5.7 : 2.4
    const acceleration = 1 - Math.exp(-12 * dt)
    if (!manual && waypoints.length) {
      // Reach each verified path segment before turning; inertia must not cut
      // across the tree/rock corner that the pathfinder deliberately avoided.
      const boundedSpeed = Math.min(speed, waypointDistance / dt)
      velocity.set(x * boundedSpeed, z * boundedSpeed)
    } else velocity.lerp(new THREE.Vector2(x * speed, z * speed), acceleration)
    if (!manual && !waypoints.length && velocity.lengthSq() < 0.005) velocity.set(0, 0)
    const next = moveWithCollisions(position, { x: velocity.x * dt, z: velocity.y * dt }, obstacles)
    const distance = Math.hypot(next.x - position.x, next.z - position.z)
    const moving = distance > 0.0003
    if (moving) {
      const facing = Math.atan2(-(next.x - position.x), -(next.z - position.z))
      walker.rotation.y += Math.atan2(Math.sin(facing - walker.rotation.y), Math.cos(facing - walker.rotation.y)) * (1 - Math.exp(-14 * dt))
      renderer.shadowMap.needsUpdate = true
    }
    position = next
    walker.position.set(position.x, walkSurfaceHeight(position.x, position.z), position.z)
    walkerActor.update(reducedMotion.matches && !moving ? 0 : dt, { moving, running, distance })
    updateFox(dt)
    updateNear()
    updateCamera(dt)
    art.update(elapsed, reducedMotion.matches, camera, followTarget)
    updateSun()
    if (elapsed - lastPoseTime > 0.2 && (Math.hypot(position.x - lastPoseX, position.z - lastPoseZ) > 0.1 || Math.abs(walker.rotation.y - lastHeading) > 0.1)) {
      lastPoseTime = elapsed; emitPose()
    }
    renderOnce()
    start()
  }

  function emitPose() {
    lastPoseX = position.x; lastPoseZ = position.z; lastHeading = walker.rotation.y
    callbacks.onPose?.({ x: position.x, z: position.z, heading: walker.rotation.y })
  }
  function updateSun() {
    // Follow the traveler with a bounded, texel-snapped shadow frustum.
    const step = 116 / 2048
    const x = Math.round(position.x / step) * step, z = Math.round(position.z / step) * step
    const y = walkSurfaceHeight(position.x, position.z)
    if (Math.abs(shadowTarget.x - x) < 0.2 && Math.abs(shadowTarget.z - z) < 0.2 && Math.abs(shadowTarget.y - y) < 0.2) return
    shadowTarget.set(x, y, z)
    sunlight.target.position.copy(shadowTarget)
    sunlight.position.copy(shadowTarget).add(sunOffset)
    renderer.shadowMap.needsUpdate = true
  }
  function cancelWalk() {
    waypoints = []
    velocity.set(0, 0)
    targetMarker.visible = false
    if (route !== null) { route = null; callbacks.onRoute?.(null) }
  }
  function walkTo(id: LandmarkId) {
    if (!ready || paused || failed || disposed) return false
    const target = landmarkById(id).entry
    cancelWalk()
    if (Math.hypot(position.x - target.x, position.z - target.z) < 0.3) return true
    waypoints = findWalkPath(position, target, obstacles)
    if (!waypoints.length) return false
    route = id
    callbacks.onRoute?.(id)
    targetMarker.position.set(target.x, walkSurfaceHeight(target.x, target.z) + 0.09, target.z)
    targetMarker.visible = true
    return true
  }
  function chooseTarget(event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(art.pickSurfaces, false)[0]
    cancelWalk()
    if (!hit) return
    const target = findWalkTarget({ x: hit.point.x, z: hit.point.z }, obstacles)
    if (!target) return
    waypoints = findWalkPath(position, target, obstacles)
    if (waypoints.length) {
      targetMarker.position.set(target.x, walkSurfaceHeight(target.x, target.z) + 0.09, target.z)
      targetMarker.visible = true
    }
  }
  function pointerDown(event: PointerEvent) {
    if (paused || failed || disposed || drag || (event.button !== 0 && event.button !== 2) || event.ctrlKey || event.metaKey) return
    canvas.focus({ preventScroll: true })
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false, button: event.button }
    try { canvas.setPointerCapture(event.pointerId) } catch { /* A cancelled pointer need not support capture. */ }
  }
  function pointerMove(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId || paused) return
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) drag.moved = true
    if (drag.moved) {
      cameraYaw -= (event.clientX - drag.x) * 0.006
      cameraPitch = THREE.MathUtils.clamp(cameraPitch + (event.clientY - drag.y) * 0.004, 0.12, 1.12)
    }
    drag.x = event.clientX
    drag.y = event.clientY
  }
  function pointerUp(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId) return
    const clicked = !drag.moved && drag.button === 0
    drag = null
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    if (clicked && !paused && !disposed) chooseTarget(event)
  }
  const cancelPointer = (event?: PointerEvent) => {
    if (event && event.pointerId !== drag?.id) return
    const id = drag?.id
    drag = null
    if (id !== undefined && canvas.hasPointerCapture(id)) {
      try { canvas.releasePointerCapture(id) } catch { /* The pointer may have ended outside the window. */ }
    }
  }
  const contextMenu = (event: Event) => event.preventDefault()
  function zoom(event: WheelEvent) {
    if (paused || failed || disposed || document.activeElement !== canvas || event.ctrlKey || event.metaKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    event.preventDefault()
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1)
    const previous = cameraDistance
    cameraDistance = THREE.MathUtils.clamp(cameraDistance * Math.exp(THREE.MathUtils.clamp(pixels, -300, 300) * 0.0015), 14, 150)
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + Math.log(cameraDistance / previous) * 0.48, 0.18, 1.12)
  }
  function keyDown(event: KeyboardEvent) {
    if (paused || failed || disposed || document.activeElement !== canvas || event.ctrlKey || event.metaKey || event.altKey) return
    if (movementKeys.has(event.code)) { event.preventDefault(); keys.add(event.code) }
    if (event.code === 'KeyE' && !event.repeat) {
      if (near) {
        event.preventDefault()
        const place = landmarkById(near)
        if (place.kind === 'observatory' && callbacks.onObserve) callbacks.onObserve()
        else if (place.kind === 'discovery' && callbacks.onExplore) callbacks.onExplore(place.id)
        else callbacks.onVisit(place.chapter)
      } else if (nearAnimal) { event.preventDefault(); interactAnimal('pet') }
    }
  }
  const keyUp = (event: KeyboardEvent) => { keys.delete(event.code) }
  const clearKeys = () => { keys.clear(); if (externalMove.lengthSq() < 0.001) velocity.set(0, 0) }
  function loseWindowFocus() { keys.clear(); externalMove.set(0, 0); velocity.set(0, 0); cancelPointer() }
  function visibility() {
    if (document.visibilityState === 'hidden') { loseWindowFocus(); stop() }
    else start()
  }
  function contextLost(event: Event) {
    event.preventDefault()
    if (disposed || failed) return
    failed = true
    stop()
    callbacks.onError('The 3D view was interrupted. Please reopen the island to try again.')
  }
  function resize() {
    if (disposed) return
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    usableSize = width > 0 && height > 0
    if (!usableSize) { stop(); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderOnce()
    start()
  }
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
  const motionChange = () => { updateCamera(0, true); renderOnce() }
  canvas.addEventListener('pointerdown', pointerDown)
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerup', pointerUp)
  canvas.addEventListener('pointercancel', cancelPointer)
  canvas.addEventListener('lostpointercapture', cancelPointer)
  canvas.addEventListener('contextmenu', contextMenu)
  canvas.addEventListener('wheel', zoom, { passive: false })
  canvas.addEventListener('blur', clearKeys)
  canvas.addEventListener('webglcontextlost', contextLost)
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  window.addEventListener('blur', loseWindowFocus)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', visibility)
  reducedMotion.addEventListener('change', motionChange)
  observer?.observe(canvas)

  function reset() {
    if (disposed || failed) return
    cancelPointer()
    keys.clear()
    externalMove.set(0, 0)
    velocity.set(0, 0)
    externalRunning = false
    cancelWalk()
    position = { ...SPAWN }
    walker.position.set(position.x, walkSurfaceHeight(position.x, position.z), position.z)
    walker.rotation.y = 0
    walkerActor.update(0, { moving: false, running: false, distance: 0 })
    foxPosition = { ...FOX_SPAWN }
    fox.position.set(foxPosition.x, walkSurfaceHeight(foxPosition.x, foxPosition.z), foxPosition.z)
    fox.rotation.y = -0.4
    foxWaypoints = []
    animalAction = 'roam'
    animalTimer = 3
    foxActor.update(0, { moving: false, running: false, distance: 0 })
    nearAnimal = false
    callbacks.onNearAnimal?.(null)
    cameraYaw = 0
    cameraPitch = CAMERA_PITCH
    cameraDistance = CAMERA_DISTANCE
    updateCamera(0, true)
    updateSun()
    emitPose()
    updateNear()
    renderer.shadowMap.needsUpdate = true
    renderOnce()
  }
  reset()
  resize()
  void Promise.all([walkerActor.ready, art.ready]).then(results => {
    if (disposed || failed) return
    if (!results.every(Boolean)) {
      failed = true
      stop()
      callbacks.onError('The island assets could not be loaded. Please reopen the island to try again.')
      return
    }
    walkerLoaded = true
    renderer.shadowMap.needsUpdate = true
    renderOnce()
  })

  return {
    setMove(x, z) {
      if (disposed) return
      externalMove.set(Number.isFinite(x) ? THREE.MathUtils.clamp(x, -1, 1) : 0, Number.isFinite(z) ? THREE.MathUtils.clamp(z, -1, 1) : 0)
    },
    setRunning(value) { if (!disposed) externalRunning = value },
    setPaused(value) {
      if (disposed) return
      paused = value
      if (value) { keys.clear(); externalMove.set(0, 0); velocity.set(0, 0); cancelPointer(); stop(); renderOnce() }
      else start()
    },
    interactAnimal,
    walkTo,
    cancelWalk,
    lookAround() {
      if (disposed || failed) return
      const wide = cameraDistance < 80
      cameraDistance = wide ? 145 : CAMERA_DISTANCE
      cameraPitch = wide ? 0.82 : CAMERA_PITCH
      updateCamera(0, true)
      art.update(elapsed, reducedMotion.matches, camera, followTarget)
      renderOnce()
    },
    setDusk(value) {
      if (disposed || failed) return
      ambient.color.set(value ? '#c2c7e4' : '#dbeaff')
      ambient.groundColor.set(value ? '#777665' : '#b6bea1')
      ambient.intensity = value ? 1.2 : 2.6
      sunlight.color.set(value ? '#ffd0a0' : '#fff0d5')
      sunlight.intensity = value ? 2.1 : 3
      sunOffset.set(value ? -110 : -55, value ? 32 : 100, value ? 65 : 55)
      scene.fog!.color.set(value ? '#a89a9e' : '#b8d9ea')
      art.setDusk(value)
      shadowTarget.x = Infinity
      updateSun()
      renderOnce()
    },
    reset,
    dispose() {
      if (disposed) return
      disposed = true
      stop()
      cancelPointer()
      observer?.disconnect()
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', cancelPointer)
      canvas.removeEventListener('lostpointercapture', cancelPointer)
      canvas.removeEventListener('contextmenu', contextMenu)
      canvas.removeEventListener('wheel', zoom)
      canvas.removeEventListener('blur', clearKeys)
      canvas.removeEventListener('webglcontextlost', contextLost)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', loseWindowFocus)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      reducedMotion.removeEventListener('change', motionChange)
      art.dispose()
      walkerActor.dispose()
      foxActor.dispose()
      targetGeometry.dispose()
      targetMaterial.dispose()
      sunlight.shadow.dispose()
      renderer.dispose()
      scene.clear()
      keys.clear()
      waypoints = []
      callbacks.onNearLandmark(null)
      callbacks.onNearAnimal?.(null)
    },
  }
}
