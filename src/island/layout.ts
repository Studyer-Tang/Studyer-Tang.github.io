export type Rect2 = { minX: number; maxX: number; minZ: number; maxZ: number }

export const ISLAND_RADII = { x: 64, z: 52 } as const
export const DOCK_BRIDGE: Rect2 = { minX: 43, maxX: 94, minZ: 10, maxZ: 18 }
export const DOCK_PLATFORM: Rect2 = { minX: 84, maxX: 102, minZ: 3, maxZ: 25 }
export const DOCK_RAMP = { minX: 43, maxX: 50 } as const
export const DOCK_HEIGHT = 2.8
export const PALACE_CENTER = { x: -14, z: -10 } as const
export const PALACE_TERRACE: Rect2 = { minX: -34, maxX: 6, minZ: -22, maxZ: 8 }
export const PALACE_STAIRS: Rect2 = { minX: -21, maxX: -7, minZ: 8, maxZ: 15 }
export const PALACE_TERRACE_RISE = 1.8

/** Distance from the island centre to its shoreline at an XZ-plane angle. */
export function islandRadiusAt(theta: number): number {
  const ellipse = 1 / Math.hypot(Math.cos(theta) / ISLAND_RADII.x, Math.sin(theta) / ISLAND_RADII.z)
  return ellipse * (1 + 0.055 * Math.sin(3 * theta) + 0.035 * Math.cos(5 * theta))
}

/** Ground only: the deck, palace terrace and entrance ramp are separate surfaces. */
export function terrainHeight(x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 1.1
  const q = Math.hypot(x, z) / islandRadiusAt(Math.atan2(z, x))
  const inland = 1 - Math.min(q, 1)
  const rolling = 0.12 * Math.sin(x * 0.09) * Math.sin(z * 0.1)
    + 0.05 * Math.sin(x * 0.16 + z * 0.07)
  const edge = Math.max(0, Math.min(1, (q - 0.65) / 0.35))
  const hill = 2.7 * Math.exp(-0.5 * (((x - 30) / 14) ** 2 + ((z + 30) / 12) ** 2))
    * (1 - edge * edge * (3 - 2 * edge))
  return 1.1 + 2.2 * inland ** 1.8 + rolling * inland + hill
}

export const PALACE_TERRACE_HEIGHT = terrainHeight(PALACE_CENTER.x, PALACE_CENTER.z) + PALACE_TERRACE_RISE
