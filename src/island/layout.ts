export type Rect2 = { minX: number; maxX: number; minZ: number; maxZ: number }

// The eastern coast stays attached to the existing pier; the new landscape
// extends inland to the west and into the northern and southern hills.
export const ISLAND_RADII = { x: 165, z: 145 } as const
export const ISLAND_BOUNDS: Rect2 = { minX: -172, maxX: 74, minZ: -151, maxZ: 137 }
export const DOCK_BRIDGE: Rect2 = { minX: 43, maxX: 94, minZ: 10, maxZ: 18 }
export const DOCK_PLATFORM: Rect2 = { minX: 84, maxX: 102, minZ: 3, maxZ: 25 }
export const DOCK_RAMP = { minX: 43, maxX: 50 } as const
export const DOCK_HEIGHT = 2.8
export const PALACE_CENTER = { x: -14, z: -10 } as const
export const PALACE_TERRACE: Rect2 = { minX: -34, maxX: 6, minZ: -22, maxZ: 8 }
export const PALACE_STAIRS: Rect2 = { minX: -21, maxX: -7, minZ: 8, maxZ: 15 }
export const PALACE_TERRACE_RISE = 1.8

export const LAKE_CENTER = { x: -93, z: -33 } as const
export const LAKE_RADII = { x: 21, z: 14 } as const
export const LAKE_BRIDGE: Rect2 = { minX: -119, maxX: -67, minZ: -35, maxZ: -31 }
export const LAKE_PAVILION: Rect2 = { minX: -74, maxX: -60, minZ: -39, maxZ: -27 }
export const LAKE_PAVILION_RAMP: Rect2 = { minX: -60, maxX: -55, minZ: -35, maxZ: -31 }
export const LAKE_WATER_HEIGHT = 2.1
export const LAKE_BRIDGE_HEIGHT = 3.2
export const LAKE_RAMP_LENGTH = 5
export const HISTORY_TERRACE: Rect2 = { minX: -125, maxX: -97, minZ: -87, maxZ: -65 }
export const RIDGE_TERRACE: Rect2 = { minX: -36, maxX: -16, minZ: -121, maxZ: -103 }
export const HISTORY_TERRACE_HEIGHT = 5.5
export const RIDGE_TERRACE_HEIGHT = 21
export const OBSERVATORY_CENTER = { x: 27, z: -91 } as const
export const OBSERVATORY_HEIGHT = 25
export const OBSERVATORY_RADIUS = 7

const smoothstep = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

/** Distance from the island origin to its continuous, asymmetric shoreline. */
export function islandRadiusAt(theta: number): number {
  const cos = Math.cos(theta), sin = Math.sin(theta)
  const xRadius = cos < 0 ? ISLAND_RADII.x : 70
  const zRadius = sin < 0 ? ISLAND_RADII.z : 130
  const ellipse = 1 / Math.hypot(cos / xRadius, sin / zRadius)
  const northwestBay = cos < 0 && sin < 0 ? 0.145 * Math.sin(2 * theta) ** 2 : 0
  const angle = Math.atan2(sin, cos)
  const northeastHeadland = cos > 0 && sin < 0
    ? 0.4 * Math.sin(2 * theta) ** 2 * Math.exp(-0.5 * ((angle + 1.25) / 0.3) ** 2) : 0
  return ellipse * (1 + 0.025 * Math.sin(3 * theta) + 0.018 * Math.cos(5 * theta) + northwestBay + northeastHeadland)
}

export function lakeRadiusAt(x: number, z: number): number {
  return Math.hypot((x - LAKE_CENTER.x) / LAKE_RADII.x, (z - LAKE_CENTER.z) / LAKE_RADII.z)
}

function terraceHeight(x: number, z: number, ground: number, rect: Rect2, height: number, approach: number): number {
  const distance = Math.hypot(Math.max(rect.minX - x, 0, x - rect.maxX), Math.max(rect.minZ - z, 0, z - rect.maxZ))
  return height + (ground - height) * smoothstep(distance / approach)
}

/** Ground only: mountains and the lake bed are continuous, with no scenic fake hills. */
export function terrainHeight(x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return 1.1
  const q = Math.hypot(x, z) / islandRadiusAt(Math.atan2(z, x))
  const inland = 1 - Math.min(q, 1)
  const rolling = 0.16 * Math.sin(x * 0.045) * Math.sin(z * 0.06)
    + 0.08 * Math.sin(x * 0.085 + z * 0.035)
  const mountain = 33 * Math.exp(-0.5 * (((x + 21) / 69) ** 2 + ((z + 96) / 35) ** 2))
    * smoothstep((-z - 35) / 35) * (1 - smoothstep((q - 0.65) / 0.35))
  const natural = 1.1 + 2.2 * inland ** 1.6 + rolling * inland + mountain
  let base = terraceHeight(x, z, natural, HISTORY_TERRACE, HISTORY_TERRACE_HEIGHT, 24)
  base = terraceHeight(x, z, base, RIDGE_TERRACE, RIDGE_TERRACE_HEIGHT, 24)
  const observatoryDistance = Math.hypot(x - OBSERVATORY_CENTER.x, z - OBSERVATORY_CENTER.z)
  base = OBSERVATORY_HEIGHT + (base - OBSERVATORY_HEIGHT) * smoothstep((observatoryDistance - OBSERVATORY_RADIUS) / 14)
  base = natural + (base - natural) * (1 - smoothstep((q - 0.96) / 0.04))
  const lakeQ = lakeRadiusAt(x, z)
  if (lakeQ >= 1.65) return base
  const depth = 1
  const bank = lakeQ <= 1
    ? LAKE_WATER_HEIGHT - depth * (1 - lakeQ ** 4)
    : LAKE_WATER_HEIGHT + 4 * depth * (lakeQ - 1) / (1 + 3 * (lakeQ - 1))
  const blend = smoothstep((lakeQ - 1.15) / 0.5)
  return bank + (base - bank) * blend
}

/** The bridge rises at the western bank and joins the lake pavilion at the east. */
export function lakeBridgeHeight(x: number, z: number): number {
  const ground = terrainHeight(LAKE_BRIDGE.minX, z)
  return ground + (LAKE_BRIDGE_HEIGHT - ground) * smoothstep((x - LAKE_BRIDGE.minX) / LAKE_RAMP_LENGTH)
}

export const PALACE_TERRACE_HEIGHT = terrainHeight(PALACE_CENTER.x, PALACE_CENTER.z) + PALACE_TERRACE_RISE
