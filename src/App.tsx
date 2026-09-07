import { useEffect, useState } from 'react'
import './App.css'
import { reading, games } from './reading'
import { textbooks, classics, narratives } from './further-reading'

const github = 'https://github.com/Studyer-Tang'
const email = 'phdstudytang@gmail.com'
const updated = '2026-09-07'

const topics = [
  {
    label: ['数据与市场机制', 'Data & market mechanisms'],
    title: ['高频数据与市场微观结构', 'High-frequency data & market microstructure'],
    detail: ['关注逐笔交易、报价与订单簿数据中的价格变化、订单流和流动性，理解交易机制如何影响观测数据与可用信息。', 'Price changes, order flow, and liquidity in transaction, quote, and order-book data; how trading mechanisms shape the observations and information available to a model.'],
    question: ['交易、报价与订单流中，哪些信息有助于理解短期价格变化？', 'What information in trades, quotes, and order flow helps explain short-horizon price changes?'],
  },
  {
    label: ['统计建模与预测', 'Statistical modeling & prediction'],
    title: ['股票市场的短期预测', 'Short-horizon equity forecasting'],
    detail: ['关注统计学习在高频金融序列中的应用，探索特征构造、预测时间尺度与模型复杂度之间的关系。', 'Statistical learning for high-frequency financial sequences, with an interest in the relationship between feature construction, forecast horizons, and model complexity.'],
    question: ['预测信号能否跨越不同股票、时段和市场状态，保持样本外表现？', 'Do predictive signals retain out-of-sample performance across stocks, time periods, and market conditions?'],
  },
  {
    label: ['评估与经济意义', 'Evaluation & economic significance'],
    title: ['非平稳环境下的可靠检验', 'Reliable evaluation under nonstationarity'],
    detail: ['关注时间依赖、市场变化和数据处理对评估结果的影响，将预测精度与交易成本、流动性约束下的经济意义联系起来。', 'How temporal dependence, changing markets, and data processing affect evaluation; connecting predictive accuracy with economic significance under transaction costs and liquidity constraints.'],
    question: ['在严格的时间划分与成本假设下，模型提升是否仍然成立？', 'Do model improvements survive chronological evaluation and realistic cost assumptions?'],
  },
]

