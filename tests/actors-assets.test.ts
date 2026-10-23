import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('self-contained actor models keep their rig, animation contract and verified bytes', async () => {
  const root = new URL('../public/actors/', import.meta.url)
  const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'))
  let total = 0
  for (const source of sources) {
    const data = await readFile(new URL(source.file, root))
    assert.equal(data.length, source.bytes)
    assert.equal(createHash('sha256').update(data).digest('hex'), source.sha256)
    assert.equal(data.toString('ascii', 0, 4), 'glTF')
    assert.equal(data.readUInt32LE(4), 2)
    assert.equal(data.readUInt32LE(8), data.length)
    const jsonLength = data.readUInt32LE(12)
    assert.equal(data.readUInt32LE(16), 0x4e4f534a)
    const model = JSON.parse(data.toString('utf8', 20, 20 + jsonLength))
    const binaryAt = 20 + jsonLength
    const binaryLength = data.readUInt32LE(binaryAt)
    assert.equal(data.readUInt32LE(binaryAt + 4), 0x004e4942)
    assert.equal(binaryAt + 8 + binaryLength, data.length)
    assert.equal(model.buffers.length, 1)
    assert.ok(!model.buffers[0].uri && model.buffers[0].byteLength <= binaryLength)
    assert.ok((model.images ?? []).every((image: { uri?: string }) => !image.uri), 'Models must not request an external texture service')
    assert.ok(model.skins.length > 0)
    for (const view of model.bufferViews) {
      assert.equal(view.buffer, 0)
      assert.ok((view.byteOffset ?? 0) + view.byteLength <= model.buffers[0].byteLength, 'Pruned animation views must fit the embedded buffer')
    }
    const widths: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
    const components: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }
    for (const accessor of model.accessors) {
      if (accessor.bufferView === undefined || !accessor.count) continue
      const view = model.bufferViews[accessor.bufferView]
      const element = widths[accessor.componentType] * components[accessor.type]
      assert.ok((accessor.byteOffset ?? 0) + (accessor.count - 1) * (view.byteStride ?? element) + element <= view.byteLength)
    }
    const names = new Set(model.animations.map((clip: { name: string }) => clip.name))
    for (const name of source.file === 'traveler.glb' ? ['Idle_Neutral', 'Walk', 'Run', 'Interact'] : ['Survey', 'Walk', 'Run']) assert.ok(names.has(name), `${source.file} needs ${name}`)
    total += data.length
  }
  assert.equal(sources.length, 2)
  assert.ok(total < 1.6 * 1024 * 1024, 'The two animated actors must stay within their download budget')
})
