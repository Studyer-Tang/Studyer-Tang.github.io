import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { reading, games } from './reading'
import { textbooks, classics, narratives } from './further-reading'
import { literature } from './literature'
import { interests } from './interests'
import { researchDirections, researchIntro } from './research'
import { chapters, readRoute, routeHref } from './navigation'
import type { Chapter, Language } from './navigation'
import { usePageSwipe } from './usePageSwipe'
import { Scenery } from './Scenery'
import './App.css'
import './Interests.css'

const github = 'https://github.com/Studyer-Tang'
const names = {
  home: ['首页', 'Home'], interests: ['个人兴趣', 'Interests'], research: ['研究兴趣', 'Research'],
  reading: ['阅读书架', 'Reading'], personal: ['关于我', 'About'],
}
const subtitles = {
  home: ['山水之间，保持好奇。', 'Stay curious. Take the long view.'],
  interests: ['那些让我愿意多想一会儿的事。', 'Things I like to spend a little more time thinking about.'],
  research: ['我关心的问题，以及希望逐步理解的方向。', 'Questions I care about, and directions I hope to understand.'],
  reading: ['在书与推理中，拓宽看待世界的方式。', 'Books and deduction offer other ways to see.'],
  personal: ['一点兴趣，一些常常回到的问题。', 'A few interests, and questions I keep returning to.'],
}
const principles = [
  ['信息何时可得', 'Respect information timing'], ['基准是否公平', 'Use fair baselines'],
  ['结果能否复现', 'Make results reproducible'], ['边界是否清楚', 'State the limits'],
]

