import * as THREE from 'three'
import { PALACE_CENTER, PALACE_TERRACE_HEIGHT } from '../layout.ts'
import { terrainHeight, walkSurfaceHeight } from '../movement.ts'
import type { CircleObstacle } from '../movement.ts'
import { addRod } from './resources.ts'
import type { ArtResources } from './resources.ts'

/** A double-eaved hip roof. Its eave and corner lift are part of the surface,
 * rather than flat boxes rotated to suggest a roof. */
export function roofShape(width: number, depth: number, rise: number, lift: number) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = []
  const nx = 56, nz = 36
  const halfW = width / 2, halfD = depth / 2, ridgeHalf = halfW - halfD * 0.8
  const height = (x: number, z: number) => {
    const q = Math.min(1, Math.max(Math.abs(z) / halfD, (Math.abs(x) - ridgeHalf) / (halfW - ridgeHalf)))
    const corner = Math.abs(x / halfW * z / halfD)
    return rise * (1 - q) ** 1.75 + lift * q ** 5 + lift * 0.8 * corner ** 6 + 0.035 * Math.cos(x * Math.PI * 3.3) * q
  }
  for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
    const x = (ix / nx - 0.5) * width, z = (iz / nz - 0.5) * depth
    positions.push(x, height(x, z), z)
    uvs.push(ix / nx * 7, iz / nz * 4)
    if (ix < nx && iz < nz) {
      const a = iz * (nx + 1) + ix
      indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return { geometry, height, ridgeHalf }
}

