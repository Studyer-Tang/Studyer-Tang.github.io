"""Offline regeneration: python scripts/subset-fonts.py /path/to/source-fonts.

Requires fonttools[woff]==4.67.0 in a temporary Python environment. Original
TTFs and OFL files stay outside this repository; see public/fonts/README.md.
"""
import hashlib
import json
from pathlib import Path
import re
import sys

import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public' / 'fonts'
SOURCES = {
    'noto-serif-sc.ttf': 'eab063faf229160a52d3760f5555150e4eb9e5bf',
    'newsreader.ttf': 'ad4a9a8c44ec328c80b61c773f1ba02f6b5ed292',
    'newsreader-italic.ttf': 'd25879656a601d44c49836f9e773d100190c62e1',
}
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.json', '.html', '.svg', '.md'}


def ranges(points):
    result = []
    for point in sorted(points):
        if result and result[-1][1] + 1 == point:
            result[-1][1] = point
        else:
            result.append([point, point])
    return result


def rename(font, family, style):
    compact = family.replace(' ', '')
    values = {1: family, 2: style, 3: f'1.0;{compact}-{style};site-subset',
              4: family + (' Italic' if style == 'Italic' else ''),
              6: compact + '-' + style, 16: family, 17: style,
              18: family + (' Italic' if style == 'Italic' else ''),
              21: family, 22: style, 25: compact}
    table = font['name']
    for record in table.names:
        if record.nameID in values:
            record.string = values[record.nameID].encode(record.getEncoding())
        elif record.nameID not in {0, 7, 8, 9, 11, 12, 13, 14}:
            text = record.toUnicode().replace('NotoSerifSC', compact).replace('Noto Serif SC', family)
            text = text.replace('Newsreader', compact)
            record.string = text.encode(record.getEncoding())
    for name_id in (1, 2, 3, 4, 6, 16, 17):
        table.setName(values[name_id], name_id, 3, 1, 0x409)
    if 'fvar' in font:
        for instance in font['fvar'].instances:
            instance.postscriptNameID = 0xffff


def main(source_directory):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source_text = '\n'.join(path.read_text(encoding='utf-8') for path in sorted((ROOT/'src').rglob('*'))
                            if path.is_file() and path.suffix in EXTENSIONS)
    source_text = re.sub(r'\\u\{([\da-fA-F]{1,6})\}|\\u([\da-fA-F]{4})',
                         lambda m: chr(int(m[1] or m[2], 16)), source_text)
    requested = {ord(char) for char in source_text if ord(char) >= 32}
    # Small, reusable coverage for Western text and common mathematical notation.
    for start,end in [(0x20,0x7e),(0xa0,0x24f),(0x370,0x3ff),(0x2000,0x206f),
                      (0x20a0,0x22ff),(0x3000,0x303f),(0xff00,0xffef)]:
        requested.update(range(start,end+1))
    manifest = {'schema':1, 'generator':f'fontTools {fontTools.__version__}', 'fonts':[]}
    specs = [('noto-serif-sc.ttf','field-serif-sc.woff2','Field Serif SC','Regular',{'wght':(400,500)},'400 500'),
             ('newsreader.ttf','field-serif.woff2','Field Serif','Regular',{'wght':400,'opsz':18},'400'),
             ('newsreader-italic.ttf','field-serif-italic.woff2','Field Serif','Italic',{'wght':400,'opsz':18},'400')]
    for source,filename,family,style,axes,weight in specs:
        path = source_directory/source
        data = path.read_bytes()
        if hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest() != SOURCES[source]:
            raise ValueError('Source does not match pinned official Git blob: '+source)
        font = TTFont(path, recalcTimestamp=False)
        options = subset.Options()
        options.name_IDs = ['*']  # Keep copyright, license and attribution.
        options.name_languages = ['*']
        options.recalc_timestamp = False
        worker = subset.Subsetter(options=options)
        worker.populate(unicodes=requested if source.startswith('noto-') else font.getBestCmap())
        worker.subset(font)
        font = instantiateVariableFont(font, axes, inplace=True)
        rename(font,family,style)
        font.flavor = 'woff2'
        font.save(OUTPUT/filename)
        # The manifest is derived from the actual saved WOFF2, not requested text.
        saved = TTFont(OUTPUT/filename)
        encoded = (OUTPUT/filename).read_bytes()
        manifest['fonts'].append({'file':filename,'family':family,'style':'italic' if style=='Italic' else 'normal',
                                  'weight':weight,'bytes':len(encoded),'sha256':hashlib.sha256(encoded).hexdigest(),
                                  'codepointRanges':ranges(saved.getBestCmap())})
        print(f'{filename}: {len(encoded):,} bytes, {len(saved.getBestCmap())} mapped code points')
    for source,target,sha in [('OFL-noto-serif-sc.txt','OFL-NotoSerifSC.txt','94d1bf7b52481343e2983fb7751e8b7abe1ea07b'),
                              ('OFL-newsreader.txt','OFL-Newsreader.txt','d2d4f407109e9c74b8ab502fc79b912408ab8e41')]:
        data = (source_directory/source).read_bytes()
        if hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest() != sha:
            raise ValueError('License does not match official source: '+source)
        (OUTPUT/target).write_bytes(data)
    (OUTPUT/'coverage.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print(f'Total WOFF2: {sum(font["bytes"] for font in manifest["fonts"]):,} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python scripts/subset-fonts.py /path/to/source-fonts')
    main(Path(sys.argv[1]))