function App() {
  const [{ chapter, language }, setRoute] = useState(() => readRoute(new URL(location.href)))
  const [readingGroup, setReadingGroup] = useState(0)
  const mainRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusAfterNavigation = useRef(false)
  const zh = language === 'zh'
  const t = (cn: string, en: string) => zh ? cn : en
  const label = (key: Chapter) => names[key][zh ? 0 : 1]
  const chapterIndex = chapters.indexOf(chapter)
  const bookGroups = [
    { title: t('史书与诗文', 'History & classical writing'), items: literature },
    { title: t('分析与统计', 'Analysis & statistics'), items: [...reading.filter(item => !item.title.en.includes('Historian')), ...textbooks] },
    { title: t('罗素与欧拉', 'Russell & Euler'), items: classics },
    { title: t('小说与历史', 'Fiction & history'), items: [...narratives, ...reading.filter(item => item.title.en.includes('Historian'))] },
    { title: t('游戏与推理', 'Games & deduction'), items: games },
  ]
  const group = bookGroups[readingGroup]

  useEffect(() => {
    const restore = () => {
      const next = readRoute(new URL(location.href))
      setRoute(previous => {
        if (previous.chapter === next.chapter && previous.language === next.language) return previous
        focusAfterNavigation.current = true
        return next
      })
    }
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restore)
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore) }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    const title = `Studyer-Tang · ${names[chapter][language === 'zh' ? 0 : 1]}`
    const description = language === 'zh'
      ? 'Studyer-Tang 的个人空间：古文史书、诗词散文、数学与推理，以及统计与金融市场中的研究兴趣。'
      : 'A personal space by Studyer-Tang: history, poetry, classical prose, mathematics, deduction, and research interests in statistics and financial markets.'
    document.title = title
    for (const [selector, value] of [['meta[name="description"]', description], ['meta[property="og:title"]', title], ['meta[property="og:description"]', description]]) {
      document.querySelector(selector)?.setAttribute('content', value)
    }
    if (focusAfterNavigation.current) {
      focusAfterNavigation.current = false
      headingRef.current?.focus({ preventScroll: true })
    }
  }, [chapter, language])

  const navigate = useCallback((next: Chapter, nextLanguage: Language = language) => {
    if (chapter === next && language === nextLanguage) return
    history.pushState(null, '', routeHref(next, nextLanguage))
    focusAfterNavigation.current = true
    setRoute({ chapter: next, language: nextLanguage })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [chapter, language])

  usePageSwipe(mainRef, step => {
    const next = chapters[chapterIndex + step]
    if (next) navigate(next)
  })

  const follow = (event: MouseEvent<HTMLAnchorElement>, next: Chapter) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(next)
  }
  const navLink = (key: Chapter, numbered = false) => <a key={key} href={routeHref(key, language)} aria-current={chapter === key ? 'page' : undefined} onClick={event => follow(event, key)}>
    {numbered && <span className="nav-index" aria-hidden="true">{String(chapters.indexOf(key)).padStart(2, '0')}</span>}{label(key)}
  </a>

  return <div className={'site ' + (chapter === 'home' ? 'site-cover' : 'site-inner')}>
    <a className="skip-link" href={routeHref(chapter, language) + '#content'} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      history.pushState(null, '', routeHref(chapter, language) + '#content')
      mainRef.current?.focus({ preventScroll: true })
      mainRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }}>{t('跳到正文', 'Skip to content')}</a>
    <header className="site-header">
      <a className="brand" href={routeHref('home', language)} onClick={event => follow(event, 'home')} aria-label={t('Studyer-Tang 首页', 'Studyer-Tang home')}><span className="brand-mark" aria-hidden="true">st.</span><span className="brand-caption">STUDYER-TANG<span>FIELD NOTES</span></span></a>
      {chapter !== 'home' && <nav className="header-nav" aria-label={t('主导航', 'Main navigation')}>{chapters.map(key => navLink(key))}</nav>}
      <div className="header-tools"><div className="languages" aria-label={t('语言', 'Language')}><button type="button" aria-pressed={zh} onClick={() => navigate(chapter, 'zh')}>中</button><span aria-hidden="true">/</span><button type="button" aria-pressed={!zh} onClick={() => navigate(chapter, 'en')}>EN</button></div></div>
    </header>

    <main ref={mainRef} id="content" tabIndex={-1}>
      {chapter === 'home' ? <section className="cover" aria-label={t('个人主页封面', 'Personal homepage cover')}>
        <div className="cover-identity"><span className="identity-monogram" aria-hidden="true">st.</span><span className="identity-caption">READ · THINK · EXPLORE</span></div>
        <h1 ref={headingRef} tabIndex={-1}>Studyer-Tang</h1>
        <p className="cover-motto">{subtitles.home[zh ? 0 : 1]}</p>
        <div className="cover-rule" aria-hidden="true" />
        <p className="cover-description">{t('喜欢古文史书与诗词散文，也喜欢数学与推理。', 'History, poetry, classical prose, mathematics and deduction.')}</p>
        <nav className="cover-nav" aria-label={t('探索主页', 'Explore the site')}>{chapters.slice(1).map(key => navLink(key, true))}</nav>
      </section> : <section className="content-panel" key={chapter} aria-labelledby="page-title">
        <header className="page-heading"><p className="eyebrow">{String(chapterIndex).padStart(2, '0')} <span>/</span> {['', 'PERSONAL INTERESTS', 'RESEARCH INTERESTS', 'THE BOOKSHELF', 'A LITTLE ABOUT ME'][chapterIndex]}</p><h1 id="page-title" ref={headingRef} tabIndex={-1}>{label(chapter)}</h1><p className="page-subtitle">{subtitles[chapter][zh ? 0 : 1]}</p></header>

        {chapter === 'interests' && <>
          <p className="interests-intro">{t('有些兴趣通向研究，有些只是因为喜欢。它们让我乐于停下来观察、阅读，再多想一会儿。', 'Some interests lead to research; others are simply things I enjoy. I like taking time to read, observe and think them through.')}</p>
          <ol className="interests-list">{interests.map((interest, index) => <li className="interest-entry" key={interest.id}><span className="entry-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h2>{interest.title[language]}</h2><p>{interest.description[language]}</p></div></li>)}</ol>
        </>}

        {chapter === 'research' && <>
          <p className="research-intro">{researchIntro[language]}</p>
          <div className="research-directions">{researchDirections.map((direction, index) => <article className="research-entry" key={direction.id}>
            <span className="entry-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div><p className="entry-kicker">{t('关注方向', 'DIRECTION')}</p><h2>{direction.title[language]}</h2><p className="research-question">{direction.question[language]}</p>
              <details><summary>{t('研究路径与下一步', 'Approach & next steps')}<span aria-hidden="true">+</span></summary><div className="research-plan">
                <div><h3>{t('方法', 'Methods')}</h3><p>{direction.methods[language]}</p></div>
                <div><h3>{t('起点', 'First experiment')}</h3><p>{direction.experiment[language]}</p></div>
                <div><h3>{t('评估', 'Evaluation')}</h3><p>{direction.evaluation[language]}</p></div>
                <div><h3>{t('边界', 'Scope')}</h3><p>{direction.boundary[language]}</p></div>
              </div></details>
            </div>
          </article>)}</div>
          <aside className="working-notes"><span className="eyebrow">{t('工作原则', 'WORKING PRINCIPLES')}</span><ol>{principles.map(([cn, en], index) => <li key={en}><span>{String(index + 1).padStart(2, '0')}</span>{t(cn, en)}</li>)}</ol></aside>
        </>}

        {chapter === 'reading' && <>
          <p className="reading-intro">{t('喜欢读古文史书，也喜欢有节奏、有余韵的诗词散文；分析学与推理也常让我停下来思考。这里是一份选读与兴趣清单，并非已读完的记录。', 'I enjoy historical writing, classical prose and poetry with rhythm and resonance, alongside analysis and deduction. These are reading suggestions and interests, not a completed reading log.')}</p>
          <div className="reading-tabs" role="group" aria-label={t('阅读分类', 'Reading categories')}>{bookGroups.map((item, index) => <button type="button" key={item.title} aria-pressed={readingGroup === index} onClick={() => setReadingGroup(index)}>{item.title}</button>)}</div>
          <h2 className="reading-group-title">{group.title}<span>{String(group.items.length).padStart(2, '0')}</span></h2>
          <ol className="reading-list">{group.items.map((item, index) => <li key={item.title.en}><span className="entry-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h3>{item.url ? <a href={item.url}>{item.title[language]} <span aria-hidden="true">↗</span></a> : item.title[language]}</h3><p className="reading-credit">{item.credit}</p><p>{item.description[language]}</p></div></li>)}</ol>
        </>}

        {chapter === 'personal' && <div className="about-layout">
          <div className="about-prose"><p className="about-lead">{t('读史看人事，读文听声韵。', 'History for its people and contexts; poetry and prose for their rhythm.')}</p><p>{t('我很喜欢历史，尤其喜欢读古文史书，沿着时代与人物的线索理解事情的来龙去脉。诗词与散文中那些朗朗上口的句子，也常让我愿意反复品读。', 'I enjoy history, especially classical historical writing that follows people and events in their context. I am also drawn to the cadence of poetry and prose, and to passages that reward rereading aloud.')}</p><p>{t('数学、分析学与推理是另一面兴趣。研究页整理我在统计与金融市场中关心的问题，书架则留下古文、史书、诗文和其他选读线索。', 'Mathematics, analysis and deduction are another side of my interests. The research page gathers questions I care about in statistics and financial markets; the bookshelf collects history, classical writing, poetry and other reading interests.')}</p><div className="about-signature">Studyer-Tang<span>{t('保持好奇，慢慢求证。', 'Stay curious. Test carefully.')}</span></div></div>
          <aside className="contact-block"><p className="eyebrow">SAY HELLO</p><h2>{t('保持交流', 'Keep in touch')}</h2><p>{t('读到一本好书、想到一个有趣的问题，或想交流某个研究方向，都欢迎留言。', 'A good book, an interesting question, or a research direction you would like to discuss: feel free to say hello.')}</p><a className="contact-link" href={github}>GitHub <span aria-hidden="true">↗</span></a><a className="text-link" href={github + '/Studyer-Tang.github.io/issues'}>{t('留言与交流', 'Leave a note')} <span aria-hidden="true">↗</span></a></aside>
        </div>}
      </section>}
    </main>

    {chapter !== 'home' && <nav className="chapter-controls" aria-label={t('切换栏目', 'Change section')}>{chapterIndex > 0 ? <a href={routeHref(chapters[chapterIndex - 1], language)} onClick={event => follow(event, chapters[chapterIndex - 1])}>← {label(chapters[chapterIndex - 1])}</a> : <span />}<span>{String(chapterIndex + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</span>{chapterIndex < chapters.length - 1 ? <a href={routeHref(chapters[chapterIndex + 1], language)} onClick={event => follow(event, chapters[chapterIndex + 1])}>{label(chapters[chapterIndex + 1])} →</a> : <span />}</nav>}
    <footer className="site-footer"><span>© {new Date().getFullYear()} Studyer-Tang</span><p className="gesture-hint">{t('触控板双指左右轻扫，切换栏目', 'Swipe with two fingers to change sections')}</p></footer>
    <Scenery language={language} />
  </div>
}

export default App
