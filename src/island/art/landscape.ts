import * as THREE from 'three'
import { islandRadiusAt, terrainHeight, walkSurfaceHeight } from '../movement.ts'
import type { CircleObstacle, Point2 } from '../movement.ts'
import { DOCK_HEIGHT } from '../layout.ts'
import type { ArtResources } from './resources.ts'
import { roofShape } from './palace.ts'

export const woodlandPool = { x: -41, z: -17, radius: 6.2 }
const TAU = Math.PI * 2

export function samplePath(points: [number, number][]) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
  return curve.getPoints(100).map(p => ({ x: p.x, z: p.z }))
}

export const islandPaths = [
  samplePath([[45, 14], [35, 20], [19, 27], [4, 25], [-7, 21], [-14, 15]]),
  samplePath([[3, 25], [-14, 30], [-32, 26], [-39, 16], [-37, 4], [-31, -3]]),
  samplePath([[35, 20], [40, 5], [41, -11], [34, -22], [30, -26]]),
]

export function nearPath(x: number, z: number, clearance: number) {
  return islandPaths.some(path => path.some(point => Math.hypot(x - point.x, z - point.z) < clearance))
}

function ribbon(points: Point2[], width: number, resources: ArtResources, surface: THREE.Material, parent: THREE.Object3D, heightOffset = 0.045) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = []
  let distance = 0
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)], next = points[Math.min(points.length - 1, index + 1)]
    if (index) distance += Math.hypot(point.x - previous.x, point.z - previous.z)
    const length = Math.hypot(next.x - previous.x, next.z - previous.z) || 1
    const nx = -(next.z - previous.z) / length * width * 0.5, nz = (next.x - previous.x) / length * width * 0.5
    for (const sign of [1, -1]) {
      const x = point.x + nx * sign, z = point.z + nz * sign
      positions.push(x, walkSurfaceHeight(x, z) + heightOffset, z)
      uv.push(sign === 1 ? 0 : 1, distance / 3)
    }
    if (index) { const a = (index - 1) * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) }
  })
  const shape = resources.geometry(new THREE.BufferGeometry())
  shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  shape.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  shape.setIndex(indices)
  shape.computeVertexNormals()
  return resources.mesh(shape, surface, parent, false)
}

