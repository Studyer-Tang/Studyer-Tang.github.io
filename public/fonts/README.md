# Site font subsets

These fonts are self-hosted; the site does not contact a font service at runtime.
All three files are derivatives under the SIL Open Font License 1.1. Original
copyright and license metadata are retained in the fonts and in the two OFL files.
Neither upstream license declares a Reserved Font Name. The new family names
distinguish these subsets from the upstream fonts; they are not an OFL requirement.

| File | Internal / CSS family | Style | Weight | Size |
| --- | --- | --- | --- | ---: |
| `field-serif.woff2` | Field Serif | normal | 400 | 33,984 B |
| `field-serif-italic.woff2` | Field Serif | italic | 400 | 36,596 B |
| `field-serif-sc.woff2` | Field Serif SC | normal | 400–500 variable | 325,456 B |

Total font data: 396,036 bytes (386.8 KiB). Newsreader is instantiated at optical
size 18 for reading text; its italic is a separate original italic design.
Noto Serif SC keeps the actual weight axis from 400 through 500. Its character
subset includes the current source text plus Western letters, punctuation, Greek
and common mathematical notation supported by the upstream font. These are text
fonts, not complete CJK dictionaries or mathematical typesetting fonts.

Use the three files with `@font-face`, `font-display: swap`, normal/italic styles
and the weights above. The text stack is `"Field Serif", "Field Serif SC", serif`.
Avoid synthetic italic for Chinese; use regular Chinese glyphs alongside the
real Latin italic. A browser/system fallback is still appropriate for emoji and
symbols outside these text fonts.

## Official sources

Source repository revision:
[`google/fonts@45e3d5269e4a17d823f6d84470bc084dc5ae46f6`](https://github.com/google/fonts/tree/45e3d5269e4a17d823f6d84470bc084dc5ae46f6).
The regeneration script verifies these exact Git blob hashes before using sources:

| Temporary filename | Official repository file | Git blob |
| --- | --- | --- |
| `noto-serif-sc.ttf` | [NotoSerifSC[wght].ttf](https://github.com/google/fonts/blob/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf) | `eab063faf229160a52d3760f5555150e4eb9e5bf` |
| `newsreader.ttf` | [Newsreader[opsz,wght].ttf](https://github.com/google/fonts/blob/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/newsreader/Newsreader%5Bopsz%2Cwght%5D.ttf) | `ad4a9a8c44ec328c80b61c773f1ba02f6b5ed292` |
| `newsreader-italic.ttf` | [Newsreader-Italic[opsz,wght].ttf](https://github.com/google/fonts/blob/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/newsreader/Newsreader-Italic%5Bopsz%2Cwght%5D.ttf) | `d25879656a601d44c49836f9e773d100190c62e1` |
| `OFL-noto-serif-sc.txt` | [Noto Serif SC OFL](https://github.com/google/fonts/blob/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/notoserifsc/OFL.txt) | `94d1bf7b52481343e2983fb7751e8b7abe1ea07b` |
| `OFL-newsreader.txt` | [Newsreader OFL](https://github.com/google/fonts/blob/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/newsreader/OFL.txt) | `d2d4f407109e9c74b8ab502fc79b912408ab8e41` |

The large original CJK font is deliberately not stored in this repository.

## Updating the subsets

`npm run check:fonts` runs locally without Python, network access or new npm
dependencies. It verifies WOFF2 signatures, hashes and the combined 500 KiB budget,
then checks source Han characters, Greek, mathematical symbols and CJK punctuation.
Literal `\uXXXX` and `\u{XXXXX}` escapes are checked too. All text-like files under
`src/`, including comments and the imported landscape metadata in
`src/photographs.json`, are scanned. The build runs this check before TypeScript
and Vite, so new CJK text cannot silently fall back to a different font.

When the check reports missing characters:

1. Download the five pinned upstream files above into a temporary directory using
   the temporary filenames in the table. Do not add original TTFs to the repository.
2. Create a separate environment and regenerate from the current source text:

   ```sh
   python3 -m venv /tmp/site-font-tools
   /tmp/site-font-tools/bin/python -m pip install 'fonttools[woff]==4.67.0'
   /tmp/site-font-tools/bin/python scripts/subset-fonts.py /tmp/site-font-sources
   npm run check:fonts
   npm run build
   ```

3. Review the three WOFF2 files and `coverage.json` together. The generator reopens
   the saved fonts and records their actual cmap ranges, byte sizes and SHA-256
   hashes; it does not assume that every requested character exists upstream.
4. Keep both original OFL files and check the changed text in the browser. Delete
   the temporary source directory when it is no longer needed.

Generation was verified with fontTools 4.67.0 and Brotli 1.2.0. Python is a
maintenance tool only; ordinary installation, build and deployment use Node.
