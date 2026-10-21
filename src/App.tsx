import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { reading, games } from './reading'
import { textbooks, classics, narratives } from './further-reading'
import { ProjectEntries } from './ProjectSection'
import { projects, projectsUpdated } from './projects'
import { researchDirections, researchIntro } from './research'
import { chapters, readRoute, routeHref } from './navigation'
import type { Chapter, Language } from './navigation'
import { usePageSwipe } from './usePageSwipe'
import { Scenery } from './Scenery'
import './App.css'

const github = 'https://github.com/Studyer-Tang'
const names = {
  home: ['首页', 'Home'], projects: ['开源项目', 'Projects'], research: ['研究手记', 'Research'],
  reading: ['阅读书架', 'Reading'], personal: ['关于我', 'About'],
}
const subtitles = {
  home: ['山水之间，保持好奇。', 'Stay curious. Take the long view.'],
  projects: ['把想法写成可以运行、可以检验的工具。', 'Ideas made runnable, inspectable and useful.'],
  research: ['从一个清晰的问题，走向一次可靠的检验。', 'From a clear question to a careful test.'],
  reading: ['在书与推理中，拓宽看待世界的方式。', 'Books and deduction offer other ways to see.'],
  personal: ['在学习、求证与创造之间，慢慢前行。', 'Learning, testing and making, one step at a time.'],
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
  const featured = projects.find(project => project.repo === 'strategy-inference') ?? projects[0]
  const bookGroups = [
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
      ? 'Studyer-Tang 的个人主页：统计与金融市场、机器学习、开源项目与阅读札记。'
      : 'The personal site of Studyer-Tang: statistics, financial markets, machine learning, open-source projects and reading notes.'
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
      <div className="header-tools"><a className="github-link" href={github}>GitHub <span aria-hidden="true">↗</span></a><div className="languages" aria-label={t('语言', 'Language')}><button type="button" aria-pressed={zh} onClick={() => navigate(chapter, 'zh')}>中</button><span aria-hidden="true">/</span><button type="button" aria-pressed={!zh} onClick={() => navigate(chapter, 'en')}>EN</button></div></div>
    </header>

    <main ref={mainRef} id="content" tabIndex={-1}>
      {chapter === 'home' ? <section className="cover" aria-label={t('个人主页封面', 'Personal homepage cover')}>
        <div className="cover-identity"><span className="identity-monogram" aria-hidden="true">st.</span><span className="identity-caption">THINK · EXPLORE · CREATE</span></div>
        <h1 ref={headingRef} tabIndex={-1}>Studyer-Tang</h1>
        <p className="cover-motto">{subtitles.home[zh ? 0 : 1]}</p>
        <div className="cover-rule" aria-hidden="true" />
        <p className="cover-description">{t('记录研究问题，编写开源工具，收藏值得反复阅读的书。', 'Research questions, open-source tools, and books worth returning to.')}</p>
        <nav className="cover-nav" aria-label={t('探索主页', 'Explore the site')}>{chapters.slice(1).map(key => navLink(key, true))}</nav>
        {featured && <a className="featured-link" href={featured.url}><span>{t('正在打磨', 'IN PROGRESS')}</span>{featured.name[zh ? 0 : 1]} <span aria-hidden="true">↗</span></a>}
      </section> : <section className="content-panel" key={chapter} aria-labelledby="page-title">
        <header className="page-heading"><p className="eyebrow">{String(chapterIndex).padStart(2, '0')} <span>/</span> {['', 'SELECTED WORK', 'RESEARCH NOTES', 'THE BOOKSHELF', 'A LITTLE ABOUT ME'][chapterIndex]}</p><h1 id="page-title" ref={headingRef} tabIndex={-1}>{label(chapter)}</h1><p className="page-subtitle">{subtitles[chapter][zh ? 0 : 1]}</p></header>

        {chapter === 'projects' && <>
          <div className="section-meta"><span>{String(projects.length).padStart(2, '0')} {t('个公开项目', 'public projects')}</span><span>{t('资料变更', 'Catalog changed')} <time dateTime={projectsUpdated}>{projectsUpdated}</time></span></div>
          <ProjectEntries entries={projects} zh={zh} />
          <a className="text-link panel-outro" href={github + '?tab=repositories'}>{t('浏览全部公开仓库', 'Browse all public repositories')} <span aria-hidden="true">↗</span></a>
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
          <p className="reading-intro">{t('偏爱分析学、历史与推理，也常回到罗素和欧拉的书里。这是一份选读与兴趣清单，并非已读完的记录。', 'I am drawn to analysis, history and deduction, and often return to Russell and Euler. These are reading suggestions and interests, not a completed reading log.')}</p>
          <div className="reading-tabs" role="group" aria-label={t('阅读分类', 'Reading categories')}>{bookGroups.map((item, index) => <button type="button" key={item.title} aria-pressed={readingGroup === index} onClick={() => setReadingGroup(index)}>{item.title}</button>)}</div>
          <h2 className="reading-group-title">{group.title}<span>{String(group.items.length).padStart(2, '0')}</span></h2>
          <ol className="reading-list">{group.items.map((item, index) => <li key={item.title.en}><span className="entry-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h3>{item.url ? <a href={item.url}>{item.title[language]} <span aria-hidden="true">↗</span></a> : item.title[language]}</h3><p className="reading-credit">{item.credit}</p><p>{item.description[language]}</p></div></li>)}</ol>
        </>}

        {chapter === 'personal' && <div className="about-layout">
          <div className="about-prose"><p className="about-lead">{t('把复杂的问题拆开，把能验证的部分写成代码。', 'Break complex questions into parts. Turn what can be tested into code.')}</p><p>{t('这个站点记录我在统计、金融市场与机器学习之间的学习和尝试。对我而言，模型的价值不仅在于拟合得多好，也在于它回答了什么问题、依赖什么假设。', 'This site records my learning and experiments across statistics, financial markets and machine learning. I care about what a model answers and which assumptions it relies on, alongside how well it fits.')}</p><p>{t('我也喜欢分析学、历史与推理。阅读让问题变得宽一些，写代码则让想法变得具体一些。这里的项目、研究手记和书架，是这两种习惯留下的痕迹。', 'I also enjoy analysis, history and deduction. Reading broadens a question; writing code makes an idea concrete. The projects, research notes and bookshelf here are traces of both habits.')}</p><div className="about-signature">Studyer-Tang<span>{t('保持好奇，慢慢求证。', 'Stay curious. Test carefully.')}</span></div></div>
          <aside className="contact-block"><p className="eyebrow">SAY HELLO</p><h2>{t('保持交流', 'Keep in touch')}</h2><p>{t('问题、勘误、使用反馈，或一个值得继续讨论的想法。欢迎通过 GitHub 联系。', 'Questions, corrections, feedback, or an idea worth discussing: find me on GitHub.')}</p><a className="contact-link" href={github}>GitHub <span aria-hidden="true">↗</span></a><a className="text-link" href={github + '/Studyer-Tang.github.io/issues'}>{t('主页反馈', 'Site feedback')} <span aria-hidden="true">↗</span></a></aside>
        </div>}
      </section>}
    </main>

    {chapter !== 'home' && <nav className="chapter-controls" aria-label={t('切换栏目', 'Change section')}>{chapterIndex > 0 ? <a href={routeHref(chapters[chapterIndex - 1], language)} onClick={event => follow(event, chapters[chapterIndex - 1])}>← {label(chapters[chapterIndex - 1])}</a> : <span />}<span>{String(chapterIndex + 1).padStart(2, '0')} / 05</span>{chapterIndex < chapters.length - 1 ? <a href={routeHref(chapters[chapterIndex + 1], language)} onClick={event => follow(event, chapters[chapterIndex + 1])}>{label(chapters[chapterIndex + 1])} →</a> : <span />}</nav>}
    <footer className="site-footer"><span>© {new Date().getFullYear()} Studyer-Tang <span className="footer-separator">/</span> <a href={github + '/Studyer-Tang.github.io'}>{t('源代码', 'Source')} ↗</a></span><p className="gesture-hint">{t('触控板双指左右轻扫，切换栏目', 'Swipe with two fingers to change sections')}</p></footer>
    <Scenery language={language} />
  </div>
}

export default App