export function createLandscape(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[]) {
  const positions = [0, terrainHeight(0, 0), 0], colors: number[] = [], uv = [0, 0], indices: number[] = []
  const grass = new THREE.Color('#f0f2df'), sand = new THREE.Color('#e1d6b8')
  colors.push(grass.r, grass.g, grass.b)
  const segments = 144, rings = 46
  for (let ring = 1; ring <= rings; ring++) for (let index = 0; index < segments; index++) {
    const q = ring / rings * 1.055, theta = index / segments * TAU
    const r = islandRadiusAt(theta) * q, x = Math.cos(theta) * r, z = Math.sin(theta) * r
    const shore = THREE.MathUtils.smoothstep(q, 0.87, 1.055)
    const poolDistance = Math.hypot(x - woodlandPool.x, z - woodlandPool.z)
    const poolDepth = 1.2 * (1 - THREE.MathUtils.smoothstep(poolDistance, 3, 6.7))
    positions.push(x, terrainHeight(x, z) - shore * 2.5 - poolDepth, z)
    uv.push(x / 7, z / 7)
    const color = grass.clone().lerp(sand, THREE.MathUtils.smoothstep(q, 0.81, 0.99))
    color.multiplyScalar(0.96 + 0.04 * Math.sin(x * 0.23) * Math.cos(z * 0.27))
    colors.push(color.r, color.g, color.b)
    if (ring === 1) indices.push(0, 1 + (index + 1) % segments, 1 + index)
    else {
      const a = 1 + (ring - 2) * segments + index, b = 1 + (ring - 2) * segments + (index + 1) % segments
      indices.push(a, b, a + segments, b, b + segments, a + segments)
    }
  }
  const shape = resources.geometry(new THREE.BufferGeometry())
  shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  shape.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  shape.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  shape.setIndex(indices)
  shape.computeVertexNormals()
  const ground = resources.pbr('ground')
  ground.vertexColors = true
  ground.normalScale.set(0.35, 0.35)
  const terrain = resources.mesh(shape, ground, parent, false)
  const paths = islandPaths.map((path, index) => ribbon(path, 3.1, resources, resources.pbr('stone', '#b1b1a5'), parent, 0.045 + index * 0.003))
  paths.push(ribbon(samplePath([[-14, 15], [-14, 21], [-14, 28]]), 18, resources, resources.pbr('stone', '#c8c4b1', 2), parent, 0.065))
  const waterShape = resources.geometry(new THREE.PlaneGeometry(650, 650, 56, 56))
  waterShape.rotateX(-Math.PI / 2)
  const water = resources.mesh(waterShape, resources.material(new THREE.MeshPhysicalMaterial({ color: '#376d77', roughness: 0.19, metalness: 0.16, clearcoat: 1, clearcoatRoughness: 0.16, envMapIntensity: 1.3 })), parent, false)
  water.position.y = 0.13
  water.receiveShadow = false
  const waterVertices = waterShape.getAttribute('position') as THREE.BufferAttribute
  const poolHeight = terrainHeight(woodlandPool.x, woodlandPool.z) - 0.65
  const pool = resources.mesh(resources.geometry(new THREE.CircleGeometry(6.2, 64)), resources.material(new THREE.MeshPhysicalMaterial({ color: '#528b85', roughness: 0.15, metalness: 0.1, clearcoat: 1 })), parent, false)
  pool.rotation.x = -Math.PI / 2
  pool.position.set(woodlandPool.x, poolHeight, woodlandPool.z)
  obstacles.push({ ...woodlandPool, radius: 7.1 })
  // Dark, rounded granite encloses the source. The fall is a thin translucent
  // sheet, not a luminous beam; a little texture movement supplies its flow.
  const rocks = resources.batch(resources.geometry(new THREE.IcosahedronGeometry(1, 2)), resources.pbr('stone', '#858c82'), parent)
  for (let index = 0; index < 11; index++) {
    const angle = index / 10 * Math.PI + Math.PI
    const x = woodlandPool.x + Math.cos(angle) * 6.1, z = woodlandPool.z + Math.sin(angle) * 6.1
    rocks.add([x, terrainHeight(x, z) + 0.7, z], [1.4 + index % 3 * 0.5, 2 + index % 2, 1.4], [index * 0.13, angle, 0.2])
  }
  rocks.finish()
  const fall = resources.mesh(resources.geometry(new THREE.PlaneGeometry(1.55, 3.5, 3, 12)), resources.material(new THREE.MeshPhysicalMaterial({ color: '#b3d3cd', transparent: true, opacity: 0.42, roughness: 0.16, side: THREE.DoubleSide, depthWrite: false })), parent, false)
  fall.position.set(woodlandPool.x, poolHeight + 1.6, woodlandPool.z - 4.5)
  return {
    terrain, pickSurfaces: [terrain, ...paths],
    update(elapsed: number, reduced: boolean) {
      if (reduced) return
      for (let index = 0; index < waterVertices.count; index++) {
        waterVertices.setY(index, Math.sin(waterVertices.getX(index) * 0.12 + elapsed * 0.55) * 0.075 + Math.cos(waterVertices.getZ(index) * 0.16 - elapsed * 0.4) * 0.055)
      }
      waterVertices.needsUpdate = true
      fall.material.opacity = 0.38 + Math.sin(elapsed * 4) * 0.045
    },
  }
}

