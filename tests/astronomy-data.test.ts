import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { calculateSky } from '../src/observatory/astronomy.ts'
import type { BrightStar } from '../src/observatory/astronomy.ts'

const sourceFile = new URL('../src/observatory/data/bright-stars.json', import.meta.url)
const catalogBytes = readFileSync(sourceFile)
const catalog: BrightStar[] = JSON.parse(catalogBytes.toString())
const metadata = JSON.parse(readFileSync(new URL('../public/observatory/sources.json', import.meta.url), 'utf8'))
const digest = (data: Buffer) => createHash('sha256').update(data).digest('hex')

test('the offline catalog has 400 traceable, finite bright-star records with correct angular units', () => {
  assert.equal(catalog.length, 400)
  assert.equal(new Set(catalog.map(star => star.hygId)).size, 400)
  for (const [index, star] of catalog.entries()) {
    assert.ok(star.hygId > 0, 'the Sun must not enter the stellar subset')
    assert.ok(star.raHours >= 0 && star.raHours < 24)
    assert.ok(star.decDeg >= -90 && star.decDeg <= 90)
    assert.ok(Number.isFinite(star.magnitude))
    assert.ok(star.pmRaMasYr === null || Number.isFinite(star.pmRaMasYr))
    assert.ok(star.pmDecMasYr === null || Number.isFinite(star.pmDecMasYr))
    if (index) assert.ok(catalog[index - 1].magnitude <= star.magnitude)
  }
  const sirius = catalog.find(star => star.hip === 32349)
  assert.ok(sirius)
  assert.equal(sirius.name, 'Sirius')
  assert.ok(Math.abs(sirius.raHours - 6.7525) < .001)
  assert.ok(Math.abs(sirius.decDeg + 16.7161) < .001)
})

test('the distributed catalog matches the licensed pinned source derivative and public download', () => {
  assert.equal(metadata.license, 'CC BY-SA 4.0')
  assert.equal(metadata.epoch, 2000)
  assert.equal(metadata.equinox, 2000)
  assert.match(metadata.sourceCommit, /^[a-f0-9]{40}$/)
  assert.equal(digest(catalogBytes), metadata.adaptedDataSha256)
  assert.deepEqual(readFileSync(new URL('../public/observatory/bright-stars.json', import.meta.url)), catalogBytes)
  const notice = readFileSync(new URL('../public/observatory/HYG-NOTICE.txt', import.meta.url), 'utf8')
  assert.match(notice, /David Nash/)
  assert.match(notice, /4\.0/)
})

test('real Polaris stays near the geographic north pole altitude while Sirius is below the north-pole horizon', () => {
  const polaris = catalog.find(star => star.hip === 11767)!
  const sirius = catalog.find(star => star.hip === 32349)!
  for (const hour of [0, 6, 12, 18]) {
    const time = new Date(`2026-10-23T${String(hour).padStart(2, '0')}:00:00Z`)
    const greenwich = calculateSky({ time, latitude: 51.4779, longitude: 0 }, [polaris])
    assert.ok(Math.abs(greenwich.stars[0].altitude - 51.4779) < 1)
    const pole = calculateSky({ time, latitude: 90, longitude: 0 }, [sirius])
    assert.ok(pole.stars[0].altitude < -15)
  }
})

test('proper motion changes a fast-moving real star while keeping near-polar transformations finite', () => {
  const arcturus = catalog.find(star => star.hip === 69673)!
  const polaris = catalog.find(star => star.hip === 11767)!
  const observation = { time: new Date('2100-01-01T12:00:00Z'), latitude: 51.4779, longitude: 0 }
  const moving = calculateSky(observation, [arcturus, polaris]).stars
  const fixed = calculateSky(observation, [{ ...arcturus, pmRaMasYr: 0, pmDecMasYr: 0 }]).stars[0]
  const coordinateShift = Math.hypot((moving[0].raHours - fixed.raHours) * 15 * Math.cos(fixed.decDeg * Math.PI / 180), moving[0].decDeg - fixed.decDeg)
  assert.ok(coordinateShift > .04 && coordinateShift < .09, 'Arcturus moves several arcminutes per century, not zero or many degrees')
  assert.ok(Number.isFinite(moving[1].azimuth) && Number.isFinite(moving[1].altitude))
})

test('NASA assets retain dated observational metadata, source credits and their verified original bytes', () => {
  const images = JSON.parse(readFileSync(new URL('../src/observatory/data/images.json', import.meta.url), 'utf8'))
  assert.equal(images.length, 2)
  assert.deepEqual(JSON.parse(readFileSync(new URL('../public/observatory/images.json', import.meta.url), 'utf8')), images)
  for (const image of images) {
    assert.equal(image.live, false)
    assert.match(image.observedAt, /^\d{4}-\d{2}-\d{2}$/)
    assert.match(image.credit, /NASA/)
    assert.ok(new URL(image.sourceUrl).hostname.endsWith('nasa.gov'))
    assert.ok(new URL(image.licenseUrl).hostname.endsWith('nasa.gov'))
    assert.ok(!/CC BY-SA/.test(image.license), 'stellar-data terms must not be incorrectly applied to NASA media')
    const data = readFileSync(new URL('../public' + image.path, import.meta.url))
    assert.equal(data.length, image.bytes)
    assert.ok(data.length < 500_000)
    assert.equal(digest(data), image.sha256)
    assert.deepEqual([...data.subarray(0, 3)], [0xff, 0xd8, 0xff])
  }
})
