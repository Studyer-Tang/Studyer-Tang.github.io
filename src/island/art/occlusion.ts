type Point3 = { x: number; y: number; z: number }
export type CanopyVolume = Point3 & { radiusX: number; radiusY: number; radiusZ: number; yaw: number }

/** Close, low camera angles need a clear sightline; aerial views keep the forest. */
export function isCloseForestView(camera: Point3, focus: Point3) {
  const dx = camera.x - focus.x, dy = camera.y - focus.y, dz = camera.z - focus.z
  const distanceSquared = dx * dx + dy * dy + dz * dz
  return distanceSquared > 1 && distanceSquared < 70 * 70 && dy < Math.sqrt(distanceSquared) * 0.69
}

/** Test a finite viewing corridor against an oriented, offset crown ellipsoid. */
export function viewCrossesCanopy(camera: Point3, focus: Point3, crown: CanopyVolume, padding: number) {
  const cos = Math.cos(crown.yaw), sin = Math.sin(crown.yaw)
  const rx = crown.radiusX + padding, ry = crown.radiusY + padding, rz = crown.radiusZ + padding
  const cx = camera.x - crown.x, cz = camera.z - crown.z
  const ax = (cos * cx - sin * cz) / rx, ay = (camera.y - crown.y) / ry, az = (sin * cx + cos * cz) / rz
  const fx = focus.x - crown.x, fz = focus.z - crown.z
  const dx = (cos * fx - sin * fz) / rx - ax, dy = (focus.y - crown.y) / ry - ay, dz = (sin * fx + cos * fz) / rz - az
  const lengthSquared = dx * dx + dy * dy + dz * dz
  const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy + az * dz) / (lengthSquared || 1)))
  return (ax + t * dx) ** 2 + (ay + t * dy) ** 2 + (az + t * dz) ** 2 < 1
}
