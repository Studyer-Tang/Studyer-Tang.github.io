import { useEffect, useState } from 'react'
import './App.css'

const content = {
  en: {
    university: 'Peking University', program: 'Statistics (Finance)',
    nav: ['About', 'Research interests', 'Software', 'Contact'],
    intro: 'I study Statistics (Finance) at Peking University. I am interested in applications of statistical learning to financial markets, with a current focus on financial time series, market microstructure, and investment decisions.',
    detail: 'I want to understand when models work and whether their conclusions survive changes in those conditions. In empirical work, I pay particular attention to out-of-sample evaluation, data leakage, transaction costs, and reproducibility.',
    personal: 'Outside my formal studies, I am an amateur enthusiast of pure mathematics, with interests in history and deductive reasoning.',
    note: 'Areas I am currently studying and would like to explore further.',
    topics: [
      ['Statistical learning in finance', 'High-dimensional financial time series, factor models, and regularization, with an emphasis on prediction and inference under non-stationarity.'],
      ['Market microstructure & financial behavior', 'Order flow, liquidity, and trading behavior; how adaptation among market participants shapes price formation and market structure.'],
      ['Sustainable investing & risk', 'ESG signals, asset dependence, and portfolio constraints; the relationship between investment objectives, risk measures, and economic significance.'],
    ],
    software: 'Research software', project: 'Tools for literature investigation, claim–source checks, mathematical review, and computational reproduction. PaperTrail provides an interface for organizing and reviewing evidence from papers.',
    source: 'Source code', all: 'All repositories', contact: 'I welcome conversations about statistical learning in finance, paper reproduction, and research tools.',
    footer: 'Academic homepage', skip: 'Skip to content',
  },
  zh: {
    university: '北京大学', program: '统计学（金融方向）',
    nav: ['简介', '研究兴趣', '开源工作', '联系'],
    intro: '我在北京大学学习统计学（金融方向），关注统计学习在金融市场中的应用。目前的学习与探索围绕金融时间序列、市场微观结构和投资决策展开。',
    detail: '我希望理解模型在什么条件下有效，以及这些条件改变时结论是否仍然成立。在实证工作中，我尤其关注样本外检验、数据泄漏、交易成本与结果的可复现性。',
    personal: '专业学习之外，我也是纯数学的业余爱好者，以及历史与推理爱好者。',
    note: '以下是当前希望深入学习和探索的方向。',
    topics: [
      ['金融统计学习', '高维金融时间序列、因子模型与正则化；关注非平稳环境中的预测、推断和样本外表现。'],
      ['市场微观结构与金融行为', '订单流、流动性和交易行为；关注市场参与者的适应如何影响价格形成与市场结构。'],
      ['可持续投资与风险管理', 'ESG 信号、资产依赖与组合约束；关注投资目标、风险度量和经济意义之间的联系。'],
    ],
    software: '开源工作', project: '用于文献调研、结论与来源核查、数学审阅和计算复现的开源项目。PaperTrail 提供论文证据整理与核查界面。',
    source: '源代码', all: '全部项目', contact: '欢迎交流金融统计学习、论文复现与科研工具。',
    footer: '个人学术主页', skip: '跳转到正文',
  },
}
const github = 'https://github.com/Studyer-Tang'
const email = 'phdstudytang@gmail.com'
function App() {
  const [language, setLanguage] = useState<'en' | 'zh'>(() => new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'en')
  const t = content[language]
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = 'Qingjun Tang | ' + t.footer
    const url = new URL(location.href)
    url.searchParams.set('lang', language)
    history.replaceState(null, '', url)
  }, [language, t.footer])
  return <>
    <a className="skip-link" href="#content">{t.skip}</a>
    <div className="page">
      <header className="masthead">
        <a href="#about" className="home-link">Qingjun Tang</a>
        <div className="languages" aria-label="Language">
          <button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
          <span aria-hidden="true">/</span>
          <button aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button>
        </div>
      </header>
      <div className="layout">
        <aside className="profile">
          <h1>Qingjun Tang</h1><p>{t.university}</p><p className="program">{t.program}</p>
          <nav aria-label={language === 'zh' ? '页面导航' : 'Page navigation'}>
            {['about', 'research', 'software', 'contact'].map((id, i) => <a key={id} href={'#' + id}>{t.nav[i]}</a>)}
          </nav>
          <div className="profile-links"><a href={'mailto:' + email}>{email}</a><a href={github}>GitHub ↗</a></div>
        </aside>
        <main id="content">
          <section id="about"><h2>{t.nav[0]}</h2><p>{t.intro}</p><p>{t.detail}</p><p>{t.personal}</p></section>
          <section id="research"><h2>{t.nav[1]}</h2><p className="section-note">{t.note}</p>
            <dl>{t.topics.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>
          </section>
          <section id="software"><h2>{t.software}</h2>
            <article><h3><a href={github + '/rigorous-research'}>Rigorous Research / PaperTrail</a></h3><p>{t.project}</p>
              <div className="project-links"><a href={github + '/rigorous-research'}>{t.source} ↗</a><a href={github + '?tab=repositories'}>{t.all} ↗</a></div>
            </article>
          </section>
          <section id="contact"><h2>{t.nav[3]}</h2><p>{t.contact}</p><a href={'mailto:' + email}>{email}</a></section>
        </main>
      </div>
      <footer><span>Qingjun Tang · {t.footer}</span><a href={github + '/Studyer-Tang.github.io'}>{t.source}</a></footer>
    </div>
  </>
}
export default App
