import test from 'node:test'
import assert from 'node:assert/strict'
import { chapters, readRoute, routeHref } from '../src/navigation.ts'

const read = (path: string) => readRoute(new URL(path, 'https://studyer-tang.github.io/'))

test('every chapter and language has a reversible, shareable URL', () => {
  for (const chapter of chapters) for (const language of ['zh', 'en'] as const) {
    assert.deepEqual(read(routeHref(chapter, language)), { chapter, language })
  }
})

test('legacy reading URLs and private section aliases remain useful without exposing old content', () => {
  assert.equal(read('?page=reading').chapter, 'reading')
  for (const hash of ['education', 'contact', 'partner']) assert.equal(read('#' + hash).chapter, 'personal')
  for (const [hash, chapter] of [['software', 'projects'], ['research', 'research'], ['reading', 'reading']]) assert.equal(read('#' + hash).chapter, chapter)
})

test('explicit chapters take priority and unknown routes fall back safely', () => {
  assert.equal(read('?chapter=projects&page=reading#research').chapter, 'projects')
  assert.equal(read('?chapter=unknown&page=reading').chapter, 'reading')
  assert.deepEqual(read('?chapter=unknown&lang=unknown#missing'), { chapter: 'home', language: 'zh' })
  assert.equal(read('?chapter=research#content').chapter, 'research')
  for (const hash of ['constructor', '__proto__', 'toString']) assert.equal(read('#' + hash).chapter, 'home')
})
