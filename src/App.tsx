import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './App.css'
import { reading, games } from './reading'
import { textbooks, classics, narratives } from './further-reading'
import { ProjectEntries } from './ProjectSection'
import { projects, projectsUpdated } from './projects'
import { BookTurn } from './BookTurn'
import type { TurnDirection } from './page-geometry'
import { usePageSwipe } from './usePageSwipe'

const github = 'https://github.com/Studyer-Tang'
const chapters = ['home', 'projects', 'research', 'reading', 'personal'] as const
type Chapter = (typeof chapters)[number]
const names = [['扉页', 'Preface'], ['项目案卷', 'Projects'], ['研究问题', 'Questions'], ['阅读札记', 'Reading'], ['关于与联系', 'About & contact']]
const researchProjects = projects.filter(p => p.repo === 'strategy-inference')
const mathProjects = projects.filter(p => ['advanced-mathematical-statistics-notes', 'learning-theory-to-optimization'].includes(p.repo))
const toolProjects = projects.filter(p => !researchProjects.includes(p) && !mathProjects.includes(p))
const featuredProject = researchProjects[0]

function readChapter(): Chapter {
  const params = new URLSearchParams(location.search)
  const query = params.get('chapter')
  if (chapters.includes(query as Chapter)) return query as Chapter
  if (params.get('page') === 'reading') return 'reading'
  const hash = location.hash.slice(1)
  return new Map<string, Chapter>([['software', 'projects'], ['research', 'research'], ['reading', 'reading'], ['education', 'personal'], ['contact', 'personal'], ['partner', 'personal']]).get(hash) || 'home'
}
function App() {
  const [language, setLanguage] = useState<'en' | 'zh'>(() => new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh')
  const [chapter, setChapter] = useState<Chapter>(readChapter)
  const [readingGroup, setReadingGroup] = useState(0)
  const [direction, setDirection] = useState<TurnDirection>(0)
  const [isTurning, setIsTurning] = useState(false)
  const bookRef = useRef<HTMLElement>(null)
  const focusAfterTurn = useRef(false)
  const route = useRef({ chapter, language })
  const focusPage = useCallback(() => {
    if (!focusAfterTurn.current) return
    focusAfterTurn.current = false
    requestAnimationFrame(() => bookRef.current?.querySelector<HTMLElement>('.book-spread [data-page-heading]')?.focus({ preventScroll: true }))
  }, [])
  const zh = language === 'zh'
  const t = (cn: string, en: string) => zh ? cn : en
  const chapterIndex = chapters.indexOf(chapter)
  const chapterName = names[chapterIndex][zh ? 0 : 1]
  const bookGroups = [
    { title: t('分析与统计', 'Analysis & statistics'), items: [...reading.filter(item => !item.title.en.includes('Historian')), ...textbooks] },
    { title: t('罗素与欧拉', 'Russell & Euler'), items: classics },
    { title: t('小说与历史', 'Fiction & history'), items: [...narratives, ...reading.filter(item => item.title.en.includes('Historian'))] },
    { title: t('游戏与推理', 'Games & deduction'), items: games },
  ]
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    const title = 'Studyer-Tang · ' + (language === 'zh' ? '研究手记' : 'Field notes') + ' / ' + chapterName
    const description = language === 'zh' ? 'Studyer-Tang 的研究手记：统计、金融市场、数学学习与开源研究工具。' : 'Field notes by Studyer-Tang on statistics, financial markets, mathematics and open-source research tools.'
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  }, [language, chapterName])
  useEffect(() => {
    const restore = () => {
      const next = { chapter: readChapter(), language: new URLSearchParams(location.search).get('lang') === 'en' ? 'en' as const : 'zh' as const }
      if (next.chapter === route.current.chapter && next.language === route.current.language) return
      route.current = next
      focusAfterTurn.current = true
      setDirection(0); setChapter(next.chapter); setLanguage(next.language)
    }
    const restoreHash = () => { if (location.hash !== '#content') restore() }
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restoreHash)
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restoreHash) }
  }, [])
  function navigate(next: Chapter, nextLanguage = language) {
    if (isTurning || (next === chapter && nextLanguage === language)) return
    const url = new URL(location.href)
    url.searchParams.set('lang', nextLanguage)
    if (next === 'home') url.searchParams.delete('chapter')
    else url.searchParams.set('chapter', next)
    if (next === 'reading') url.searchParams.set('page', 'reading')
    else url.searchParams.delete('page')
    url.hash = ''
    history.pushState(null, '', url)
    focusAfterTurn.current = true
    setDirection(nextLanguage !== language || next === chapter ? 0 : chapters.indexOf(next) > chapterIndex ? 1 : -1)
    route.current = { chapter: next, language: nextLanguage }
    setLanguage(nextLanguage); setChapter(next)
    requestAnimationFrame(() => {
      const book = document.getElementById('content')
      if (book) {
        const top = book.getBoundingClientRect().top + window.scrollY
        if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top - 12), behavior: 'instant' })
      }
    })
  }
  usePageSwipe(bookRef, step => {
    const next = chapters[chapterIndex + step]
    if (next) navigate(next)
  }, isTurning)
  const folio = (right: boolean) => <div className="folio"><span>{String(chapterIndex * 2 + (right ? 2 : 1)).padStart(2, '0')}</span></div>
  const leaf = (side: 'left' | 'right', children: ReactNode) => <section className={'leaf leaf-' + side + (chapter === 'home' ? ' leaf-preface' : '')} aria-label={t(side === 'left' ? '左页' : '右页', side + ' page')}>
    <div className="running-head"><span>{side === 'left' ? t('Studyer-Tang · 研究手记', 'Studyer-Tang · Notes') : chapterName}</span></div>
    <div className="leaf-content">{children}</div>{folio(side === 'right')}
  </section>
  const heading = (subtitle: string, title: string) => <><p className="eyebrow">{subtitle}</p><h2 data-page-heading tabIndex={-1} className="chapter-title">{title}</h2></>
  const group = bookGroups[readingGroup]
  const midpoint = Math.ceil(group.items.length / 2)
  const readingList = (start: number, end: number) => <ol className="reading-list" start={start + 1}>{group.items.slice(start, end).map((item, index) => <li key={item.title.en}><span className="entry-number" aria-hidden="true">{String(start + index + 1).padStart(2, '0')}</span><div><h3>{item.url ? <a href={item.url}>{item.title[language]} ↗</a> : item.title[language]}</h3><span className="reading-credit">{item.credit}</span><p>{item.description[language]}</p></div></li>)}</ol>
  return <>
    <a className="skip-link" href="#content" onClick={e => {
      e.preventDefault()
      const url = new URL(location.href)
      url.searchParams.set('lang', language)
      url.searchParams.set('chapter', chapter)
      url.hash = 'content'
      history.pushState(null, '', url)
      const book = document.getElementById('content')
      book?.focus({ preventScroll: true })
      book?.scrollIntoView({ block: 'start' })
    }}>{t('跳转到书页', 'Skip to the book')}</a>
    <div className="desk">
      <header className="masthead"><a href={'?lang=' + language} onClick={e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); navigate('home') } }} className="brand"><span>Studyer-Tang<span className="brand-sub">{t('个人主页', 'Personal homepage')}</span></span></a><div className="header-links"><a href={github}>GitHub ↗</a><div className="languages" aria-label={t('语言', 'Language')}><button disabled={isTurning} aria-pressed={zh} onClick={() => navigate(chapter, 'zh')}>中</button><span>/</span><button disabled={isTurning} aria-pressed={!zh} onClick={() => navigate(chapter, 'en')}>EN</button></div></div></header>
      <nav className="bookmarks" aria-label={t('书册目录', 'Book contents')}>{chapters.map((item, index) => <a key={item} href={'?lang=' + language + (item === 'home' ? '' : '&chapter=' + item)} aria-current={chapter === item ? 'page' : undefined} aria-disabled={isTurning || undefined} onClick={e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); navigate(item) } }}><span>{String(index).padStart(2, '0')}</span>{names[index][zh ? 0 : 1]}</a>)}</nav>
      <main ref={bookRef} id="content" tabIndex={-1} className="book" aria-busy={isTurning} aria-label={t('Studyer-Tang 的研究手记', 'Studyer-Tang’s field notes')}><BookTurn pageKey={language + ":" + chapter + ":" + readingGroup} language={language} direction={direction} onBusyChange={setIsTurning} onSettled={focusPage}>
        {chapter === 'home' && <>
          {leaf('left', <div className="title-page">
            <p className="title-edition">{t('个人手记', 'Personal notes')}</p>
            <h1 data-page-heading tabIndex={-1}>Studyer-Tang</h1>
            <h2 className="book-title">{t('研究手记', 'A Research Notebook')}</h2>
            <p className="title-subtitle">{t('数学、统计与研究工具', 'Mathematics, statistics and research tools')}</p>
            {featuredProject && <div className="title-project"><span>{t('代表项目', 'Selected work')}</span><a href={featuredProject.url}>{featuredProject.name[zh ? 0 : 1]} ↗</a></div>}
            <div className="title-themes"><p>{t('开放研究', 'Open research')}</p><p>{t('可复现实验 · 开源工具', 'Reproducible experiments · Open-source tools')}</p></div>
            <p className="title-year">2026</p>
          </div>)}
          {leaf('right', <>
            <h2 className="preface-title" data-page-heading tabIndex={-1}>{t('自序', 'Preface')}</h2>
            <div className="book-prose">
              <p>{t('我关注统计学及其在金融市场中的应用，尤其是高频股票数据、市场微观结构与短期预测。', 'My interests are in statistics and its applications to financial markets, particularly high-frequency equity data, market microstructure and short-horizon prediction.')}</p>
              <p>{t('我主要维护三项作品：用于时序预测比较与不确定性分析的 strategy-inference、配有推导与数值实验的学习理论笔记，以及保存原文和出处的 Academic Clipboard。代码、例子与使用边界列在项目页。', 'My main projects are strategy-inference for time-series forecast comparison and uncertainty analysis, learning theory notes with derivations and numerical experiments, and Academic Clipboard for keeping excerpts with their sources. The project pages link to code, examples and their scope of use.')}</p>
              <p>{t('高等统计学笔记记录课程中的定义、证明和例题；其他程序处理论文排版与学术演示中的具体问题。我把研究兴趣另列一章，作为仍需探索的问题。', 'My statistics notes record definitions, proofs and examples from coursework. Other programs address thesis formatting and academic presentations. Research interests have their own chapter, as questions still to explore.')}</p>
              <p>{t('学习之外，我喜欢分析学、历史与推理，尤其喜欢罗素与欧拉的著作。书与游戏的选读线索留在后面的阅读页。', 'Outside my studies, I enjoy analysis, history and deductive reasoning, especially the works of Russell and Euler. Reading suggestions and games appear in the later pages.')}</p>
            </div>
            <div className="contents-heading">{t('本册目录', 'Contents')}</div>
            <ol className="contents-list">
              {chapters.slice(1).map((item, index) => <li key={item}><button onClick={() => navigate(item)}><span>{names[index + 1][zh ? 0 : 1]}</span><span className="contents-leader" aria-hidden="true"/><span>{String((index + 1) * 2 + 1).padStart(2, '0')}</span></button></li>)}
            </ol>
          </>)}
        </>}
        {chapter === 'projects' && <>
          {leaf('left', <>{heading(t('第一节', 'Section I'), t('统计研究工具', 'Statistical software'))}<p>{t('先检查信息何时可得，再比较预测与不确定性。库的假设、适用范围和可复现示例列在文档中。', 'Establish when information is available, then compare forecasts and uncertainty. The documentation sets out assumptions, scope and reproducible examples.')}</p><ProjectEntries entries={researchProjects} zh={zh} /><div className="project-group-heading"><p className="eyebrow">{t('第二节', 'Section II')}</p><h2>{t('数学训练', 'Mathematical study')}</h2></div><ProjectEntries entries={mathProjects} zh={zh} offset={researchProjects.length} /></>)}
          {leaf('right', <><p className="eyebrow">{t('第三节', 'Section III')}</p><h2 className="chapter-title">{t('实用工具', 'Practical tools')}</h2><p>{t('从保存原文与出处，到论文排版和学术演示。每项的使用方式与适用边界，以仓库文档为准。', 'From keeping excerpts and sources to formatting theses and presenting research. Each repository documents its use and limitations.')}</p><ProjectEntries entries={toolProjects} zh={zh} offset={researchProjects.length + mathProjects.length} /><div className="catalog-note"><span>{t('资料变更', 'Catalog changed')} <time dateTime={projectsUpdated}>{projectsUpdated}</time></span><a href={github + '?tab=repositories'}>{t('全部公开仓库', 'All public repositories')} ↗</a></div></>)}
        </>}
        {chapter === 'research' && <>
          {leaf('left', <>{heading(t('问题 01 / 市场', 'Question 01 / Markets'), t('市场中的信息', 'Information in markets'))}<p className="lead">{t('逐笔交易、报价和订单流中，哪些信息有助于理解短期价格变化？', 'What information in trades, quotes and order flow helps explain short-horizon price changes?')}</p><p>{t('我希望理解交易机制如何影响观测数据、价格变化与流动性，再考虑如何构造预测特征。这里记录的是研究兴趣与待探索的问题。', 'I would like to understand how trading mechanisms shape observations, price changes and liquidity, and then consider how to construct predictive features. These are research interests and questions to explore.')}</p><aside className="annotation"><span>{t('关于信息的时间', 'Information timing')}</span><p>{t('先确认信息何时可得，再讨论模型能知道什么。', 'Establish when information is available before asking what a model can know.')}</p></aside></>)}
          {leaf('right', <><p className="eyebrow">{t('问题 02—03 / 检验', 'Questions 02–03 / Evaluation')}</p><h2 className="chapter-title">{t('预测与检验', 'Prediction and evaluation')}</h2><article className="question-entry"><span className="entry-meta">02 / {t('统计学习', 'Statistical learning')}</span><h3>{t('信号的稳定性', 'Signal stability')}</h3><p>{t('预测信号能否跨越不同股票、时段和市场状态，保持样本外表现？我关注特征构造、预测时间尺度和模型复杂度之间的关系。', 'Do signals retain out-of-sample performance across stocks, time periods and market conditions? I am interested in the relationship between feature construction, forecast horizons and model complexity.')}</p></article><article className="question-entry"><span className="entry-meta">03 / {t('非平稳环境', 'Nonstationary settings')}</span><h3>{t('精度之外的经济意义', 'Economic meaning beyond accuracy')}</h3><p>{t('在严格的时间划分与成本假设下，模型提升是否仍然成立？时间依赖、数据处理、交易成本与流动性约束都需要进入评估。', 'Do improvements survive chronological evaluation and realistic cost assumptions? Temporal dependence, data processing, transaction costs and liquidity constraints all belong in the evaluation.')}</p></article><div className="ruled-heading"><h3>{t('检查清单', 'Working standards')}</h3><span>METHOD</span></div><ol className="standards"><li>{t('尊重信息可得时间，检查数据泄漏。', 'Respect information timing; check for leakage.')}</li><li>{t('明确基准，采用样本外检验。', 'State baselines and evaluate out of sample.')}</li><li>{t('写清假设、处理过程与结果边界。', 'Document assumptions, processing and limitations.')}</li><li>{t('让分析能够被复现，也能被质疑。', 'Make the analysis reproducible and open to challenge.')}</li></ol></>)}
        </>}
        {chapter === 'reading' && <>
          {leaf('left', <>{heading(t('札记 / 书与游戏', 'Notes / Books & games'), group.title)}<p>{t('我喜欢分析学、历史与推理，尤其喜欢罗素与欧拉。这里是一份选读与兴趣清单，尚不代表完成记录。', 'I enjoy analysis, history and deductive reasoning, especially Russell and Euler. This is a collection of reading suggestions and interests, rather than a completed reading log.')}</p><div className="reading-tabs" role="group" aria-label={t('阅读分类', 'Reading categories')}>{bookGroups.map((g, i) => <button key={g.title} disabled={isTurning} aria-pressed={readingGroup === i} onClick={() => { setDirection(0); setReadingGroup(i) }}>{g.title}</button>)}</div>{readingList(0, midpoint)}</>)}
          {leaf('right', <><p className="eyebrow">{t('接续左页', 'Continued from the facing page')}</p><h2 className="chapter-title">{t('续页', 'Continued')}</h2>{readingList(midpoint, group.items.length)}</>)}
        </>}
        {chapter === 'personal' && <>
          {leaf('left', <>{heading(t('附记 / 开放工作', 'Postscript / Open work'), t('关于本册', 'About this notebook'))}<div className="about-entry"><h3>{t('公开项目与学习记录', 'Public projects and study notes')}</h3><p>{t('这里汇集统计、金融市场与数学学习中的问题，以及围绕这些问题编写的开源工具。', 'This notebook brings together questions in statistics, financial markets and mathematics, alongside open-source tools built around them.')}</p><p>{t('项目页提供代码、可复现例子与适用边界；阅读页保留书目作者与出版信息。', 'The project pages link to code, reproducible examples and their scope of use. Reading entries retain authors and publication details.')}</p><a className="quiet-link" href={github + '?tab=repositories'}>{t('浏览公开仓库', 'Browse public repositories')} ↗</a></div></>)}
          {leaf('right', <><p className="eyebrow">{t('联系 / 项目反馈', 'Contact / Project feedback')}</p><h2 className="chapter-title">{t('通过 GitHub 联系', 'Contact via GitHub')}</h2><p className="lead">{t('使用中遇到问题、发现错误，或希望讨论改进，请在相应项目的 GitHub Issues 中留言。', 'For questions, errors or suggested improvements, open an issue in the relevant project on GitHub.')}</p><a className="contact-link" href={github + '/Studyer-Tang.github.io/issues'}>{t('主页反馈与联系', 'Homepage feedback & contact')} ↗</a><a className="quiet-link" href={github}>GitHub / Studyer-Tang ↗</a><div className="colophon"><h3>{t('关于这册手记', 'About this notebook')}</h3><p>{t('以公开代码、实验与文档记录工作。项目信息由公开仓库同步；书目保留作者与出版信息。', 'Work is documented through public code, experiments and notes. Project information is synchronized from public repositories; reading entries retain authors and publication details.')}</p><a href={github + '/Studyer-Tang.github.io'}>{t('查看主页源代码', 'View the homepage source')} ↗</a></div></>)}
        </>}
      </BookTurn><div className="book-binding" aria-hidden="true" /></main>
      <div className="page-controls"><button disabled={isTurning || chapterIndex === 0} onClick={() => navigate(chapters[chapterIndex - 1])}>← {t('上一章', 'Previous chapter')}</button><span>{String(chapterIndex + 1).padStart(2, '0')} / 05 <span className="control-name">· {chapterName}</span></span><button disabled={isTurning || chapterIndex === chapters.length - 1} onClick={() => navigate(chapters[chapterIndex + 1])}>{t('下一章', 'Next chapter')} →</button></div>
      <p className="gesture-hint">{t('双指左右轻扫书页，即可翻章', 'Swipe left or right with two fingers over the book to turn chapters')}</p>
      <footer><span>© Studyer-Tang</span><a href={github + '/Studyer-Tang.github.io'}>{t('源代码', 'Source')} ↗</a></footer>
    </div>
  </>
}
export default App
