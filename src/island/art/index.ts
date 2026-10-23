import * as THREE from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { Sky } from 'three/addons/objects/Sky.js'
import { createArtResources, addRod } from './resources.ts'
import { createPalace } from './palace.ts'
import { createAcademy } from './academy.ts'
import { createLandscape, createDock } from './landscape.ts'
import { createVegetation } from './vegetation.ts'
import { terrainHeight, walkSurfaceHeight } from '../movement.ts'
import { islandLandmarks, landmarkById } from '../landmarks.ts'
import type { CircleObstacle } from '../movement.ts'
import type { LandmarkId } from '../landmarks.ts'

export function createIslandArt(scene: THREE.Scene, onChange: () => void) {
  const resources = createArtResources(onChange)
  const group = new THREE.Group()
  scene.add(group)
  const sky = new Sky()
  sky.scale.setScalar(1000)
  sky.material.uniforms.turbidity.value = 1.5
  sky.material.uniforms.rayleigh.value = 3
  sky.material.uniforms.mieCoefficient.value = 0.001
  sky.material.uniforms.mieDirectionalG.value = 0.8
  sky.material.uniforms.cloudCoverage.value = 0.2
  sky.material.uniforms.cloudDensity.value = 0.22
  sky.material.uniforms.cloudScale.value = 0.00075
  sky.material.uniforms.cloudElevation.value = 0.35
  sky.material.uniforms.sunPosition.value.set(-55, 100, 55)
  resources.geometry(sky.geometry)
  resources.material(sky.material)
  group.add(sky)
  const obstacles: CircleObstacle[] = []
  let disposed = false
  const landscape = createLandscape(group, resources, obstacles)
  const palace = createPalace(group, resources, obstacles)
  const dock = createDock(group, resources, obstacles)
  const academy = createAcademy(group, resources, obstacles)
  const vegetation = createVegetation(group, resources, obstacles, onChange)
  const box = resources.geometry(new THREE.BoxGeometry(1, 1, 1))
  const cylinder = resources.geometry(new THREE.CylinderGeometry(1, 1, 1, 20))
  const metal = resources.paint('#a6b3ae', 0.3, 0.65)
  const brass = resources.paint('#b8a06b', 0.35, 0.65)
  // A hillside observatory, with an equatorial mount, counterweight and an
  // armillary instrument, is deliberately distinct from the palace silhouette.
  const observatory = new THREE.Group()
  const peak = landmarkById('research').position
  observatory.position.set(peak.x, terrainHeight(peak.x, peak.z), peak.z)
  group.add(observatory)
  const platform = resources.mesh(resources.geometry(new THREE.CylinderGeometry(6, 6.4, 0.25, 64)), resources.pbr('stone', '#c7c6b6', 3), observatory)
  platform.position.y = -0.125
  const rails = resources.batch(cylinder, metal, observatory)
  for (let index = 0; index < 25; index++) {
    const angle = Math.PI * 0.6 + index / 24 * Math.PI * 1.8
    const x = Math.cos(angle) * 5.6, z = Math.sin(angle) * 5.6
    rails.add([x, 0.68, z], [0.055, 1.2, 0.055])
    obstacles.push({ x: peak.x + x, z: peak.z + z, radius: 0.08 })
  }
  const railCurve = new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, index) => {
    const angle = Math.PI * 0.6 + index / 39 * Math.PI * 1.8
    return new THREE.Vector3(Math.cos(angle) * 5.6, 1.27, Math.sin(angle) * 5.6)
  }))
  resources.mesh(resources.geometry(new THREE.TubeGeometry(railCurve, 64, 0.055, 6, false)), metal, observatory)
  const telescope = new THREE.Group()
  telescope.position.set(0, 2.2, 0)
  telescope.rotation.set(0.7, -0.4, 0)
  observatory.add(telescope)
  const barrel = resources.mesh(cylinder, resources.paint('#d4dad3', 0.35, 0.5), telescope)
  barrel.rotation.x = Math.PI / 2
  barrel.scale.set(0.44, 3.8, 0.44)
  const hood = resources.mesh(cylinder, metal, telescope)
  hood.rotation.x = Math.PI / 2
  hood.position.z = -2
  hood.scale.set(0.49, 0.6, 0.49)
  const lens = resources.mesh(resources.geometry(new THREE.CircleGeometry(0.41, 32)), resources.material(new THREE.MeshPhysicalMaterial({ color: '#244c65', metalness: 0.6, roughness: 0.06, clearcoat: 1 })), telescope)
  lens.rotation.y = Math.PI
  lens.position.z = -2.31
  const supports = resources.batch(cylinder, metal, observatory)
  for (let index = 0; index < 3; index++) {
    const angle = index / 3 * Math.PI * 2
    addRod(supports, new THREE.Vector3(Math.cos(angle) * 1.4, 0.15, Math.sin(angle) * 1.4), new THREE.Vector3(0, 1.8, 0), 0.1)
  }
  supports.finish()
  rails.finish()
  obstacles.push({ ...peak, radius: 1.65 })
  const armillary = new THREE.Group()
  armillary.position.set(3, 1.5, -1.8)
  observatory.add(armillary)
  for (const rotation of [[0, 0, 0], [Math.PI / 2, 0, 0], [0.6, 0.3, 0.3]]) {
    const ring = resources.mesh(resources.geometry(new THREE.TorusGeometry(0.8, 0.025, 8, 48)), brass, armillary)
    ring.rotation.set(...rotation as [number, number, number])
  }
  const pedestal = resources.mesh(cylinder, resources.pbr('stone', '#c8c7b9'), observatory)
  pedestal.position.set(3, 0.55, -1.8)
  pedestal.scale.set(0.35, 1.1, 0.35)
  obstacles.push({ x: peak.x + 3, z: peak.z - 1.8, radius: 0.65 })
  // A quiet tea bench sits among the woodland, with a stone board and seats.
  const grove = new THREE.Group()
  const retreat = landmarkById('interests').position
  grove.position.set(retreat.x, terrainHeight(retreat.x, retreat.z), retreat.z)
  group.add(grove)
  const wood = resources.batch(box, resources.pbr('wood', '#baa68b'), grove)
  wood.add([0, 0.7, 0], [3.5, 0.16, 0.8])
  wood.add([0, 1.15, 0.35], [3.5, 0.65, 0.12])
  for (const x of [-1.2, 1.2]) wood.add([x, 0.35, 0], [0.16, 0.7, 0.7])
  wood.finish()
  const table = resources.mesh(resources.geometry(new THREE.CylinderGeometry(0.95, 0.7, 0.55, 32)), resources.pbr('stone', '#c9c6b1'), grove)
  table.position.set(0, 0.27, -2.3)
  obstacles.push({ ...retreat, radius: 1.75 }, { x: retreat.x, z: retreat.z - 2.3, radius: 1.1 })
  const markers = new Map<LandmarkId, THREE.MeshStandardMaterial>()
  let dusk = false, nearest: LandmarkId | null = null
  for (const place of islandLandmarks) {
    const { id } = place
    const x = place.entry.x + 2.2, z = place.entry.z + 1.5
    const paint = resources.material(new THREE.MeshStandardMaterial({ color: '#d8bf84', roughness: 0.45, metalness: 0.25, emissive: '#bd965b', emissiveIntensity: 0.1 }))
    const lantern = resources.mesh(resources.geometry(new THREE.CylinderGeometry(0.22, 0.27, 0.6, 12)), paint, group)
    lantern.position.set(x, walkSurfaceHeight(x, z) + 1.2, z)
    const post = resources.mesh(cylinder, resources.paint('#5d6154'), group)
    post.position.set(x, lantern.position.y - 0.6, z)
    post.scale.set(0.07, 1, 0.07)
    obstacles.push({ x, z, radius: 0.17 })
    markers.set(id, paint)
  }
  const environment = new HDRLoader().load('/world-assets/coast-environment.hdr', value => {
    if (disposed) { value.dispose(); return }
    value.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = value
    scene.environmentIntensity = 0.4
    onChange()
  }, undefined, () => {})
  resources.texture(environment)
  return {
    ready: Promise.all([resources.whenReady(), vegetation.ready]).then(results => results.every(Boolean)),
    obstacles,
    pickSurfaces: [...landscape.pickSurfaces, ...palace.pickSurfaces, ...dock.pickSurfaces, ...academy.pickSurfaces, platform],
    setNear(id: LandmarkId | null) {
      nearest = id
      for (const [key, paint] of markers) paint.emissiveIntensity = key === id ? 0.85 : dusk ? 0.5 : 0.1
    },
    setDusk(value: boolean) {
      dusk = value
      sky.material.uniforms.sunPosition.value.set(...(dusk ? [-110, 32, 65] : [-55, 100, 55]))
      sky.material.uniforms.rayleigh.value = dusk ? 2.2 : 3
      sky.material.uniforms.cloudCoverage.value = dusk ? 0.28 : 0.2
      for (const [key, paint] of markers) paint.emissiveIntensity = key === nearest ? 0.85 : dusk ? 0.5 : 0.1
      academy.setDusk?.(dusk)
      onChange()
    },
    update(elapsed: number, reduced: boolean, camera: THREE.Camera, focus: THREE.Vector3) {
      landscape.update(elapsed, reduced)
      vegetation.update(camera, focus)
    },
    dispose() {
      disposed = true
      vegetation.dispose()
      scene.background = null
      scene.environment = null
      resources.dispose()
      group.removeFromParent()
    },
  }
}
