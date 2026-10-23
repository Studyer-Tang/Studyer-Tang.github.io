import { islandLandmarks } from '../landmarks.ts'
import { islandRadiusAt, lakeRadiusAt } from '../layout.ts'
import { nearPath } from './landscape.ts'
import { isWalkable } from '../movement.ts'
import type { CircleObstacle } from '../movement.ts'

export type TreeSite = { x: number; z: number; size: number; angle: number }

export function woodlandRandom() {
  let seed = 529138
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
}

/** Clear whole crowns, rather than just trunks, beside architecture and views. */
export function inGardenClearing(x: number, z: number) {
  if (Math.abs(x + 14) < 16 && z >= 8) return true
  if (x > -129 && x < -82 && z > 40 && z < 91) return true
  if (lakeRadiusAt(x, z) < 1.42) return true
  return islandLandmarks.some(place => {
    const extent = place.id === 'reading' ? [29, 24]
      : place.id === 'history' || place.id === 'studio' ? [20, 16]
      : place.id === 'gate' ? [19, 13]
      : place.id === 'ridge' ? [18, 14] : [15, 14]
    return Math.abs(x - place.position.x) < extent[0] && Math.abs(z - place.position.z) < extent[1]
  })
}

export function createTreeSites(obstacles: readonly CircleObstacle[], count = 480): TreeSite[] {
  const random = woodlandRandom(), sites: TreeSite[] = []
  for (let attempt = 0; attempt < 9000 && sites.length < count; attempt++) {
    const angle = random() * Math.PI * 2, q = Math.sqrt(random()) * 0.91
    const x = Math.cos(angle) * islandRadiusAt(angle) * q, z = Math.sin(angle) * islandRadiusAt(angle) * q
    if (!isWalkable({ x, z }, 1.5) || inGardenClearing(x, z) || nearPath(x, z, 5.1)) continue
    if (sites.some(site => Math.hypot(x - site.x, z - site.z) < 5.4)) continue
    if (obstacles.some(obstacle => Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + 2.5)) continue
    sites.push({ x, z, size: 0.78 + random() * 0.54, angle: random() * Math.PI * 2 })
  }
  return sites
}