export function createPalace(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[]) {
  const group = new THREE.Group()
  group.position.set(PALACE_CENTER.x, PALACE_TERRACE_HEIGHT, PALACE_CENTER.z)
  parent.add(group)
  const box = resources.geometry(new THREE.BoxGeometry(1, 1, 1))
  const columnShape = resources.geometry(new THREE.CylinderGeometry(1, 1.06, 1, 20))
  const stone = resources.batch(box, resources.pbr('stone', '#d1d0c5', 2), group)
  const stoneTrim = resources.batch(box, resources.pbr('stone', '#b6b3a2', 2), group)
  const vermilion = resources.batch(box, resources.paint('#853b32', 0.65), group)
  const gold = resources.batch(box, resources.paint('#bf9c58', 0.55, 0.22), group)
  const darkWood = resources.batch(box, resources.pbr('wood', '#9a8a77', 2), group)
  const columns = resources.batch(columnShape, resources.paint('#974a3b', 0.58), group)
  const bases = resources.batch(columnShape, resources.paint('#a6a99e'), group)
  const bookPages = resources.batch(box, resources.paint('#e0d9be'), group, false)
  const bookCovers = resources.batch(box, resources.paint('#ffffff'), group, false)
  const scrolls = resources.batch(columnShape, resources.paint('#d9d2b3'), group, false)
  const rafters = resources.batch(columnShape, resources.pbr('wood', '#a58b6a'), group)

  const floorY = -0.1
  // A broad, tiered stone stylobate supports an open hall and a surrounding walk.
  stone.add([0, -1.22, 3], [40, 2.3, 30])
  stoneTrim.add([0, -0.22, 3], [40.7, 0.28, 30])
  stoneTrim.add([0, floorY, 0], [29, 0.18, 19])
  for (let index = 0; index < 10; index++) {
    const z = 24.65 - index * 0.7
    const globalZ = PALACE_CENTER.z + z
    const top = walkSurfaceHeight(PALACE_CENTER.x, globalZ) - PALACE_TERRACE_HEIGHT
    const thickness = Math.max(0.18, top + PALACE_TERRACE_HEIGHT - terrainHeight(PALACE_CENTER.x, globalZ) + 0.12)
    stone.add([0, top - thickness / 2, z], [14, thickness, 0.7])
  }
  // Flagstones are shallow and batched; the walking height stays continuous.
  for (let x = -18; x <= 18; x += 3) for (let z = -11; z <= 15; z += 3) {
    stoneTrim.add([x, 0.005, z], [2.93, 0.035, 2.93])
  }
  // White stone balustrades leave the full-width southern stair entrance open.
  function railing(x: number, z: number, alongX: boolean, length: number) {
    for (let index = 0; index <= Math.round(length / 2); index++) {
      const p = -length / 2 + index * length / Math.round(length / 2)
      const px = x + (alongX ? p : 0), pz = z + (alongX ? 0 : p)
      stoneTrim.add([px, 0.75, pz], [0.3, 1.45, 0.3])
      stoneTrim.add([px, 1.52, pz], [0.43, 0.16, 0.43])
      if (index) stone.add([px - (alongX ? 1 : 0), 0.75, pz - (alongX ? 0 : 1)], alongX ? [1.7, 0.68, 0.16] : [0.16, 0.68, 1.7])
    }
    stoneTrim.add([x, 1.26, z], alongX ? [length, 0.13, 0.23] : [0.23, 0.13, length])
  }
  railing(0, -12, true, 40)
  railing(-20, 3, false, 30)
  railing(20, 3, false, 30)
  railing(-13.5, 18, true, 13)
  railing(13.5, 18, true, 13)
  // Main hall columns, stone plinths and interlocking bracket clusters.
  for (const x of [-12, -8, -4, 0, 4, 8, 12]) for (const z of [-7.4, 7.4]) {
    columns.add([x, 3.45, z], [0.29, 6.8, 0.29])
    bases.add([x, 0.24, z], [0.55, 0.46, 0.55])
    gold.add([x, 6.5, z], [0.72, 0.16, 0.72])
    for (let tier = 0; tier < 3; tier++) {
      const spread = 0.6 + tier * 0.32
      vermilion.add([x, 6.65 + tier * 0.21, z], [spread * 2, 0.16, 0.24])
      gold.add([x, 6.76 + tier * 0.21, z], [0.22, 0.13, spread * 2])
    }
    obstacles.push({ x: PALACE_CENTER.x + x, z: PALACE_CENTER.z + z, radius: 0.42 })
  }
  for (const z of [-7.4, 7.4]) {
    vermilion.add([0, 6.15, z], [27, 0.55, 0.36])
    gold.add([0, 6.48, z], [27.5, 0.12, 0.43])
  }
  for (const x of [-12, 12]) vermilion.add([x, 6.15, 0], [0.4, 0.55, 15])
  // Rear screen and side lattices frame an enterable interior, not a sealed box.
  darkWood.add([0, 2.9, -7.5], [26, 5.7, 0.22])
  for (let x = -11.5; x <= 11.5; x += 0.65) {
    gold.add([x, 3.2, -7.32], [0.055, 4.3, 0.08])
    obstacles.push({ x: PALACE_CENTER.x + x, z: PALACE_CENTER.z - 7.5, radius: 0.34 })
  }
  for (let y = 1.2; y <= 5.5; y += 0.55) gold.add([0, y, -7.3], [25.1, 0.055, 0.08])
  const roofPaint = resources.pbr('roof', '#b3c7c9', 2)
  roofPaint.side = THREE.DoubleSide
  const edgePaint = resources.paint('#8e9c93', 0.68, 0.12)
  for (const [width, depth, base, rise, lift] of [[34, 23, 7.1, 3.5, 0.8], [27, 17.5, 10.7, 2.8, 0.65]]) {
    const roof = roofShape(width, depth, rise, lift)
    const object = resources.mesh(resources.geometry(roof.geometry), roofPaint, group)
    object.position.y = base
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 48 }, (_, index) => {
        const x = (index / 47 - 0.5) * width, z = side * depth / 2
        return new THREE.Vector3(x, base + roof.height(x, z) - 0.01, z)
      })
      resources.mesh(resources.geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.11, 6, false)), edgePaint, group)
    }
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 30 }, (_, index) => {
        const x = side * width / 2, z = (index / 29 - 0.5) * depth
        return new THREE.Vector3(x, base + roof.height(x, z), z)
      })
      resources.mesh(resources.geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 30, 0.11, 6, false)), edgePaint, group)
    }
    const ridgePoints = [new THREE.Vector3(-roof.ridgeHalf - 0.8, base + rise + 0.8, 0), new THREE.Vector3(-roof.ridgeHalf, base + rise + 0.15, 0), new THREE.Vector3(0, base + rise + 0.1, 0), new THREE.Vector3(roof.ridgeHalf, base + rise + 0.15, 0), new THREE.Vector3(roof.ridgeHalf + 0.8, base + rise + 0.8, 0)]
    resources.mesh(resources.geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ridgePoints), 32, 0.16, 8, false)), resources.paint('#c2ac75', 0.6, 0.3), group)
  }
  // Interior lectern and warm ceiling beams make approaching the hall worthwhile.
  darkWood.add([0, 0.8, -3], [6.5, 1.5, 1.2])
  gold.add([0, 1.63, -3], [6.7, 0.13, 1.35])
  for (let x = -3; x <= 3; x += 0.6) obstacles.push({ x: PALACE_CENTER.x + x, z: PALACE_CENTER.z - 3, radius: 0.64 })
  for (const x of [-8, 0, 8]) darkWood.add([x, 6.4, 0], [0.38, 0.35, 15])
  // Four open archive cases contain individually sized, cloth-bound volumes.
  // They share two instance sets instead of one draw call per book.
  const bindings = ['#3d5051', '#5c5747', '#734e40', '#3d4c64', '#766749']
  for (const [caseIndex, x] of [-9, -4.5, 4.5, 9].entries()) {
    const z = -6.75, width = 3.7
    for (const side of [-1, 1]) darkWood.add([x + side * width / 2, 2.1, z], [0.13, 4.15, 0.7])
    darkWood.add([x, 2.1, z - 0.35], [width, 4.15, 0.07])
    for (let shelf = 0; shelf <= 5; shelf++) {
      const y = 0.2 + shelf * 0.76
      darkWood.add([x, y, z], [width + 0.16, 0.1, 0.74])
      if (shelf === 5) continue
      for (let book = 0; book < 20; book++) {
        const height = 0.55 + (book + shelf * 3 + caseIndex) % 4 * 0.04
        const px = x + (book - 9.5) * 0.17
        const binding = bindings[(book + shelf + caseIndex) % bindings.length]
        bookCovers.add([px, y + 0.06 + height / 2, z + 0.225], [0.135, height, 0.03], [0, 0, 0], binding)
        for (const edge of [0, height]) bookCovers.add([px, y + 0.06 + edge, z], [0.135, 0.025, 0.46], [0, 0, 0], binding)
        bookPages.add([px, y + 0.06 + height / 2, z], [0.105, height - 0.035, 0.415])
        gold.add([px, y + 0.06 + height * 0.75, z + 0.246], [0.075, 0.025, 0.012])
      }
    }
    for (let dx = -width / 2; dx <= width / 2; dx += 0.4) obstacles.push({ x: PALACE_CENTER.x + x + dx, z: PALACE_CENTER.z + z, radius: 0.45 })
  }
  // An open folio and scrolls sit on the lectern, with slender inkstone and
  // brush geometry. Their placement does not add another floor collision.
  for (const side of [-1, 1]) bookPages.add([side * 0.55, 1.74, -3], [1.04, 0.065, 0.76], [0, 0, side * -0.07])
  for (const x of [-2.6, 2.6]) scrolls.add([x, 1.8, -3], [0.11, 0.78, 0.11], [Math.PI / 2, 0, 0])
  darkWood.add([1.7, 1.78, -3.2], [0.38, 0.15, 0.25])
  gold.add([1.6, 1.78, -2.72], [0.7, 0.035, 0.035], [0, 0.12, 0])
  // Sloping rafters and tie beams remain visible from within the hall.
  for (const x of [-10, -5, 0, 5, 10]) {
    for (const side of [-1, 1]) addRod(rafters, new THREE.Vector3(x, 6.65, side * 6.3), new THREE.Vector3(x, 8.8, 0), 0.11)
    darkWood.add([x, 6.65, 0], [0.2, 0.23, 12.6])
    darkWood.add([x, 7.75, 0], [0.17, 2.2, 0.17])
  }
  for (const batch of [stone, stoneTrim, vermilion, gold, darkWood, columns, bases, bookPages, bookCovers, scrolls, rafters]) batch.finish()
  const walkSurface = resources.mesh(resources.geometry(new THREE.PlaneGeometry(40, 30)), resources.material(new THREE.MeshBasicMaterial({ visible: false })), group, false)
  walkSurface.rotation.x = -Math.PI / 2
  walkSurface.position.set(0, 0.03, 3)
  const stairPositions: number[] = [], stairIndices: number[] = []
  for (let index = 0; index <= 20; index++) {
    const z = 18 + index / 20 * 7
    for (const x of [-7, 7]) stairPositions.push(x, walkSurfaceHeight(PALACE_CENTER.x + x, PALACE_CENTER.z + z) - PALACE_TERRACE_HEIGHT + 0.01, z)
    if (index) { const a = (index - 1) * 2; stairIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) }
  }
  const stairsGeometry = resources.geometry(new THREE.BufferGeometry())
  stairsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stairPositions, 3))
  stairsGeometry.setIndex(stairIndices)
  const stairsSurface = resources.mesh(stairsGeometry, resources.material(new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })), group, false)
  return { group, pickSurfaces: [walkSurface, stairsSurface] }
}
