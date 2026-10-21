export const chapters = ['home', 'projects', 'research', 'reading', 'personal'] as const
export type Chapter = (typeof chapters)[number]
export type Language = 'zh' | 'en'
export type Route = { chapter: Chapter; language: Language }

const aliases = new Map<string, Chapter>([
  ['software', 'projects'], ['research', 'research'], ['reading', 'reading'],
  ['education', 'personal'], ['contact', 'personal'], ['partner', 'personal'],
])

export function readRoute(url: URL): Route {
  const query = url.searchParams.get('chapter')
  const chapter = chapters.includes(query as Chapter) ? query as Chapter
    : url.searchParams.get('page') === 'reading' ? 'reading'
      : aliases.get(url.hash.slice(1)) ?? 'home'
  return { chapter, language: url.searchParams.get('lang') === 'en' ? 'en' : 'zh' }
}

export function routeHref(chapter: Chapter, language: Language): string {
  const params = new URLSearchParams({ lang: language })
  if (chapter !== 'home') params.set('chapter', chapter)
  return '?' + params.toString()
}
