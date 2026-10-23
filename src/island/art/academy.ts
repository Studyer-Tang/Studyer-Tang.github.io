import * as THREE from 'three'
import { landmarkById } from '../landmarks.ts'
import type { LandmarkId } from '../landmarks.ts'
import { terrainHeight, walkSurfaceHeight } from '../movement.ts'
import type { CircleObstacle } from '../movement.ts'
import { roofShape } from './palace.ts'
import { LAKE_PAVILION } from '../layout.ts'
import type { ArtResources } from './resources.ts'

type Pair = readonly [number, number]
type Batch = ReturnType<ArtResources['batch']>
type PlaceId = Extract<LandmarkId, 'gate' | 'lake' | 'history' | 'studio' | 'ridge'>

/** Open courtyards and covered galleries use one shared material/instance set.
 * Only real columns, furnishings and wall segments are collision obstacles. */
export function createAcademy(parent: THREE.Object3D, resources: ArtResources, obstacles: CircleObstacle[]) {
  const group = new THREE.Group()
  group.name = 'academy-districts'
  parent.add(group)
  const box = resources.geometry(new THREE.BoxGeometry(1, 1, 1))
  const cylinder = resources.geometry(new THREE.CylinderGeometry(1, 1.04, 1, 12))
  const sphere = resources.geometry(new THREE.SphereGeometry(1, 12, 8))
  const stonePaint = resources.pbr('stone', '#c7c6b6', 2)
  const pavingPaint = resources.pbr('stone', '#c7c6b6', 2)
  pavingPaint.polygonOffset = true
  pavingPaint.polygonOffsetFactor = -2
  pavingPaint.polygonOffsetUnits = -2
  const woodPaint = resources.pbr('wood', '#b9a48b', 2)
  const roofPaint = resources.pbr('roof', '#afbbb1', 1.5)
  roofPaint.side = THREE.DoubleSide
  const rimPaint = resources.paint('#777d70', 0.8)
  const lampPaint = resources.material(new THREE.MeshStandardMaterial({ color: '#e9cea0', roughness: 0.78, emissive: '#ffb45e', emissiveIntensity: 0.07 }))
  const windowPaint = resources.material(new THREE.MeshStandardMaterial({ color: '#dbd4b2', roughness: 0.9, emissive: '#ffbc6c', emissiveIntensity: 0.015 }))
  const stone = resources.batch(box, stonePaint, group)
  const trim = resources.batch(box, resources.paint('#e0dfd0'), group)
  const plaster = resources.batch(box, resources.paint('#e1deca'), group)
  const red = resources.batch(box, resources.paint('#7c4133', 0.72), group)
  const wood = resources.batch(box, woodPaint, group)
  const black = resources.batch(box, resources.paint('#353d37'), group)
  const gold = resources.batch(box, resources.paint('#b9995e', 0.65, 0.15), group, false)
  const paper = resources.batch(box, resources.paint('#d9d4b9'), group, false)
  const covers = resources.batch(box, resources.paint('#ffffff'), group, false)
  const columns = resources.batch(cylinder, resources.paint('#81503d', 0.72), group)
  const bases = resources.batch(cylinder, stonePaint, group)
  const lamps = resources.batch(cylinder, lampPaint, group, false)
  const windows = resources.batch(box, windowPaint, group, false)
  const finials = resources.batch(sphere, resources.paint('#a39066'), group, false)
  const pickSurfaces: THREE.Object3D[] = []
  const invisible = resources.material(new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }))
  const bookColors = ['#42565c', '#344844', '#7b4f3c', '#837452', '#39455b', '#85654e']
  const obstacleStart = obstacles.length
  const structures: { id: PlaceId; group: THREE.Group }[] = []

  function site(id: PlaceId) {
    const { position } = landmarkById(id)
    const origin = { ...position, y: walkSurfaceHeight(position.x, position.z) }
    const building = new THREE.Group()
    building.name = id
    group.add(building)
    structures.push({ id, group: building })
    const ground = (x: number, z: number) => walkSurfaceHeight(origin.x + x, origin.z + z)
    const add = (batch: Batch, p: [number, number, number], s: [number, number, number], rotation: [number, number, number] = [0, 0, 0], color?: string) => batch.add([origin.x + p[0], origin.y + p[1], origin.z + p[2]], s, rotation, color)
    const block = (x: number, z: number, radius: number) => obstacles.push({ x: origin.x + x, z: origin.z + z, radius })
    function column(x: number, z: number, top = 4.4, radius = 0.18) {
      const foot = ground(x, z) - origin.y
      add(columns, [x, (top + foot) / 2, z], [radius, top - foot, radius])
      add(bases, [x, foot + 0.12, z], [radius * 1.8, 0.24, radius * 1.8])
      add(red, [x, top - 0.1, z], [0.68, 0.14, 0.5])
      add(gold, [x, top + 0.04, z], [0.48, 0.12, 0.8])
      block(x, z, radius + 0.08)
    }
    function floor(cx: number, cz: number, width: number, depth: number, timber = false, circle = false, grid = 1) {
      // A continuous ground-following mesh avoids flat paving slabs cutting
      // through rolling grass. Only the level timber deck uses separate boards.
      const nx = Math.ceil(width / grid), nz = Math.ceil(depth / grid), vertices: number[] = [], uv: number[] = [], indices: number[] = []
      for (let iz = 0; iz <= nz; iz++) for (let ix = 0; ix <= nx; ix++) {
        const x = cx + (ix / nx - 0.5) * width, z = cz + (iz / nz - 0.5) * depth
        vertices.push(origin.x + x, ground(x, z) + (timber ? 0.012 : 0.025), origin.z + z)
        uv.push(x / 4, z / 4)
      }
      for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
        const x = cx + ((ix + 0.5) / nx - 0.5) * width, z = cz + ((iz + 0.5) / nz - 0.5) * depth
        if (circle && Math.hypot((x - cx) / (width / 2), (z - cz) / (depth / 2)) > 0.98) continue
        const y = ground(x, z) - origin.y
        if (timber) add(wood, [x, y - 0.065, z], [width / nx - 0.025, 0.13, depth / nz - 0.025])
        const a = iz * (nx + 1) + ix
        indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2)
      }
      const shape = resources.geometry(new THREE.BufferGeometry())
      shape.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      shape.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
      shape.setIndex(indices)
      shape.computeVertexNormals()
      const surface = resources.mesh(shape, timber ? invisible : pavingPaint, building, false)
      surface.name = `${id}-ground`
      pickSurfaces.push(surface)
    }
    function roof(cx: number, cz: number, width: number, depth: number, base: number, rise = 1.7, rotation = 0) {
      const shape = roofShape(width, depth, rise, 0.42)
      const roofGroup = new THREE.Group()
      roofGroup.name = `${id}-curved-roof`
      roofGroup.position.set(origin.x + cx, origin.y + base, origin.z + cz)
      roofGroup.rotation.y = rotation
      building.add(roofGroup)
      resources.mesh(resources.geometry(shape.geometry), roofPaint, roofGroup)
      for (const side of [-1, 1]) {
        const points = Array.from({ length: 25 }, (_, i) => {
          const x = (i / 24 - 0.5) * width, z = side * depth / 2
          return new THREE.Vector3(x, shape.height(x, z), z)
        })
        resources.mesh(resources.geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.075, 5, false)), rimPaint, roofGroup, false)
      }
      for (const side of [-1, 1]) {
        const points = Array.from({ length: 19 }, (_, i) => {
          const x = side * width / 2, z = (i / 18 - 0.5) * depth
          return new THREE.Vector3(x, shape.height(x, z), z)
        })
        resources.mesh(resources.geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.075, 5, false)), rimPaint, roofGroup, false)
      }
      const ridge = resources.mesh(resources.geometry(new THREE.BoxGeometry(shape.ridgeHalf * 2, 0.15, 0.19)), rimPaint, roofGroup, false)
      ridge.position.y = rise + 0.08
      // Five small ridge ornaments create a recognisable silhouette without
      // importing ornamental models or generating hundreds of separate meshes.
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
        const x = side * (shape.ridgeHalf - 0.35 + i * 0.28)
        const world = new THREE.Vector3(x, rise + 0.22 + i * 0.13, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation)
        add(finials, [cx + world.x, base + world.y, cz + world.z], [0.12 - i * 0.015, 0.18 + i * 0.03, 0.09])
      }
    }
    function beam(x: number, z: number, width: number, depth: number, height = 4.25) {
      add(red, [x, height, z], [width, 0.28, depth])
      add(gold, [x, height - 0.21, z], [width, 0.055, depth + 0.035])
    }
    function lattice(x: number, z: number, width: number, height: number, acrossX = true, filled = false) {
      const foot = ground(x, z) - origin.y
      if (filled) add(windows, [x, foot + height / 2 + 0.9, z], acrossX ? [width, height, 0.055] : [0.055, height, width])
      for (let i = 0; i <= Math.ceil(width / 0.45); i++) {
        const p = -width / 2 + i / Math.ceil(width / 0.45) * width
        add(wood, [x + (acrossX ? p : 0), foot + height / 2 + 0.9, z + (acrossX ? 0 : p)], acrossX ? [0.06, height + 0.12, 0.1] : [0.1, height + 0.12, 0.06])
      }
      for (let y = 0; y <= height; y += height / 4) add(wood, [x, foot + y + 0.9, z], acrossX ? [width + 0.12, 0.07, 0.12] : [0.12, 0.07, width + 0.12])
    }
    function wall(x: number, z: number, width: number, height: number, acrossX = true) {
      const count = Math.ceil(width / 0.5)
      for (let i = 0; i <= count; i++) {
        const p = -width / 2 + i / count * width
        const px = x + (acrossX ? p : 0), pz = z + (acrossX ? 0 : p)
        const foot = ground(px, pz) - origin.y
        add(plaster, [px, foot + height / 2, pz], acrossX ? [width / count + 0.015, height, 0.25] : [0.25, height, width / count + 0.015])
        add(black, [px, foot + height + 0.07, pz], acrossX ? [width / count + 0.025, 0.13, 0.4] : [0.4, 0.13, width / count + 0.025])
        block(px, pz, 0.2)
      }
    }
    function lantern(x: number, z: number, y = 3.25) {
      add(lamps, [x, y, z], [0.26, 0.64, 0.26])
      add(black, [x, y + 0.38, z], [0.62, 0.13, 0.62])
      add(black, [x, y - 0.38, z], [0.5, 0.1, 0.5])
      add(gold, [x, y - 0.56, z], [0.025, 0.24, 0.025])
      add(black, [x, y + 0.66, z], [0.025, 0.45, 0.025])
    }
    function desk(x: number, z: number, width = 3.2, depth = 1.2) {
      const foot = ground(x, z) - origin.y
      add(wood, [x, foot + 0.9, z], [width, 0.13, depth])
      add(black, [x, foot + 0.79, z], [width - 0.12, 0.12, depth - 0.08])
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) add(wood, [x + dx * (width / 2 - 0.16), foot + 0.43, z + dz * (depth / 2 - 0.15)], [0.13, 0.86, 0.13])
      for (let dx = -width / 2 + 0.3; dx <= width / 2 - 0.3; dx += 0.45) block(x + dx, z, depth / 2 + 0.05)
      return foot + 0.98
    }
    function bench(x: number, z: number, width = 3, rotation = 0) {
      const foot = ground(x, z) - origin.y
      add(wood, [x, foot + 0.46, z], [width, 0.13, 0.62], [0, rotation, 0])
      for (const side of [-1, 1]) {
        const dx = side * (width / 2 - 0.22) * Math.cos(rotation), dz = -side * (width / 2 - 0.22) * Math.sin(rotation)
        add(black, [x + dx, foot + 0.22, z + dz], [0.16, 0.44, 0.5], [0, rotation, 0])
      }
      for (let i = -width / 2 + 0.25; i <= width / 2 - 0.25; i += 0.5) block(x + Math.cos(rotation) * i, z - Math.sin(rotation) * i, 0.36)
    }
    function books(x: number, y: number, z: number, count: number, spacing = 0.15) {
      for (let index = 0; index < count; index++) {
        const height = 0.54 + (index * 7 % 6) * 0.035
        const px = x + (index - (count - 1) / 2) * spacing
        const binding = bookColors[index % bookColors.length]
        add(covers, [px, y + height / 2, z + 0.215], [0.13, height, 0.03], [0, 0, 0], binding)
        for (const edge of [0, height]) add(covers, [px, y + edge, z], [0.13, 0.025, 0.43], [0, 0, 0], binding)
        add(paper, [px, y + height / 2, z], [0.105, height - 0.035, 0.39])
        add(gold, [px, y + height * 0.72, z + 0.234], [0.075, 0.025, 0.01])
      }
    }
    function bookcase(x: number, z: number, width = 3.6) {
      const foot = ground(x, z) - origin.y
      for (const dx of [-width / 2, width / 2]) add(wood, [x + dx, foot + 1.7, z], [0.12, 3.4, 0.62])
      add(black, [x, foot + 1.65, z - 0.31], [width, 3.3, 0.065])
      for (let shelf = 0; shelf < 5; shelf++) {
        const y = foot + 0.2 + shelf * 0.73
        add(wood, [x, y, z], [width + 0.16, 0.105, 0.66])
        if (shelf < 4) books(x, y + 0.06, z, Math.floor(width / 0.18), 0.17)
      }
      for (let dx = -width / 2 + 0.2; dx <= width / 2; dx += 0.45) block(x + dx, z, 0.39)
    }
    function plaque(text: string, x: number, y: number, z: number, width = 4, facing = 0) {
      add(black, [x, y, z], [width, 0.95, 0.17], [0, facing, 0])
      if (typeof document === 'undefined') return
      const canvas = document.createElement('canvas')
      canvas.width = 768
      canvas.height = 192
      const context = canvas.getContext('2d')
      if (!context) return
      context.fillStyle = '#d5ba75'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = '600 110px "Field Serif SC", "Songti SC", serif'
      context.fillText(text, canvas.width / 2, 101, 700)
      const texture = resources.texture(new THREE.CanvasTexture(canvas))
      texture.colorSpace = THREE.SRGBColorSpace
      const label = resources.mesh(resources.geometry(new THREE.PlaneGeometry(width * 0.9, 0.8)), resources.material(new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })), building, false)
      label.position.set(origin.x + x + Math.sin(facing) * 0.091, origin.y + y, origin.z + z + Math.cos(facing) * 0.091)
      label.rotation.y = facing
    }
    return { origin, ground, add, block, column, floor, roof, beam, lattice, wall, lantern, desk, bench, books, bookcase, plaque }
  }

  // A three-bay gate with lower side halls frames a broad, unobstructed axis.
  {
    const s = site('gate')
    s.floor(0, -2, 27, 18)
    for (const x of [-5.2, 5.2]) for (const z of [-2.2, 2.2]) s.column(x, z, 5.1, 0.24)
    for (const z of [-2.2, 2.2]) s.beam(0, z, 11.3, 0.3, 4.85)
    s.roof(0, 0, 16, 8, 5.2, 2.15)
    s.roof(0, 0, 10.5, 5.7, 7.3, 1.25)
    for (const side of [-1, 1]) {
      const x = side * 10.3
      for (const dx of [-2.7, 2.7]) for (const z of [-1.8, 1.8]) s.column(x + dx, z, 3.65, 0.17)
      s.roof(x, 0, 8.4, 6.6, 3.8, 1.3)
      s.wall(x, 0, 4.7, 0.9)
      s.lattice(x, 0, 4.7, 2.1)
      s.wall(side * 13.1, -5.5, 7.5, 1.6, false)
      s.lantern(side * 4.9, -2.35, 3.55)
      s.lantern(side * 4.9, 2.35, 3.55)
      s.add(stone, [side * 7.3, 0.95, -6.2], [1.25, 1.9, 0.6])
      s.add(black, [side * 7.3, 1.95, -6.2], [1.45, 0.2, 0.85])
      s.block(side * 7.3, -6.2, 0.8)
    }
    s.plaque('松风山门', 0, 4.3, -2.37, 5.1, Math.PI)
    s.plaque('松风山门', 0, 4.3, 2.37, 5.1)
  }

  // The lake gallery has a clear four-metre central passage connecting the
  // bridge to the shore. Furniture stays against the north side of the hall.
  {
    const s = site('lake')
    s.floor(0, 0, LAKE_PAVILION.maxX - LAKE_PAVILION.minX, LAKE_PAVILION.maxZ - LAKE_PAVILION.minZ, true)
    s.floor(9.5, 0, 5, 4, true, false, 0.25)
    for (const x of [-6, 0, 6]) for (const z of [-5.3, 5.3]) s.column(x, z, 4.8, 0.2)
    for (const z of [-5.3, 5.3]) s.beam(0, z, 13, 0.3, 4.55)
    for (const x of [-6, 6]) s.beam(x, 0, 0.3, 11, 4.55)
    s.roof(0, 0, 18, 15, 4.9, 2.3)
    s.roof(0, 0, 11.4, 9.3, 7.3, 1.55)
    for (const side of [-1, 1]) {
      for (const x of [-6, 0, 6]) {
        const foot = terrainHeight(s.origin.x + x, s.origin.z + side * 5.3) - s.origin.y
        s.add(columns, [x, (foot - 0.12) / 2, side * 5.3], [0.24, Math.max(0.2, -0.12 - foot), 0.24])
      }
      s.lantern(side * 4.6, -5, 3.4)
      s.bench(side * 5.8, -3.7, 3.1, Math.PI / 2)
      s.lattice(side * 3.4, -5.3, 3.7, 2.3)
    }
    // Guard the deck edges while leaving the bridge and east ramp open.
    for (const side of [-1, 1]) {
      for (let x = -7; x <= 7; x += 1.75) {
        s.add(wood, [x, 0.55, side * 6], [0.13, 1.1, 0.13])
        s.block(x, side * 6, 0.17)
      }
      s.add(wood, [0, 1.0, side * 6], [14, 0.13, 0.13])
      s.add(wood, [0, 0.42, side * 6], [14, 0.09, 0.11])
      for (const end of [-1, 1]) {
        s.add(wood, [side * 7, 1.0, end * 4.2], [0.13, 0.13, 3.6])
        for (let z = 2.4; z <= 6; z += 0.6) s.block(side * 7, end * z, 0.18)
      }
    }
    const y = s.desk(0, -4.4, 4.2, 0.95)
    s.add(paper, [0, y + 0.015, -4.35], [1.8, 0.03, 0.55])
    s.add(black, [0.7, y + 0.1, -4.45], [0.27, 0.16, 0.18])
    s.plaque('镜湖水榭', 0, 4.05, 5.43, 4.2)
  }

  // A U-shaped cloister encloses a court while keeping its southern entrance
  // and both interior aisles open. Upright tablets and shelves reward a visit.
  {
    const s = site('history')
    s.floor(0, 0, 25, 19)
    s.roof(0, -6, 26, 8.6, 4.45, 1.85)
    for (const z of [-8.5, -3.5]) for (const x of [-10.5, -7, -3.5, 0, 3.5, 7, 10.5]) s.column(x, z, 4.35)
    for (const z of [-8.5, -3.5]) s.beam(0, z, 22.2, 0.28)
    s.wall(0, -8.8, 23, 3.45)
    for (const side of [-1, 1]) {
      const x = side * 10.5
      s.roof(x, 2.3, 13.6, 6.4, 3.65, 1.15, Math.PI / 2)
      for (const dx of [-1.9, 1.9]) for (const z of [-2, 2.5, 6.6]) s.column(x + dx, z, 3.5, 0.15)
      s.beam(x, 2.3, 0.26, 11.6, 3.35)
      s.wall(side * 12.5, 2.4, 9.8, 0.85, false)
      s.lattice(side * 12.5, 2.4, 9.8, 1.8, false)
      s.bench(side * 6, 2.1, 3.2, Math.PI / 2)
      s.lantern(side * 8.4, 6.4, 2.7)
    }
    for (const [index, x] of [-7.5, -3.7, 0, 3.7, 7.5].entries()) {
      const foot = s.ground(x, -7.8) - s.origin.y
      s.add(stone, [x, foot + 0.18, -7.8], [1.8, 0.36, 0.9])
      s.add(stone, [x, foot + 1.75, -7.8], [1.28, 2.85 + index % 2 * 0.12, 0.3])
      s.add(trim, [x, foot + 3.21, -7.8], [1.38, 0.12, 0.43])
      for (let line = 0; line < 5; line++) s.add(black, [x, foot + 2.6 - line * 0.31, -7.63], [0.58 - line % 2 * 0.12, 0.045, 0.015])
      s.block(x, -7.8, 0.8)
    }
    s.bookcase(-7.5, -4.3, 3.4)
    s.bookcase(7.5, -4.3, 3.4)
    s.plaque('古籍碑廊', 0, 3.65, -3.32, 4.6)
  }

  // A scholar's courtyard: open-front study, covered side walk, paper windows,
  // full shelves and writing tables, with a wide approach from the north-east.
  {
    const s = site('studio')
    s.floor(0, 1, 25, 20)
    s.roof(0, 3, 22, 14, 4.8, 2.1)
    for (const z of [-1.5, 7.5]) for (const x of [-8.4, -4.2, 0, 4.2, 8.4]) s.column(x, z, 4.6, 0.2)
    for (const z of [-1.5, 7.5]) s.beam(0, z, 18, 0.3, 4.4)
    s.wall(0, 8, 18.5, 3.7)
    for (const side of [-1, 1]) {
      s.wall(side * 9.2, 3.1, 9.5, 0.85, false)
      s.lattice(side * 9.2, 3.1, 9.5, 2.65, false, true)
      s.bookcase(side * 5.9, 7.45, 4.1)
      const y = s.desk(side * 4.5, 2.1, 4.3, 1.55)
      s.add(paper, [side * 4.5, y + 0.02, 2.1], [1.6, 0.035, 0.9])
      s.add(black, [side * 4.5 + 0.85, y + 0.11, 2.0], [0.4, 0.18, 0.22])
      s.add(wood, [side * 4.5 - 0.9, y + 0.05, 2.0], [0.04, 0.04, 0.75], [0, 0.2, 0])
      s.bench(side * 4.5, 3.9, 2.8)
      s.lantern(side * 6.2, -1.6, 3.35)
    }
    s.bookcase(0, 7.45, 4)
    s.roof(-10.9, -5, 9.5, 5.4, 3.4, 1.1, Math.PI / 2)
    for (const x of [-12.3, -9.5]) for (const z of [-8.3, -5, -1.7]) s.column(x, z, 3.25, 0.14)
    s.beam(-10.9, -5, 0.25, 8.2, 3.1)
    s.wall(-12.5, -5, 7.3, 1.3, false)
    s.plaque('溪畔书斋', 0, 3.95, -1.69, 4.6, Math.PI)
    // Two long, low benches line the courtyard without blocking its diagonal
    // entrance. The raised objects are collidable; the court itself is open.
    s.bench(-5.7, -6.5, 4.3)
    s.bench(6.7, -4.3, 2.5, Math.PI / 2)
  }

  // An open ridge pavilion has a low octagonal terrace and a stone viewing
  // balustrade. The entire southern sector stays open to the climbing path.
  {
    const s = site('ridge')
    s.floor(0, 0, 20, 18, false, true)
    for (const x of [-4.6, 4.6]) for (const z of [-5.7, 1.4]) s.column(x, z, 4.3, 0.19)
    for (const z of [-5.7, 1.4]) s.beam(0, z, 10, 0.28, 4.1)
    s.roof(0, -2.2, 14.5, 12, 4.45, 2.2)
    s.roof(0, -2.2, 8.8, 7.4, 6.7, 1.4)
    for (const side of [-1, 1]) {
      s.bench(side * 4.35, -2.15, 4.2, Math.PI / 2)
      s.lantern(side * 4.3, 1.1, 3.1)
    }
    const points: Pair[] = []
    for (let index = 0; index <= 20; index++) {
      const angle = Math.PI * 0.83 + index / 20 * Math.PI * 1.34
      const x = Math.cos(angle) * 8.7, z = Math.sin(angle) * 7.6
      const y = s.ground(x, z) - s.origin.y
      s.add(stone, [x, y + 0.57, z], [0.22, 1.14, 0.22])
      s.add(trim, [x, y + 1.18, z], [0.36, 0.12, 0.36])
      s.block(x, z, 0.2)
      points.push([x, z])
    }
    for (let index = 1; index < points.length; index++) {
      const [ax, az] = points[index - 1], [bx, bz] = points[index]
      const ay = s.ground(ax, az) - s.origin.y + 1.07, by = s.ground(bx, bz) - s.origin.y + 1.07
      const direction = new THREE.Vector3(bx - ax, by - ay, bz - az)
      const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.clone().normalize()))
      s.add(trim, [(ax + bx) / 2, (ay + by) / 2, (az + bz) / 2], [direction.length(), 0.13, 0.19], [rotation.x, rotation.y, rotation.z])
    }
    s.plaque('远岫云台', 0, 3.65, 1.56, 4.2)
  }

  for (const batch of [stone, trim, plaster, red, wood, black, gold, paper, covers, columns, bases, lamps, windows, finials]) batch.finish()
  return {
    group, pickSurfaces, structures,
    obstacleCount: obstacles.length - obstacleStart,
    setDusk(dusk: boolean) {
      lampPaint.emissiveIntensity = dusk ? 1.35 : 0.07
      windowPaint.emissiveIntensity = dusk ? 0.5 : 0.015
    },
  }
}
