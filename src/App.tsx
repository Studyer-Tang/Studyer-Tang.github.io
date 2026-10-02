import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './App.css'
import { reading, games } from './reading'
import { textbooks, classics, narratives } from './further-reading'
import { ProjectEntries } from './ProjectSection'
import { projects, projectsUpdated } from './projects'

const github = 'https://github.com/Studyer-Tang'
const email = 'phdstudytang@gmail.com'
const chapters = ['home', 'projects', 'research', 'reading', 'personal'] as const
type Chapter = (typeof chapters)[number]
const names = [['扉页', 'Preface'], ['项目案卷', 'Projects'], ['研究问题', 'Questions'], ['阅读札记', 'Reading'], ['个人与联系', 'Personal']]
const mathProjects = projects.filter(p => ['advanced-mathematical-statistics-notes', 'learning-theory-to-optimization'].includes(p.repo))
const toolProjects = projects.filter(p => !mathProjects.includes(p))

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
  const [turn, setTurn] = useState(0)
  const pageHeading = useRef<HTMLHeadingElement>(null)
  const zh = language === 'zh'
  const t = (cn: string, en: string) => zh ? cn : en
  const chapterIndex = chapters.indexOf(chapter)
  const chapterName = names[chapterIndex][zh ? 0 : 1]
  const university = t('北京大学', 'Peking University')
  const school = t('数学科学学院', 'School of Mathematical Sciences')
  const bookGroups = [
    { title: t('分析与统计', 'Analysis & statistics'), items: [...reading.filter(item => !item.title.en.includes('Historian')), ...textbooks] },
    { title: t('罗素与欧拉', 'Russell & Euler'), items: classics },
    { title: t('小说与历史', 'Fiction & history'), items: [...narratives, ...reading.filter(item => item.title.en.includes('Historian'))] },
    { title: t('游戏与推理', 'Games & deduction'), items: games },
  ]
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    const title = 'Qingjun · ' + (language === 'zh' ? '研究手记' : 'Field notes') + ' / ' + chapterName
    const description = language === 'zh' ? 'Qingjun，北京大学数学科学学院本科生。关于统计、金融市场、数学学习与研究工具的个人手记。' : 'Qingjun, an undergraduate at Peking University. Personal notes on statistics, financial markets, mathematics and research tools.'
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
  }, [language, chapterName])
  useEffect(() => {
    const restore = () => { setChapter(readChapter()); setLanguage(new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh'); setTurn(n => n + 1) }
    const restoreHash = () => { if (location.hash !== '#content') restore() }
    window.addEventListener('popstate', restore)
    window.addEventListener('hashchange', restoreHash)
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restoreHash) }
  }, [])
  function navigate(next: Chapter, nextLanguage = language) {
    if (next === chapter && nextLanguage === language) return
    const url = new URL(location.href)
    url.searchParams.set('lang', nextLanguage)
    if (next === 'home') url.searchParams.delete('chapter')
    else url.searchParams.set('chapter', next)
    if (next === 'reading') url.searchParams.set('page', 'reading')
    else url.searchParams.delete('page')
    url.hash = ''
    history.pushState(null, '', url)
    setLanguage(nextLanguage); setChapter(next); setTurn(n => n + 1)
    requestAnimationFrame(() => {
      const book = document.getElementById('content')
      if (book) {
        const top = book.getBoundingClientRect().top + window.scrollY
        if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top - 12), behavior: 'instant' })
      }
      pageHeading.current?.focus({ preventScroll: true })
    })
  }
  const folio = (right: boolean) => <div className="folio"><span>{String(chapterIndex * 2 + (right ? 2 : 1)).padStart(2, '0')}</span></div>
  const leaf = (side: 'left' | 'right', children: ReactNode) => <section className={'leaf leaf-' + side + (chapter === 'home' ? ' leaf-preface' : '')} aria-label={t(side === 'left' ? '左页' : '右页', side + ' page')}>
    <div className="running-head"><span>{side === 'left' ? t('Qingjun · 研究手记', 'Qingjun · Notes') : chapterName}</span></div>
    <div className="leaf-content">{children}</div>{folio(side === 'right')}
  </section>
  const heading = (subtitle: string, title: string) => <><p className="eyebrow">{subtitle}</p><h2 ref={pageHeading} tabIndex={-1} className="chapter-title">{title}</h2></>
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
      <header className="masthead"><a href={'?lang=' + language} onClick={e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); navigate('home') } }} className="brand"><span>Qingjun<span className="brand-sub">{t('个人主页', 'Personal homepage')}</span></span></a><div className="header-links"><a href={github}>GitHub ↗</a><div className="languages" aria-label={t('语言', 'Language')}><button aria-pressed={zh} onClick={() => navigate(chapter, 'zh')}>中</button><span>/</span><button aria-pressed={!zh} onClick={() => navigate(chapter, 'en')}>EN</button></div></div></header>
      <nav className="bookmarks" aria-label={t('书册目录', 'Book contents')}>{chapters.map((item, index) => <a key={item} href={'?lang=' + language + (item === 'home' ? '' : '&chapter=' + item)} aria-current={chapter === item ? 'page' : undefined} onClick={e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); navigate(item) } }}><span>{String(index).padStart(2, '0')}</span>{names[index][zh ? 0 : 1]}</a>)}</nav>
      <main id="content" tabIndex={-1} className="book" aria-label={t('Qingjun 的研究手记', 'Qingjun’s field notes')}><div className="book-spread" key={turn}>
        {chapter === 'home' && <>
          {leaf('left', <div className="title-page">
            <p className="title-edition">{t('个人手记', 'Personal notes')}</p>
            <h1 ref={pageHeading} tabIndex={-1}>Qingjun</h1>
            <h2 className="book-title">{t('研究手记', 'A Research Notebook')}</h2>
            <p className="title-subtitle">{t('数学、统计与研究工具', 'Mathematics, statistics and research tools')}</p>
            <div className="title-affiliation"><p>{university}</p><p>{school}</p>
              <p className="title-status">{t('本科在读 · 2023—2027', 'Undergraduate · 2023–2027')}</p>
            </div>
            <p className="title-year">2026</p>
          </div>)}
          {leaf('right', <>
            <h2 className="preface-title" ref={pageHeading} tabIndex={-1}>{t('自序', 'Preface')}</h2>
            <div className="book-prose">
              <p>{t('我在北京大学数学科学学院读本科，关注统计学及其在金融市场中的应用，尤其是高频股票数据、市场微观结构与短期预测。', 'I am an undergraduate at the School of Mathematical Sciences, Peking University. My interests are in statistics and its applications to financial markets, particularly high-frequency equity data, market microstructure and short-horizon prediction.')}</p>
              <p>{t('这册手记收录了我的数学学习笔记和研究工具。统计学笔记围绕讲义中的定义、证明和例题展开；学习理论与优化的笔记配有数值实验，便于对照推导与计算结果。', 'This notebook brings together my mathematics notes and research tools. The statistics notes work through definitions, proofs and examples from course lectures. The learning theory and optimization notes include numerical experiments that can be compared with the derivations.')}</p>
              <p>{t('我也整理了一些用于论文摘录、写作排版和学术演示的程序。研究兴趣与已完成的作品分别记录，各项的使用说明、代码和适用范围都可以从项目页查阅。', 'I also keep programs for collecting excerpts, formatting theses and preparing academic presentations. Research interests and completed work are recorded separately, with documentation, source code and limitations linked from the project pages.')}</p>
              <p>{t('学习之外，我喜欢分析学、历史与推理，尤其喜欢罗素与欧拉的著作。书与游戏的选读线索留在后面的阅读页。', 'Outside my studies, I enjoy analysis, history and deductive reasoning, especially the works of Russell and Euler. Reading suggestions and games appear in the later pages.')}</p>
            </div>
            <div className="contents-heading">{t('本册目录', 'Contents')}</div>
            <ol className="contents-list">
              {chapters.slice(1).map((item, index) => <li key={item}><button onClick={() => navigate(item)}><span>{names[index + 1][zh ? 0 : 1]}</span><span className="contents-leader" aria-hidden="true"/><span>{String((index + 1) * 2 + 1).padStart(2, '0')}</span></button></li>)}
            </ol>
          </>)}
        </>}
        {chapter === 'projects' && <>
          {leaf('left', <>{heading(t('第一节', 'Section I'), t('推导与实验', 'Derivations & experiments'))}<p>{t('从统计学的概念与证明，到学习理论和优化。笔记与代码一起保存，方便重读、复现和订正。', 'From statistical concepts and proofs to learning theory and optimization. Notes and code are kept together for rereading, reproduction and correction.')}</p><ProjectEntries entries={mathProjects} zh={zh} /></>)}
          {leaf('right', <><p className="eyebrow">{t('第二节', 'Section II')}</p><h2 className="chapter-title">{t('研究工具', 'Research tools')}</h2><p>{t('解决摘录、论文排版和学术演示中的具体问题。每项的使用方式与适用边界，以仓库文档为准。', 'Tools for concrete problems in collecting excerpts, formatting theses and presenting research. Each repository documents its use and limitations.')}</p><ProjectEntries entries={toolProjects} zh={zh} offset={mathProjects.length} /><div className="catalog-note"><span>{t('资料变更', 'Catalog changed')} <time dateTime={projectsUpdated}>{projectsUpdated}</time></span><a href={github + '?tab=repositories'}>{t('全部公开仓库', 'All public repositories')} ↗</a></div></>)}
        </>}
        {chapter === 'research' && <>
          {leaf('left', <>{heading(t('问题 01 / 市场', 'Question 01 / Markets'), t('市场中的信息', 'Information in markets'))}<p className="lead">{t('逐笔交易、报价和订单流中，哪些信息有助于理解短期价格变化？', 'What information in trades, quotes and order flow helps explain short-horizon price changes?')}</p><p>{t('我希望理解交易机制如何影响观测数据、价格变化与流动性，再考虑如何构造预测特征。这里记录的是研究兴趣与待探索的问题。', 'I would like to understand how trading mechanisms shape observations, price changes and liquidity, and then consider how to construct predictive features. These are research interests and questions to explore.')}</p><aside className="annotation"><span>{t('关于信息的时间', 'Information timing')}</span><p>{t('先确认信息何时可得，再讨论模型能知道什么。', 'Establish when information is available before asking what a model can know.')}</p></aside></>)}
          {leaf('right', <><p className="eyebrow">{t('问题 02—03 / 检验', 'Questions 02–03 / Evaluation')}</p><h2 className="chapter-title">{t('预测与检验', 'Prediction and evaluation')}</h2><article className="question-entry"><span className="entry-meta">02 / {t('统计学习', 'Statistical learning')}</span><h3>{t('信号的稳定性', 'Signal stability')}</h3><p>{t('预测信号能否跨越不同股票、时段和市场状态，保持样本外表现？我关注特征构造、预测时间尺度和模型复杂度之间的关系。', 'Do signals retain out-of-sample performance across stocks, time periods and market conditions? I am interested in the relationship between feature construction, forecast horizons and model complexity.')}</p></article><article className="question-entry"><span className="entry-meta">03 / {t('非平稳环境', 'Nonstationary settings')}</span><h3>{t('精度之外的经济意义', 'Economic meaning beyond accuracy')}</h3><p>{t('在严格的时间划分与成本假设下，模型提升是否仍然成立？时间依赖、数据处理、交易成本与流动性约束都需要进入评估。', 'Do improvements survive chronological evaluation and realistic cost assumptions? Temporal dependence, data processing, transaction costs and liquidity constraints all belong in the evaluation.')}</p></article><div className="ruled-heading"><h3>{t('检查清单', 'Working standards')}</h3><span>METHOD</span></div><ol className="standards"><li>{t('尊重信息可得时间，检查数据泄漏。', 'Respect information timing; check for leakage.')}</li><li>{t('明确基准，采用样本外检验。', 'State baselines and evaluate out of sample.')}</li><li>{t('写清假设、处理过程与结果边界。', 'Document assumptions, processing and limitations.')}</li><li>{t('让分析能够被复现，也能被质疑。', 'Make the analysis reproducible and open to challenge.')}</li></ol></>)}
        </>}
        {chapter === 'reading' && <>
          {leaf('left', <>{heading(t('札记 / 书与游戏', 'Notes / Books & games'), group.title)}<p>{t('我喜欢分析学、历史与推理，尤其喜欢罗素与欧拉。这里是一份选读与兴趣清单，尚不代表完成记录。', 'I enjoy analysis, history and deductive reasoning, especially Russell and Euler. This is a collection of reading suggestions and interests, rather than a completed reading log.')}</p><div className="reading-tabs" role="group" aria-label={t('阅读分类', 'Reading categories')}>{bookGroups.map((g, i) => <button key={g.title} aria-pressed={readingGroup === i} onClick={() => setReadingGroup(i)}>{g.title}</button>)}</div>{readingList(0, midpoint)}</>)}
          {leaf('right', <><p className="eyebrow">{t('接续左页', 'Continued from the facing page')}</p><h2 className="chapter-title">{t('续页', 'Continued')}</h2>{readingList(midpoint, group.items.length)}</>)}
        </>}
        {chapter === 'personal' && <>
          {leaf('left', <>{heading(t('作者档案 / 经历', 'Author’s file / Education'), t('教育经历', 'Education'))}<div className="education-entry"><span className="entry-meta">2023.09 — 2027.09</span><h3>{t('本科 · 在读', 'Undergraduate · In progress')}</h3><p>{university}<br />{school}</p><p className="small-note">{t('预计 2027 年 9 月完成本科阶段学习。', 'Expected completion in September 2027.')}</p></div><div className="education-entry"><span className="entry-meta">2027.09 — / {t('未来计划', 'Future plan')}</span><h3>{t('博士阶段', 'Doctoral studies')}</h3><p>{university}<br />{school}</p><p className="small-note">{t('计划于 2027 年 9 月开始，尚未进入博士阶段。', 'Planned for September 2027; doctoral studies have not yet begun.')}</p></div></>)}
          {leaf('right', <><p className="eyebrow">{t('附记 / 联系', 'Postscript / Correspondence')}</p><h2 className="chapter-title">{t('欢迎来信', 'Correspondence is welcome')}</h2><p className="lead">{t('关于高频金融数据、统计学习，或一次有趣的推导。', 'About high-frequency financial data, statistical learning, or an interesting derivation.')}</p><a className="contact-email" href={'mailto:' + email}>{email} ↗</a><a className="quiet-link" href={github}>GitHub / Studyer-Tang ↗</a><div className="personal-note"><span className="eyebrow">{t('留给重要的人', 'For someone important')}</span><h3>Yin Han</h3><p>{t('我的伴侣，可爱、美丽、善良的 Yin Han 女士。', 'My partner, Ms. Yin Han — lovely, beautiful, and kind.')}</p></div><div className="colophon"><h3>{t('关于这册手记', 'About this notebook')}</h3><p>{t('个人介绍更新于 2026 年 10 月 2 日。项目信息由公开仓库同步；书目保留作者与出版信息。', 'Biography updated on 2 October 2026. Project information is synchronized from public repositories; reading entries retain authors and publication details.')}</p><a href={github + '/Studyer-Tang.github.io'}>{t('查看主页源代码', 'View the homepage source')} ↗</a></div></>)}
        </>}
      </div><div className="book-binding" aria-hidden="true" />{turn > 0 && <div key={'turn-' + turn} className="turning-page" aria-hidden="true" />}</main>
      <div className="page-controls"><button disabled={chapterIndex === 0} onClick={() => navigate(chapters[chapterIndex - 1])}>← {t('上一章', 'Previous chapter')}</button><span>{String(chapterIndex + 1).padStart(2, '0')} / 05 <span className="control-name">· {chapterName}</span></span><button disabled={chapterIndex === chapters.length - 1} onClick={() => navigate(chapters[chapterIndex + 1])}>{t('下一章', 'Next chapter')} →</button></div>
      <footer><span>© Qingjun · {university}</span><a href={github + '/Studyer-Tang.github.io'}>{t('源代码', 'Source')} ↗</a></footer>
    </div>
  </>
}
export default App