export function createDock(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[]) {
  const group = new THREE.Group()
  parent.add(group)
  const box = resources.geometry(new THREE.BoxGeometry(1, 1, 1))
  const cylinder = resources.geometry(new THREE.CylinderGeometry(1, 1.12, 1, 16))
  const boards = resources.batch(box, resources.pbr('wood', '#c9b898', 2), group)
  const rails = resources.batch(box, resources.pbr('wood', '#b8ae94'), group)
  const piles = resources.batch(cylinder, resources.pbr('bark', '#a39a83'), group)
  const stone = resources.batch(cylinder, resources.pbr('stone', '#c2c0b0'), group)
  for (let x = 43.3; x < 84; x += 0.65) {
    boards.add([x, walkSurfaceHeight(x, 14) - 0.14, 14], [0.6, 0.28, 8])
  }
  for (let z = 3.35; z < 25; z += 0.65) boards.add([93, DOCK_HEIGHT - 0.14, z], [18, 0.28, 0.6])
  for (let x = 45; x <= 100; x += 5) for (const z of [10, 18]) {
    const y = walkSurfaceHeight(x, 14)
    piles.add([x, y / 2 - 1, z], [0.42, y + 2, 0.42])
    if (x < 84) {
      rails.add([x, y + 0.68, z], [0.18, 1.36, 0.18])
      rails.add([x + 2.5, y + 1.24, z], [5, 0.15, 0.16])
      rails.add([x + 2.5, y + 0.62, z], [5, 0.1, 0.12])
    }
  }
  for (const z of [3, 25]) for (let x = 84; x <= 102; x += 3) {
    rails.add([x, DOCK_HEIGHT + 0.7, z], [0.2, 1.4, 0.2])
    if (x < 102) rails.add([x + 1.5, DOCK_HEIGHT + 1.3, z], [3, 0.16, 0.18])
    piles.add([x, 0.5, z], [0.48, 4.5, 0.48])
  }
  for (let z = 3; z <= 25; z += 2.75) {
    rails.add([102, DOCK_HEIGHT + 0.7, z], [0.2, 1.4, 0.2])
    if (z < 25) rails.add([102, DOCK_HEIGHT + 1.3, z + 1.37], [0.18, 0.16, 2.75])
  }
  for (const z of [3, 6.5, 10, 18, 21.5, 25]) rails.add([84, DOCK_HEIGHT + 0.7, z], [0.2, 1.4, 0.2])
  for (const z of [6.5, 21.5]) rails.add([84, DOCK_HEIGHT + 1.3, z], [0.18, 0.16, 7])
  // A high, open-sided waterside pavilion shelters the viewing platform.
  for (const x of [87.5, 98.5]) for (const z of [6.5, 21.5]) {
    piles.add([x, DOCK_HEIGHT + 3.8, z], [0.28, 7.6, 0.28])
    stone.add([x, DOCK_HEIGHT + 0.24, z], [0.52, 0.48, 0.52])
    obstacles.push({ x, z, radius: 0.42 })
  }
  const roof = roofShape(16.5, 21, 3.4, 0.7)
  const roofMesh = resources.mesh(resources.geometry(roof.geometry), resources.pbr('roof', '#c6d0ca', 2), group)
  roofMesh.material.side = THREE.DoubleSide
  roofMesh.position.set(93, DOCK_HEIGHT + 7.3, 14)
  const trim = resources.batch(box, resources.paint('#a35c43', 0.6), group)
  for (const z of [6.5, 21.5]) trim.add([93, DOCK_HEIGHT + 7, z], [12, 0.35, 0.4])
  for (const x of [87.5, 98.5]) trim.add([x, DOCK_HEIGHT + 7, 14], [0.4, 0.35, 15])
  for (const batch of [boards, rails, piles, stone, trim]) batch.finish()
  const pickMaterial = resources.material(new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }))
  const surfaces: THREE.Mesh[] = []
  for (const [minX, maxX, minZ, maxZ] of [[43, 50, 10, 18], [50, 94, 10, 18], [84, 102, 3, 25]]) {
    const shape = resources.geometry(new THREE.BufferGeometry())
    const positions: number[] = [], indices: number[] = []
    const subdivisions = minX === 43 ? 20 : 1
    for (let index = 0; index <= subdivisions; index++) {
      const x = minX + (maxX - minX) * index / subdivisions
      for (const z of [minZ, maxZ]) positions.push(x, walkSurfaceHeight(x, z), z)
      if (index) { const a = (index - 1) * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    }
    shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    shape.setIndex(indices)
    surfaces.push(resources.mesh(shape, pickMaterial, group, false))
  }
  return { group, pickSurfaces: surfaces }
}
