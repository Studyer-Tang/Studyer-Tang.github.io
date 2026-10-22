import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { checkFonts } from '../scripts/check-fonts.mjs'

test('font coverage checks new Han literals and escaped source text', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'field-font-coverage-'))
  try {
    const source = join(directory, 'copy.ts')
    await writeFile(source, "export const label = '研究兴趣'\n")
    await assert.doesNotReject(checkFonts(directory))
    for (const literal of ['𠀀', '\\u{20000}']) {
      await writeFile(source, `export const label = '${literal}'\n`)
      await assert.rejects(checkFonts(directory), /U\+20000/)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('font coverage rejects a changed font with a stale cmap manifest', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'field-font-integrity-'))
  try {
    await mkdir(join(directory, 'scripts'))
    await mkdir(join(directory, 'src'))
    await cp(new URL('../public/fonts', import.meta.url), join(directory, 'public/fonts'), { recursive: true })
    await cp(new URL('../scripts/check-fonts.mjs', import.meta.url), join(directory, 'scripts/check-fonts.mjs'))
    const font = join(directory, 'public/fonts/field-serif-sc.woff2')
    const bytes = await readFile(font)
    bytes[20] ^= 1
    await writeFile(font, bytes)
    const result = spawnSync(process.execPath, [join(directory, 'scripts/check-fonts.mjs')], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Font changed without regenerating actual cmap coverage/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
