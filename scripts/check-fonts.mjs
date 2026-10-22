import { createHash } from 'node:crypto'
import { readdir, readFile, realpath } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensions = /\.(?:[cm]?[jt]sx?|css|json|html|svg|md)$/
const needsCoverage = /[\p{Script=Han}\p{Script=Greek}\u2100-\u214f\u2200-\u22ff\u3000-\u303f\uff01-\uff60]/u

export function missingCharacters(text, covered) {
  const decoded = text.replace(/\\u\{([\da-f]{1,6})\}|\\u([\da-f]{4})/gi, (literal, long, short) => {
    const point = Number.parseInt(long ?? short, 16)
    return point <= 0x10ffff ? String.fromCodePoint(point) : literal
  })
  return [...new Set([...decoded].filter(char => needsCoverage.test(char) && !covered.has(char.codePointAt(0))))]
}

async function sourceFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (entry.isFile() && extensions.test(entry.name)) files.push(path)
  }
  return files.sort()
}

export async function checkFonts(sourceDirectory = join(root, 'src')) {
  const directory = join(root, 'public/fonts')
  const manifest = JSON.parse(await readFile(join(directory, 'coverage.json'), 'utf8'))
  if (manifest.schema !== 1 || manifest.fonts.length !== 3) throw new Error('Invalid font coverage manifest')
  const covered = new Set()
  let bytes = 0
  for (const font of manifest.fonts) {
    if (!/^[a-z-]+\.woff2$/.test(font.file)) throw new Error('Invalid font filename')
    const data = await readFile(join(directory, font.file))
    if (data.subarray(0, 4).toString() !== 'wOF2' || data.length !== font.bytes || createHash('sha256').update(data).digest('hex') !== font.sha256) {
      throw new Error(`Font changed without regenerating actual cmap coverage: ${font.file}`)
    }
    for (const [start, end] of font.codepointRanges) {
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > 0x10ffff) throw new Error('Invalid cmap range')
      for (let point = start; point <= end; point++) covered.add(point)
    }
    bytes += data.length
  }
  if (bytes > 500 * 1024) throw new Error(`Font budget exceeded: ${bytes} bytes`)
  const missing = []
  for (const file of await sourceFiles(sourceDirectory)) {
    const chars = missingCharacters(await readFile(file, 'utf8'), covered)
    if (chars.length) missing.push(`${file}: ${chars.map(char => `${char} (U+${char.codePointAt(0).toString(16).toUpperCase()})`).join(', ')}`)
  }
  if (missing.length) throw new Error(`Font subset needs regeneration; missing source characters:\n${missing.join('\n')}\nSee public/fonts/README.md.`)
  return bytes
}

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkFonts(process.argv[2]).then(bytes => console.log(`Fonts verified: ${(bytes / 1024).toFixed(1)} KiB; source CJK, Greek and mathematical characters covered.`)).catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
