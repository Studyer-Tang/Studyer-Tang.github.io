import * as THREE from 'three'
import { islandRadiusAt, terrainHeight, walkSurfaceHeight } from '../movement.ts'
import type { CircleObstacle, Point2 } from '../movement.ts'
import { DOCK_HEIGHT, LAKE_BRIDGE, LAKE_CENTER, LAKE_PAVILION, LAKE_RADII, LAKE_WATER_HEIGHT } from '../layout.ts'
import type { ArtResources } from './resources.ts'
import { addRod } from './resources.ts'
import { roofShape } from './palace.ts'
import { islandTrails } from '../trails.ts'

const TAU = Math.PI * 2

export function samplePath(points: [number, number][]) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
  const length = curve.getLength()
  return curve.getSpacedPoints(Math.max(12, Math.ceil(length / 0.8))).map(p => ({ x: p.x, z: p.z }))
}

// The loops meet at shared junctions. Every landmark has a real approach;
// the lake route enters its pavilion through the eastern ramp, not a side rail.
export const islandPaths = islandTrails.map(samplePath)

function segmentDistanceSquared(x: number, z: number, a: Point2, b: Point2) {
  const dx = b.x - a.x, dz = b.z - a.z
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
  return (x - a.x - t * dx) ** 2 + (z - a.z - t * dz) ** 2
}

export function nearPath(x: number, z: number, clearance: number) {
  const limit = clearance ** 2
  return islandPaths.some(path => path.some((point, index) => index > 0 && segmentDistanceSquared(x, z, path[index - 1], point) < limit))
}

function ribbon(points: Point2[], width: number, resources: ArtResources, surface: THREE.Material, parent: THREE.Object3D, heightOffset = 0.045, height = walkSurfaceHeight, crossSegments = 1) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = []
  let distance = 0
  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)], next = points[Math.min(points.length - 1, index + 1)]
    if (index) distance += Math.hypot(point.x - previous.x, point.z - previous.z)
    const length = Math.hypot(next.x - previous.x, next.z - previous.z) || 1
    const nx = -(next.z - previous.z) / length * width * 0.5, nz = (next.x - previous.x) / length * width * 0.5
    for (let side = 0; side <= crossSegments; side++) {
      const sign = 1 - side / crossSegments * 2
      const x = point.x + nx * sign, z = point.z + nz * sign
      positions.push(x, height(x, z) + heightOffset, z)
      uv.push(side / crossSegments, distance / 3)
    }
    if (index) for (let side = 0; side < crossSegments; side++) {
      const a = (index - 1) * (crossSegments + 1) + side, b = a + crossSegments + 1
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  })
  const shape = resources.geometry(new THREE.BufferGeometry())
  shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  shape.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  shape.setIndex(indices)
  shape.computeVertexNormals()
  return resources.mesh(shape, surface, parent, false)
}

function createLakeBridge(parent: THREE.Object3D, resources: ArtResources) {
  const length = LAKE_PAVILION.minX - LAKE_BRIDGE.minX, steps = Math.ceil(length / 0.18)
  const points = Array.from({ length: steps + 1 }, (_, index) => ({ x: LAKE_BRIDGE.minX + length * index / steps, z: LAKE_CENTER.z }))
  const deck = ribbon(points, LAKE_BRIDGE.maxZ - LAKE_BRIDGE.minZ, resources, resources.pbr('wood', '#d1c3a5'), parent, 0, walkSurfaceHeight, 8)
  const beams = resources.batch(resources.geometry(new THREE.CylinderGeometry(1, 1, 1, 10)), resources.pbr('wood', '#a99b7d'), parent)
  const posts: { x: number; z: number }[] = []
  for (const z of [LAKE_BRIDGE.minZ, LAKE_BRIDGE.maxZ]) {
    for (let x = LAKE_BRIDGE.minX; x < LAKE_PAVILION.minX; x += 3) posts.push({ x, z })
    posts.push({ x: LAKE_PAVILION.minX, z })
    const side = posts.filter(post => post.z === z)
    for (const post of side) {
      const y = walkSurfaceHeight(post.x, z)
      beams.add([post.x, y + 0.6, z], [0.075, 1.2, 0.075])
      if (post.x > LAKE_BRIDGE.minX + 5) beams.add([post.x, (y + LAKE_WATER_HEIGHT) / 2 - 0.3, z], [0.16, y - LAKE_WATER_HEIGHT + 0.6, 0.16])
    }
    for (let index = 1; index < side.length; index++) {
      const a = side[index - 1], b = side[index]
      for (const rise of [0.5, 1.16]) addRod(beams, new THREE.Vector3(a.x, walkSurfaceHeight(a.x, z) + rise, z), new THREE.Vector3(b.x, walkSurfaceHeight(b.x, z) + rise, z), 0.055)
      addRod(beams, new THREE.Vector3(a.x, walkSurfaceHeight(a.x, z) - 0.18, z), new THREE.Vector3(b.x, walkSurfaceHeight(b.x, z) - 0.18, z), 0.13)
    }
  }
  beams.finish()
  return deck
}

