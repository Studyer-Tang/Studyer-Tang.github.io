import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

type Asset = { path: string; bytes: number; sha256: string; width: number; height: number }
type Recording = Asset & { fps: number; durationSeconds: number; codec: string; pixelFormat: string; audio: boolean }
type Box = { type: string; start: number; end: number; payload: number }

const manifest = JSON.parse(await readFile(new URL('../src/sea-recording.json', import.meta.url), 'utf8')) as {
  desktop: Recording; mobile: Recording; poster: Asset
}
const assetData = (asset: Asset) => readFile(new URL(`../public${asset.path}`, import.meta.url))

// Read ISO BMFF structure directly so CI does not need ffmpeg or a browser codec.
function boxes(data: Buffer, start = 0, end = data.length): Box[] {
  const result: Box[] = []
  let at = start
  while (at < end) {
    assert.ok(at + 8 <= end, 'Each MP4 box must have a complete header')
    let size = data.readUInt32BE(at)
    let header = 8
    if (size === 1) {
      assert.ok(at + 16 <= end)
      size = Number(data.readBigUInt64BE(at + 8))
      header = 16
    } else if (size === 0) size = end - at
    assert.ok(Number.isSafeInteger(size) && size >= header && at + size <= end, 'MP4 box exceeds its container')
    result.push({ type: data.toString('ascii', at + 4, at + 8), start: at, end: at + size, payload: at + header })
    at += size
  }
  return result
}

function child(data: Buffer, parent: Box, type: string): Box {
  const box = boxes(data, parent.payload, parent.end).find((candidate) => candidate.type === type)
  assert.ok(box, `${parent.type} needs a ${type} box`)
  return box
}

function timing(data: Buffer, box: Box) {
  const version = data[box.payload]
  assert.ok(version === 0 || version === 1, 'Unsupported movie/media header version')
  const timescale = data.readUInt32BE(box.payload + (version === 1 ? 20 : 12))
  const duration = version === 1 ? Number(data.readBigUInt64BE(box.payload + 24)) : data.readUInt32BE(box.payload + 16)
  assert.ok(timescale > 0 && Number.isSafeInteger(duration))
  return { timescale, seconds: duration / timescale }
}

test('sea assets match their published hashes and responsive download budgets', async () => {
  let total = 0
  for (const [name, asset] of Object.entries(manifest)) {
    if (!['desktop', 'mobile', 'poster'].includes(name)) continue
    assert.match(asset.path, /^\/sea\/[a-z0-9-]+\.(mp4|webp)$/)
    const data = await assetData(asset)
    assert.equal(data.length, asset.bytes, `${name}: manifest byte count`)
    assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256, `${name}: content integrity`)
    total += data.length
  }
  assert.ok(manifest.desktop.bytes < 10 * 1024 * 1024, '1080p video must remain below 10 MiB')
  assert.ok(manifest.mobile.bytes < 4 * 1024 * 1024, 'Portrait video must remain below 4 MiB')
  assert.ok(total < 14 * 1024 * 1024, 'Both videos and their poster must remain below 14 MiB')
})

