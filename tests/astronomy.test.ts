import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSky, parseObservation, phaseIndex, projectSky, utcInput } from '../src/observatory/astronomy.ts'
import type { BrightStar } from '../src/observatory/astronomy.ts'

const pole: BrightStar = {
  hygId: 1, hip: null, name: 'Test celestial pole', raHours: 0, decDeg: 90,
  magnitude: 1, colorIndex: null, pmRaMasYr: 0, pmDecMasYr: 0, constellation: null,
}
const separation = (a: { altitude: number; azimuth: number }, b: { altitude: number; azimuth: number }) => {
  const rad = Math.PI / 180
  return Math.acos(Math.min(1, Math.max(-1, Math.sin(a.altitude * rad) * Math.sin(b.altitude * rad)
    + Math.cos(a.altitude * rad) * Math.cos(b.altitude * rad) * Math.cos((a.azimuth - b.azimuth) * rad)))) / rad
}

test('observation input is UTC and rejects calendar rollovers, local suffixes and invalid coordinates', () => {
  const observation = parseObservation('2024-02-29T23:30', '-33.5', '151.2')
  assert.equal(observation.time.toISOString(), '2024-02-29T23:30:00.000Z')
  assert.equal(utcInput(observation.time), '2024-02-29T23:30')
  for (const date of ['2023-02-29T12:00', '2024-04-31T12:00', '2024-01-01T24:00', '2024-01-01T00:00Z', '1899-12-31T23:59', '2101-01-01T00:00', '']) {
    assert.throws(() => parseObservation(date, '0', '0'), /date/)
  }
  for (const latitude of ['', '91', '-90.01', 'Infinity', 'abc']) assert.throws(() => parseObservation('2024-01-01T00:00', latitude, '0'), /latitude/)
  for (const longitude of ['', '181', '-180.01', 'NaN']) assert.throws(() => parseObservation('2024-01-01T00:00', '0', longitude), /longitude/)
})

test('the upward-looking chart puts north up, east left and the zenith at its centre', () => {
  const close = (actual: { x: number; y: number } | null, x: number, y: number) => {
    assert.ok(actual)
    assert.ok(Math.abs(actual.x - x) < 1e-8 && Math.abs(actual.y - y) < 1e-8)
  }
  close(projectSky(90, 123), 360, 360)
  close(projectSky(0, 0), 360, 60)
  close(projectSky(0, 90), 60, 360)
  close(projectSky(0, 180), 360, 660)
  close(projectSky(0, 270), 660, 360)
  assert.equal(projectSky(-0.01, 90), null)
  assert.equal(projectSky(NaN, 0), null)
})

test('celestial-pole altitude follows observer latitude at the catalog epoch', () => {
  for (const latitude of [-65, -20, 0, 35.5, 80]) {
    const sky = calculateSky({ time: new Date('2000-01-01T12:00:00Z'), latitude, longitude: 123 }, [pole])
    assert.ok(Math.abs(sky.stars[0].altitude - latitude) < .01)
  }
})

test('east-positive longitude advances the solar hour angle, rather than reversing it', () => {
  const east = calculateSky({ time: new Date('2024-06-01T10:00:00Z'), latitude: 30, longitude: 15 }, []).sun
  const later = calculateSky({ time: new Date('2024-06-01T11:00:00Z'), latitude: 30, longitude: 0 }, []).sun
  assert.ok(separation(east, later) < .06)
})

test('Sun and Moon match the independently published NASA 2024 eclipse centre line', () => {
  // Fred Espenak / NASA GSFC: 18:18 UT, central line 25°29.1′N 103°56.8′W,
  // tabulated Sun altitude 70°, azimuth 151° (both rounded to integer degrees).
  // https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2024Apr08Tpath.html
  const sky = calculateSky({ time: new Date('2024-04-08T18:18:00Z'), latitude: 25 + 29.1 / 60, longitude: -(103 + 56.8 / 60) }, [])
  assert.ok(Math.abs(sky.sun.altitude - 70) < .5)
  assert.ok(Math.abs(sky.sun.azimuth - 151) < .5)
  assert.ok(separation(sky.sun, sky.moon) < .03, 'Sun and Moon must align at the published total-eclipse centre')
  assert.ok((sky.moon.distanceKm ?? 0) > 340_000 && (sky.moon.distanceKm ?? 0) < 380_000)
})

test('lunar phase agrees with NASA’s independently tabulated April 2024 quarters', () => {
  // https://eclipse.gsfc.nasa.gov/phase/phase2001gmt.html (Universal Time, minute precision)
  for (const [date, expected] of [
    ['2024-04-08T18:21:00Z', 0], ['2024-04-15T19:13:00Z', 90],
    ['2024-04-23T23:49:00Z', 180], ['2024-05-01T11:27:00Z', 270],
  ] as const) {
    const sky = calculateSky({ time: new Date(date), latitude: 0, longitude: 0 }, [])
    const difference = Math.abs(((sky.phaseAngle - expected + 540) % 360) - 180)
    assert.ok(difference < .02, `${date}: ${difference}°`)
    assert.equal(phaseIndex(sky.phaseAngle), expected / 45)
    if (expected === 0) assert.ok(sky.illuminatedFraction < .001)
    if (expected === 180) assert.ok(sky.illuminatedFraction > .999)
  }
})

test('polar observers and date boundaries yield finite bounded coordinates', () => {
  for (const date of ['1900-01-01T00:00:00Z', '2100-12-31T23:59:00Z']) for (const latitude of [-90, 90]) {
    const sky = calculateSky({ time: new Date(date), latitude, longitude: -180 }, [pole])
    for (const object of [sky.sun, sky.moon, ...sky.stars]) {
      assert.ok(Number.isFinite(object.altitude) && Math.abs(object.altitude) <= 90)
      assert.ok(Number.isFinite(object.azimuth) && object.azimuth >= 0 && object.azimuth <= 360)
    }
  }
  assert.throws(() => calculateSky({ time: new Date('invalid'), latitude: 0, longitude: 0 }, []), /date/)
  assert.throws(() => calculateSky({ time: new Date('2024-01-01Z'), latitude: NaN, longitude: 0 }, []), /latitude/)
})
