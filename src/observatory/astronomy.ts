import {
  Body, Equator, EquatorFromVector, Horizon, Illumination, KM_PER_AU,
  MakeTime, MoonPhase, Observer, RotateVector, Rotation_EQJ_EQD, Vector,
} from 'astronomy-engine'

export type BrightStar = {
  hygId: number
  hip: number | null
  name: string | null
  raHours: number
  decDeg: number
  magnitude: number
  colorIndex: number | null
  pmRaMasYr: number | null
  pmDecMasYr: number | null
  constellation: string | null
}
export type Observation = { time: Date; latitude: number; longitude: number }
export type SkyObject = {
  id: string
  kind: 'star' | 'sun' | 'moon'
  name: string
  altitude: number
  azimuth: number
  raHours: number
  decDeg: number
  magnitude: number
  distanceKm?: number
  star?: BrightStar
}
export const DEFAULT_SITE = { latitude: 51.4779, longitude: 0 }
export const MIN_DATE = '1900-01-01T00:00'
export const MAX_DATE = '2100-12-31T23:59'
const J2000 = Date.UTC(2000, 0, 1, 12)
const RAD = Math.PI / 180
const MAS_TO_RAD = RAD / 3_600_000

export function utcInput(time: Date): string { return time.toISOString().slice(0, 16) }

/** The text input is explicitly UTC, never the device's implicit local time zone. */
export function parseObservation(utc: string, latitude: string, longitude: string): Observation {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(utc) || utc < MIN_DATE || utc > MAX_DATE) throw new RangeError('date')
  const time = new Date(utc + ':00Z')
  if (!Number.isFinite(time.getTime()) || utcInput(time) !== utc) throw new RangeError('date')
  const lat = Number(latitude), lon = Number(longitude)
  if (!latitude.trim() || !Number.isFinite(lat) || Math.abs(lat) > 90) throw new RangeError('latitude')
  if (!longitude.trim() || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new RangeError('longitude')
  return { time, latitude: lat, longitude: lon }
}

export function starName(star: BrightStar): string { return star.name || (star.hip ? `HIP ${star.hip}` : `HYG ${star.hygId}`) }

/** HYG's J2000 direction plus linear tangent-plane proper motion (pmRA includes cos(dec)). */
function starVector(star: BrightStar, time: Date): Vector {
  const ra = star.raHours * 15 * RAD, dec = star.decDeg * RAD
  const years = (time.getTime() - J2000) / (365.25 * 86_400_000)
  const east = (star.pmRaMasYr ?? 0) * years * MAS_TO_RAD
  const north = (star.pmDecMasYr ?? 0) * years * MAS_TO_RAD
  const cosRa = Math.cos(ra), sinRa = Math.sin(ra), cosDec = Math.cos(dec), sinDec = Math.sin(dec)
  return new Vector(
    cosDec * cosRa - east * sinRa - north * sinDec * cosRa,
    cosDec * sinRa + east * cosRa - north * sinDec * sinRa,
    sinDec + north * cosDec,
    MakeTime(time),
  )
}

/** Sea-level, geometric horizon; no atmospheric refraction, terrain or weather model. */
export function calculateSky(observation: Observation, catalog: readonly BrightStar[]) {
  const { time, latitude, longitude } = observation
  if (!Number.isFinite(time.getTime()) || time.getUTCFullYear() < 1900 || time.getUTCFullYear() > 2100) throw new RangeError('date')
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) throw new RangeError('latitude')
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new RangeError('longitude')
  const observer = new Observer(latitude, longitude, 0)
  const rotation = Rotation_EQJ_EQD(time)
  const stars: SkyObject[] = catalog.map(star => {
    const equatorial = EquatorFromVector(RotateVector(rotation, starVector(star, time)))
    const horizontal = Horizon(time, observer, equatorial.ra, equatorial.dec)
    return {
      id: `hyg:${star.hygId}`, kind: 'star', name: starName(star),
      altitude: horizontal.altitude, azimuth: horizontal.azimuth,
      raHours: equatorial.ra, decDeg: equatorial.dec, magnitude: star.magnitude, star,
    }
  })
  const bodyPosition = (body: Body.Sun | Body.Moon, kind: 'sun' | 'moon'): SkyObject => {
    const equatorial = Equator(body, time, observer, true, true)
    const horizontal = Horizon(time, observer, equatorial.ra, equatorial.dec)
    return {
      id: kind, kind, name: body, altitude: horizontal.altitude, azimuth: horizontal.azimuth,
      raHours: equatorial.ra, decDeg: equatorial.dec, magnitude: Illumination(body, time).mag,
      distanceKm: equatorial.dist * KM_PER_AU,
    }
  }
  return {
    stars, sun: bodyPosition(Body.Sun, 'sun'), moon: bodyPosition(Body.Moon, 'moon'),
    phaseAngle: MoonPhase(time), illuminatedFraction: Illumination(Body.Moon, time).phase_fraction,
  }
}

/** Zenith-centred equidistant sky chart: north up, east left when looking upward. */
export function projectSky(altitude: number, azimuth: number, radius = 300, center = 360): { x: number; y: number } | null {
  if (!Number.isFinite(altitude) || !Number.isFinite(azimuth) || altitude < 0 || altitude > 90) return null
  const r = (90 - altitude) / 90 * radius
  return { x: center - r * Math.sin(azimuth * RAD), y: center - r * Math.cos(azimuth * RAD) }
}

export function phaseIndex(angle: number): number { return Math.floor((((angle % 360) + 382.5) % 360) / 45) }

/** A phase schematic, not an image or an observer-specific position angle. */
export function lunarPhasePath(fraction: number, radius = 24): string {
  const k = 1 - 2 * Math.max(0, Math.min(1, fraction))
  return `M0,${-radius} A${radius},${radius} 0 0 1 0,${radius} A${Math.abs(k) * radius},${radius} 0 0 ${k >= 0 ? 0 : 1} 0,${-radius}Z`
}