function App() {
  const [language, setLanguage] = useState<'en' | 'zh'>(() => new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'en')
  const isReading = new URLSearchParams(location.search).get('page') === 'reading'
  const zh = language === 'zh'
  const t = (cn: string, en: string) => zh ? cn : en
  const pick = (pair: string[]) => pair[zh ? 0 : 1]
  const home = '?lang=' + language
  const readingUrl = home + '&page=reading'
  const siteTitle = t('个人学术主页', 'Academic homepage')
  const readingTitle = t('阅读与兴趣', 'Reading & interests')
  const university = t('北京大学', 'Peking University')
  const school = t('数学科学学院', 'School of Mathematical Sciences')
  const description = t(
    'Qingjun Tang，北京大学数学科学学院本科生。研究兴趣集中于股票市场高频数据、市场微观结构与统计预测。',
    'Qingjun Tang is an undergraduate at the School of Mathematical Sciences, Peking University, interested in high-frequency equity data, market microstructure, and statistical forecasting.',
  )
  const nav = [
    ['about', t('简介', 'About')],
    ['research', t('研究兴趣', 'Research interests')],
    ['education', t('教育经历', 'Education')],
    ['software', t('研究软件', 'Research software')],
    ['contact', t('联系', 'Contact')],
  ]
  const personal = t(
    '我也喜欢分析学、历史与推理，尤其喜欢罗素与欧拉的著作。这里保留一些数学、思想与叙事作品的阅读线索。',
    'I also enjoy analysis, history, and deductive reasoning, with a particular fondness for Russell and Euler. My reading list brings together mathematics, ideas, and narrative works.',
  )
  const bookGroups = [
    { title: t('分析学、统计学习与史学方法', 'Analysis, statistical learning & historical inquiry'), items: [...reading, ...textbooks] },
    { title: t('罗素与欧拉', 'Russell & Euler'), items: classics },
    { title: t('小说与历史', 'Fiction & history'), items: narratives },
    { title: t('游戏与推理', 'Games & deduction'), items: games },
  ]

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    const title = 'Qingjun Tang | ' + (isReading ? readingTitle : siteTitle)
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    const url = new URL(location.href)
    url.searchParams.set('lang', language)
    history.replaceState(null, '', url)
  }, [language, isReading, readingTitle, siteTitle, description])

  const heading = (number: string, title: string) => <div className="section-heading"><span aria-hidden="true">{number}</span><h2>{title}</h2></div>

  return <>
    <a className="skip-link" href="#content">{t('跳转到正文', 'Skip to content')}</a>
    <div className="page">
      <header className="masthead">
        <a href={home} className="home-link">Qingjun Tang<span>{siteTitle}</span></a>
        <div className="languages" aria-label={t('语言', 'Language')}>
          <button aria-pressed={!zh} onClick={() => setLanguage('en')}>EN</button>
          <span aria-hidden="true">/</span>
          <button aria-pressed={zh} onClick={() => setLanguage('zh')}>中文</button>
        </div>
      </header>
      <div className="layout">
        <aside className="profile">
          <div className="monogram" aria-hidden="true">QT<span>·</span></div>
          <h1>Qingjun Tang</h1>
          <p className="affiliation">{university}</p><p>{school}</p>
          <p className="profile-status">{t('本科在读 · 2023—2027', 'Undergraduate · 2023–2027')}</p>
          <nav aria-label={t('页面导航', 'Page navigation')}>
            {nav.map(([id, label]) => <a key={id} href={(isReading ? home : '') + '#' + id}>{label}</a>)}
            <a href={readingUrl} aria-current={isReading ? 'page' : undefined}>{readingTitle}</a>
          </nav>
          <div className="profile-links">
            <a href={'mailto:' + email}>{t('电子邮件', 'Email')}<span aria-hidden="true">↗</span></a>
            <a href={github}>GitHub<span aria-hidden="true">↗</span></a>
          </div>
          <p className="profile-note">{t('高频金融数据 · 统计学习 · 市场预测', 'High-frequency data · Statistical learning · Financial forecasting')}</p>
        </aside>
        <main id="content">
          {isReading ? <>
            <a className="back-link" href={home}>← {t('返回学术主页', 'Back to the homepage')}</a>
            <section>
              <p className="eyebrow">{t('研究之外', 'Beyond research')}</p>
              <h2 className="display-title">{readingTitle}</h2><p>{personal}</p>
              <p className="section-note">{t('这是一份选读与兴趣清单，并非完成记录。书目保留作者与出版信息，方便继续查阅。', 'A collection of reading suggestions and interests, not a record of completed reading. Author and publication details are included for further exploration.')}</p>
            </section>
            {bookGroups.map((group, index) => <section key={group.title}>
              {heading('0' + (index + 1), group.title)}
              <ul className="reading-list">{group.items.map(item => <li key={item.title.en}>
                <h3>{item.url ? <a href={item.url}>{item.title[language]}</a> : item.title[language]}</h3>
                <span className="reading-credit">{item.credit}</span><p>{item.description[language]}</p>
              </li>)}</ul>
            </section>)}
          </> : <>
            <section id="about" className="intro">
              <p className="eyebrow">{t('金融统计与市场数据', 'Financial statistics & market data')}</p>
              <h2 className="display-title">{t('理解高频市场数据，', 'Understanding market data.')}<br /><span>{t('探索可检验的预测。', 'Testing what we can predict.')}</span></h2>
              <p className="lead">{t('我目前在北京大学数学科学学院攻读本科，主要研究兴趣集中于金融市场，尤其是股票市场的高频数据分析与预测。', 'I am an undergraduate at the School of Mathematical Sciences, Peking University. My research interests center on financial markets, particularly the analysis and prediction of high-frequency equity data.')}</p>
              <p>{t('我关注交易与报价数据中的信息如何形成预测信号，以及这些信号在不同时间尺度和市场环境下能否保持稳定。统计学习与市场微观结构是我希望深入探索的两个相互关联的方向。', 'I am interested in how information in trades and quotes becomes a predictive signal, and whether such signals remain stable across time horizons and market conditions. Statistical learning and market microstructure are two connected directions I hope to explore further.')}</p>
              <div className="intro-links"><a href="#research">{t('研究兴趣', 'Explore research interests')} ↓</a><a href={'mailto:' + email}>{t('联系交流', 'Get in touch')} ↗</a></div>
            </section>
            <section id="research">
              {heading('01', nav[1][1])}
              <p className="section-note">{t('围绕高频股票市场数据，我主要关注以下问题。这里介绍的是研究兴趣与拟探索的问题。', 'The following themes describe my research interests and questions I would like to explore using high-frequency equity data.')}</p>
              {topics.map(topic => <article className="research-topic" key={topic.title[1]}>
                <p className="topic-label">{pick(topic.label)}</p><h3>{pick(topic.title)}</h3><p>{pick(topic.detail)}</p>
                <p className="research-question"><span>{t('关注的问题', 'A question of interest')}</span>{pick(topic.question)}</p>
              </article>)}
              <aside className="research-principle"><h3>{t('我重视的研究标准', 'Research standards I value')}</h3><p>{t('尊重信息实际可得的时间，防止数据泄漏；采用清晰的基准与样本外检验；说明数据处理、模型假设和结果边界，让分析可以被复现与质疑。', 'Respect when information becomes available and prevent data leakage. Use clear baselines and out-of-sample evaluation. Document data processing, assumptions, and limitations so that an analysis can be reproduced and challenged.')}</p></aside>
            </section>
            <section id="education">
              {heading('02', nav[2][1])}
              <ol className="education-list">
                <li><p className="education-dates">2023.09 — 2027.09</p><div><h3>{t('本科', 'Undergraduate studies')}<span className="status-label">{t('在读', 'In progress')}</span></h3><p>{university} · {school}</p><p className="section-note">{t('预计 2027 年 9 月完成本科阶段学习。', 'Expected completion in September 2027.')}</p></div></li>
                <li><p className="education-dates">2027.09 —</p><div><h3>{t('博士阶段', 'Doctoral studies')}<span className="status-label">{t('计划于 2027 年开始', 'Planned for September 2027')}</span></h3><p>{university} · {school}</p><p className="section-note">{t('未来教育安排，尚未开始博士阶段学习。', 'Future education plan; doctoral studies have not yet begun.')}</p></div></li>
              </ol>
            </section>
            <section id="software">
              {heading('03', nav[3][1])}
              <article className="software-project">
                <p className="topic-label">{t('开源科研工具', 'Open-source research tools')}</p>
                <h3><a href={github + '/rigorous-research'}>Rigorous Research <span className="project-alias">/ PaperTrail</span></a></h3>
                <p>{t('围绕文献调研、论文结论与来源核查、数学审阅和计算复现构建的开源项目。PaperTrail 提供论文证据整理与核查界面，支持梳理研究材料与论证依据。', 'An open-source project for literature investigation, claim–source checks, mathematical review, and computational reproduction. PaperTrail provides an interface for organizing evidence from papers and reviewing the support behind their claims.')}</p>
                <div className="project-links"><a href={github + '/rigorous-research'}>{t('源代码', 'Source code')} ↗</a><a href={github + '?tab=repositories'}>{t('全部项目', 'All repositories')} ↗</a></div>
              </article>
            </section>
            <section id="reading" className="personal-section">
              <p className="eyebrow">{t('研究之外', 'Beyond research')}</p><h2>{readingTitle}</h2><p>{personal}</p>
              <a href={readingUrl}>{t('浏览书单与游戏', 'Browse books & games')} ↗</a>
            </section>
            <section id="contact">
              {heading('04', nav[4][1])}
              <p>{t('欢迎交流高频金融数据、股票市场预测、统计学习与可复现研究。', 'I welcome conversations about high-frequency financial data, equity forecasting, statistical learning, and reproducible research.')}</p>
              <a className="contact-email" href={'mailto:' + email}>{email} ↗</a>
            </section>
          </>}
        </main>
      </div>
      <footer><span>Qingjun Tang · {university}</span><span>{t('更新于', 'Updated')} <time dateTime={updated}>{updated}</time></span><a href={github + '/Studyer-Tang.github.io'}>{t('源代码', 'Source code')} ↗</a></footer>
    </div>
  </>
}
export default App