test('both sea videos stream metadata first and contain one silent H.264 track at 25 fps', async () => {
  for (const [name, expectedWidth, expectedHeight] of [['desktop', 1920, 1080], ['mobile', 608, 1080]] as const) {
    const asset = manifest[name]
    const data = await assetData(asset)
    const top = boxes(data)
    assert.equal(top[0].type, 'ftyp', `${name}: MP4 file type must be first`)
    const movie = top.find((box) => box.type === 'moov')
    const media = top.find((box) => box.type === 'mdat')
    assert.ok(movie && media)
    assert.ok(movie.end <= media.start, `${name}: faststart moov must precede mdat for streaming playback`)
    assert.equal(timing(data, child(data, movie, 'mvhd')).seconds, 17.6)
    assert.equal(asset.durationSeconds, 17.6)
    assert.equal(asset.codec, 'h264')
    assert.equal(asset.pixelFormat, 'yuv420p')
    assert.equal(asset.audio, false)

    const tracks = boxes(data, movie.payload, movie.end).filter((box) => box.type === 'trak')
    assert.equal(tracks.length, 1, `${name}: no audio or additional decoding tracks`)
    const mdia = child(data, tracks[0], 'mdia')
    const handler = child(data, mdia, 'hdlr')
    assert.equal(data.toString('ascii', handler.payload + 8, handler.payload + 12), 'vide')
    const clock = timing(data, child(data, mdia, 'mdhd'))
    assert.equal(clock.seconds, 17.6)
    const sampleTable = child(data, child(data, mdia, 'minf'), 'stbl')
    const descriptions = child(data, sampleTable, 'stsd')
    assert.equal(data.readUInt32BE(descriptions.payload + 4), 1)
    const [sample] = boxes(data, descriptions.payload + 8, descriptions.end)
    assert.equal(sample.type, 'avc1', `${name}: Safari-compatible H.264 sample entry`)
    assert.equal(data.readUInt16BE(sample.payload + 24), expectedWidth)
    assert.equal(data.readUInt16BE(sample.payload + 26), expectedHeight)
    assert.equal(asset.width, expectedWidth)
    assert.equal(asset.height, expectedHeight)
    const configuration = boxes(data, sample.payload + 78, sample.end).find((box) => box.type === 'avcC')
    assert.ok(configuration, `${name}: H.264 decoder configuration is embedded`)
    assert.equal(data[configuration.payload], 1)

    const timeToSample = child(data, sampleTable, 'stts')
    const entries = data.readUInt32BE(timeToSample.payload + 4)
    assert.equal(timeToSample.payload + 8 + entries * 8, timeToSample.end)
    let frames = 0
    let ticks = 0
    for (let i = 0; i < entries; i++) {
      const count = data.readUInt32BE(timeToSample.payload + 8 + i * 8)
      const delta = data.readUInt32BE(timeToSample.payload + 12 + i * 8)
      assert.equal(clock.timescale / delta, 25, `${name}: every sample uses a constant 25 fps clock`)
      frames += count
      ticks += count * delta
    }
    assert.equal(frames, 440)
    assert.equal(ticks / clock.timescale, 17.6)
    assert.equal(asset.fps, 25)
  }
})

test('the sea loading poster is a complete 1080p WebP', async () => {
  const data = await assetData(manifest.poster)
  assert.equal(data.toString('ascii', 0, 4), 'RIFF')
  assert.equal(data.readUInt32LE(4) + 8, data.length)
  assert.equal(data.toString('ascii', 8, 12), 'WEBP')
  let dimensions: [number, number] | undefined
  let at = 12
  while (at + 8 <= data.length) {
    const type = data.toString('ascii', at, at + 4)
    const length = data.readUInt32LE(at + 4)
    const payload = at + 8
    assert.ok(payload + length <= data.length)
    if (type === 'VP8 ') {
      assert.equal(data.toString('hex', payload + 3, payload + 6), '9d012a')
      dimensions = [data.readUInt16LE(payload + 6) & 0x3fff, data.readUInt16LE(payload + 8) & 0x3fff]
    } else if (type === 'VP8L') {
      assert.equal(data[payload], 0x2f)
      const header = data.readUInt32LE(payload + 1)
      dimensions = [(header & 0x3fff) + 1, ((header >>> 14) & 0x3fff) + 1]
    } else if (type === 'VP8X') dimensions = [data.readUIntLE(payload + 4, 3) + 1, data.readUIntLE(payload + 7, 3) + 1]
    at = payload + length + (length % 2)
  }
  assert.equal(at, data.length)
  assert.deepEqual(dimensions, [1920, 1080])
  assert.equal(manifest.poster.width, 1920)
  assert.equal(manifest.poster.height, 1080)
})