export function createLandscape(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[]) {
  const positions = [0, terrainHeight(0, 0), 0], colors: number[] = [], uv = [0, 0], indices: number[] = []
  const grass = new THREE.Color('#9bc8ba'), sand = new THREE.Color('#e1d6b8'), granite = new THREE.Color('#b5c8b6')
  colors.push(grass.r, grass.g, grass.b)
  const segments = 240, rings = 104
  for (let ring = 1; ring <= rings; ring++) for (let index = 0; index < segments; index++) {
    const q = ring / rings * 1.055, theta = index / segments * TAU
    const r = islandRadiusAt(theta) * q, x = Math.cos(theta) * r, z = Math.sin(theta) * r
    const shore = THREE.MathUtils.smoothstep(q, 0.91, 1.055)
    const y = terrainHeight(x, z) - shore * 2.5
    positions.push(x, y, z)
    uv.push(x / 7, z / 7)
    const color = grass.clone().lerp(sand, THREE.MathUtils.smoothstep(q, 0.87, 0.99)).lerp(granite, THREE.MathUtils.smoothstep(y, 18, 34) * 0.32)
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
  const pathMaterial = resources.pbr('stone', '#c4c3af')
  const paths = islandPaths.map((path, index) => ribbon(path, index === 1 ? 5.2 : 3.15, resources, pathMaterial, parent, 0.055 + index * 0.001))
  paths.push(ribbon(samplePath([[-14, 15], [-14, 21], [-14, 29]]), 18, resources, resources.pbr('stone', '#cec9b5', 2), parent, 0.07))
  const bridge = createLakeBridge(parent, resources)
  const waterMaterial = resources.material(new THREE.MeshPhysicalMaterial({ color: '#447f87', roughness: 0.24, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 0.8 }))
  const waterShape = resources.geometry(new THREE.PlaneGeometry(860, 860, 48, 48))
  waterShape.rotateX(-Math.PI / 2)
  const water = resources.mesh(waterShape, waterMaterial, parent, false)
  water.position.y = 0.13
  water.receiveShadow = false
  const waterVertices = waterShape.getAttribute('position') as THREE.BufferAttribute
  const lakeShape = resources.geometry(new THREE.CircleGeometry(1, 128))
  lakeShape.rotateX(-Math.PI / 2)
  const lake = resources.mesh(lakeShape, resources.material(new THREE.MeshPhysicalMaterial({ color: '#5d9b8a', roughness: 0.18, metalness: 0.1, clearcoat: 1, envMapIntensity: 0.9 })), parent, false)
  lake.scale.set(LAKE_RADII.x, 1, LAKE_RADII.z)
  lake.position.set(LAKE_CENTER.x, LAKE_WATER_HEIGHT, LAKE_CENTER.z)
  // Broken stone banks and small gravel shelves make the water meet actual
  // depressed terrain; they do not become an impassable decorative ring.
  const rocks = resources.batch(resources.geometry(new THREE.IcosahedronGeometry(1, 2)), resources.pbr('stone', '#89988b'), parent, false)
  for (let index = 0; index < 46; index++) {
    const angle = index / 46 * TAU
    const x = LAKE_CENTER.x + Math.cos(angle) * (LAKE_RADII.x + 0.5), z = LAKE_CENTER.z + Math.sin(angle) * (LAKE_RADII.z + 0.5)
    if (Math.abs(z - LAKE_CENTER.z) < 3.5 || (x > -77 && z > -41 && z < -25)) continue
    const size = 0.5 + (index % 5) * 0.11
    rocks.add([x, terrainHeight(x, z) + 0.05, z], [size * 1.5, size * 0.65, size], [index * 0.1, angle, index * 0.17])
    obstacles.push({ x, z, radius: size * 0.75 })
  }
  // Low, rounded outcrops give the broad northern slopes a sense of scale.
  for (const [x, z, size] of [[-82, -102, 3.5], [-65, -119, 4], [-7, -118, 3], [40, -76, 2.7], [-140, -27, 2.2], [-123, 43, 2.1], [-73, 106, 1.9]]) {
    if (nearPath(x, z, size + 2.4)) continue
    rocks.add([x, terrainHeight(x, z) + size * 0.18, z], [size * 1.35, size * 0.75, size], [0.2, x, 0.08])
    obstacles.push({ x, z, radius: size * 1.15 })
  }
  rocks.finish()
  return {
    terrain, pickSurfaces: [terrain, ...paths, bridge],
    update(elapsed: number, reduced: boolean) {
      if (reduced) return
      for (let index = 0; index < waterVertices.count; index++) {
        waterVertices.setY(index, Math.sin(waterVertices.getX(index) * 0.12 + elapsed * 0.55) * 0.075 + Math.cos(waterVertices.getZ(index) * 0.16 - elapsed * 0.4) * 0.055)
      }
      waterVertices.needsUpdate = true
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
