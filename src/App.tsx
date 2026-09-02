import { useEffect, useState } from 'react'
import './App.css'

type Language = 'zh' | 'en'

type ResearchItem = {
  index: string
  field: string
  title: string
  description: string
  methods: string
  href?: string
  linkLabel?: string
}

const content = {
  zh: {
    nav: ['研究', '笔记', '关于', '联系'],
    langLabel: 'EN',
    identity: '北京大学 · 统计学（金融方向）',
    name: 'Qingjun Tang',
    romanizedName: 'Statistics · Finance',
    intro:
      '我关心统计学习如何帮助我们理解不断变化的金融市场：从高维时间序列和市场微观结构，到可持续投资与风险管理。',
    detail:
      '目前重点学习金融时间序列、随机过程与机器学习方法，希望把市场机制、数据证据和真实决策放进同一个可检验的研究框架。',
    projectsLink: '查看研究',
    githubLink: 'GitHub',
    nowLabel: 'NOW · 2026',
    nowTitle: '用统计模型连接市场机制、数据与决策。',
    figureLabel: 'signal / noise',
    figureCaption: '金融环境始终在变化；模型需要解释变化，也需要经得起变化。',
    researchLabel: 'Selected research',
    researchTitle: '研究兴趣与未来方向',
    researchIntro:
      '以统计学为基础，关注金融市场中的动态结构、行为机制与可验证的决策问题。',
    research: [
      {
        index: '01',
        field: '金融统计学习',
        title: '怎样从复杂的金融路径中提取稳定信息？',
        description:
          '关注高维、非平稳金融时间序列的表示与推断，学习路径特征、扩散因子模型和正则化方法，并考察模型在样本外的可靠性。',
        methods: 'path signatures · factor models · inference',
      },
      {
        index: '02',
        field: '市场微观结构与适应性行为',
        title: '市场状态如何在交易行为中形成和演化？',
        description:
          '从订单流、流动性和高频周期性出发，研究参与者行为与市场状态之间的联系，并尝试用适应性市场视角理解结构变化。',
        methods: 'order flow · liquidity · adaptive markets',
      },
      {
        index: '03',
        field: '可持续投资与量化风险',
        title: '投资影响与风险能否被一致地度量？',
        description:
          '关注 ESG 与影响力信号的识别、资产间依赖和组合约束，探索可持续目标如何进入投资组合构建、绩效归因与风险管理。',
        methods: 'impact investing · dependence · portfolio risk',
      },
    ] satisfies ResearchItem[],
    notesLabel: 'Notebook',
    notesTitle: '最近在想',
    notes: [
      {
        date: '2026.08',
        title: '路径数据需要怎样的统计表示？',
        text: '当观测本身是一段动态过程，表示方法不仅要压缩信息，也要保留顺序、尺度和可解释的结构。',
      },
      {
        date: '2026.07',
        title: '市场规律为什么会改变？',
        text: '策略、制度和参与者彼此适应，使金融市场更像一个演化系统，而不是参数固定的数据生成器。',
      },
      {
        date: '2026.06',
        title: '“影响力”不应只是一个标签',
        text: '可持续投资需要区分企业特征、投资者偏好与真实影响，并说明每一种度量究竟支持什么结论。',
      },
    ],
    aboutLabel: 'About',
    aboutTitle: '把金融问题变成可以检验的统计问题。',
    aboutText: [
      '我在北京大学学习统计学（金融方向）。在张瑞勋老师指导下，我希望围绕金融统计学习、市场微观结构与适应性金融行为、可持续投资和量化风险开展研究。',
      '我重视清楚的定义、可以被反驳的结论和能够复现的计算过程。研究之外，我也在尝试把这些习惯做成小而有用的开源工具，例如 Rigorous Research。',
    ],
    facts: [
      ['专业', '统计学（金融方向）'],
      ['关注', '统计学习、金融市场与风险'],
      ['语言', '中文 / English'],
    ],
    contactLabel: 'Contact',
    contactTitle: '如果你也在处理一个难以定义、验证或复现的问题，欢迎交流。',
    email: '邮件',
    github: 'GitHub',
    footer: 'Built slowly, checked carefully.',
  },
  en: {
    nav: ['Research', 'Notes', 'About', 'Contact'],
    langLabel: '中文',
    identity: 'Peking University · Statistics (Finance)',
    name: 'Qingjun Tang',
    romanizedName: 'Statistics · Finance',
    intro:
      'I study how statistical learning can help us understand changing financial markets—from high-dimensional time series and market microstructure to sustainable investing and risk management.',
    detail:
      'My current focus is on financial time series, stochastic processes, and machine learning, with the aim of connecting market mechanisms, empirical evidence, and real decisions in a testable framework.',
    projectsLink: 'View research',
    githubLink: 'GitHub',
    nowLabel: 'NOW · 2026',
    nowTitle: 'Connecting market mechanisms, data, and decisions through statistics.',
    figureLabel: 'signal / noise',
    figureCaption: 'Financial environments keep changing; models should explain change and withstand it.',
    researchLabel: 'Selected research',
    researchTitle: 'Research interests and future directions',
    researchIntro:
      'Grounded in statistics, I focus on dynamic structures, behavioral mechanisms, and testable decisions in financial markets.',
    research: [
      {
        index: '01',
        field: 'Statistical learning in finance',
        title: 'How can stable information be extracted from complex financial paths?',
        description:
          'I am interested in representations and inference for high-dimensional, non-stationary financial time series, including path signatures, diffusion factor models, regularization, and out-of-sample reliability.',
        methods: 'path signatures · factor models · inference',
      },
      {
        index: '02',
        field: 'Market microstructure & adaptive behavior',
        title: 'How do market states form and evolve through trading behavior?',
        description:
          'Starting from order flow, liquidity, and high-frequency periodicity, I want to study how participant behavior interacts with market states and structural change.',
        methods: 'order flow · liquidity · adaptive markets',
      },
      {
        index: '03',
        field: 'Sustainable investing & quantitative risk',
        title: 'Can investment impact and risk be measured coherently?',
        description:
          'I am interested in identifying ESG and impact signals, modeling dependence, and understanding how sustainable objectives enter portfolio construction, attribution, and risk management.',
        methods: 'impact investing · dependence · portfolio risk',
      },
    ] satisfies ResearchItem[],
    notesLabel: 'Notebook',
    notesTitle: 'Recent thoughts',
    notes: [
      {
        date: '2026.08',
        title: 'How should path-valued data be represented?',
        text: 'When each observation is a dynamic process, a useful representation should compress information while preserving order, scale, and interpretable structure.',
      },
      {
        date: '2026.07',
        title: 'Why do market regularities change?',
        text: 'Strategies, institutions, and participants adapt to one another, making financial markets evolutionary systems rather than fixed data generators.',
      },
      {
        date: '2026.06',
        title: 'Impact should be more than a label',
        text: 'Sustainable investing must separate firm characteristics, investor preferences, and real-world impact—and state what each measure can support.',
      },
    ],
    aboutLabel: 'About',
    aboutTitle: 'Turning financial questions into testable statistical ones.',
    aboutText: [
      'I study Statistics (Finance) at Peking University. Under the guidance of Professor Ruixun Zhang, I hope to pursue research in statistical learning for finance, market microstructure and adaptive financial behavior, sustainable investing, and quantitative risk.',
      'I value precise definitions, falsifiable claims, and reproducible computation. Beyond research, I also turn these habits into small, useful open-source tools, including Rigorous Research.',
    ],
    facts: [
      ['Program', 'Statistics (Finance)'],
      ['Focus', 'Statistical learning, markets, risk'],
      ['Languages', '中文 / English'],
    ],
    contactLabel: 'Contact',
    contactTitle: 'If you are also working on a problem that is hard to define, verify, or reproduce, I would be glad to talk.',
    email: 'Email',
    github: 'GitHub',
    footer: 'Built slowly, checked carefully.',
  },
}

function SignalFigure({ label, caption }: { label: string; caption: string }) {
  return (
    <figure className="signal-figure">
      <div className="figure-meta">
        <span>{label}</span>
        <span aria-hidden="true">μ ± σ</span>
      </div>
      <svg viewBox="0 0 560 250" role="img" aria-label={caption}>
        <defs>
          <linearGradient id="signalFade" x1="0" x2="1">
            <stop offset="0" stopColor="#2563eb" stopOpacity="0.08" />
            <stop offset="1" stopColor="#0891b2" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        <g className="grid-lines">
          <path d="M0 50H560M0 100H560M0 150H560M0 200H560" />
          <path d="M70 0V250M140 0V250M210 0V250M280 0V250M350 0V250M420 0V250M490 0V250" />
        </g>
        <path
          className="uncertainty"
          d="M0 175C42 156 73 168 108 142C147 113 174 127 211 111C252 93 283 55 323 69C361 83 393 61 425 43C470 18 513 36 560 17V87C513 102 475 88 430 112C393 131 357 140 323 126C282 109 252 143 211 160C171 177 147 165 108 190C72 213 43 203 0 221Z"
          fill="url(#signalFade)"
        />
        <path
          className="signal-line"
          d="M0 198C42 178 73 190 108 166C147 139 174 147 211 135C252 121 283 83 323 97C361 110 393 93 428 73C473 47 516 65 560 45"
        />
        <g className="observations">
          <circle cx="42" cy="181" r="3" />
          <circle cx="108" cy="170" r="3" />
          <circle cx="174" cy="143" r="3" />
          <circle cx="252" cy="124" r="3" />
          <circle cx="323" cy="100" r="3" />
          <circle cx="393" cy="96" r="3" />
          <circle cx="473" cy="52" r="3" />
          <circle cx="540" cy="48" r="3" />
        </g>
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>('zh')
  const t = content[language]

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title =
      language === 'zh'
        ? 'Qingjun Tang | 统计学与金融'
        : 'Qingjun Tang | Statistics and Finance'
  }, [language])

  return (
    <main id="top">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Qingjun Tang home">
          <span>TQJ</span>
          <i aria-hidden="true" />
        </a>
        <nav className="navlinks" aria-label="Primary navigation">
          {t.nav.map((item, index) => (
            <a key={item} href={['#research', '#notes', '#about', '#contact'][index]}>
              {item}
            </a>
          ))}
          <button
            className="language-toggle"
            type="button"
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            aria-label="Switch language"
          >
            {t.langLabel}
          </button>
        </nav>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{t.identity}</p>
          <div className="name-line">
            <h1 id="hero-title">{t.name}</h1>
            <span>{t.romanizedName}</span>
          </div>
          <p className="hero-intro">{t.intro}</p>
          <p className="hero-detail">{t.detail}</p>
          <div className="hero-links">
            <a className="text-link primary-link" href="#research">
              {t.projectsLink} <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="https://github.com/Studyer-Tang">
              {t.githubLink} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <aside className="now-panel">
          <p className="section-label">{t.nowLabel}</p>
          <h2>{t.nowTitle}</h2>
          <SignalFigure label={t.figureLabel} caption={t.figureCaption} />
        </aside>
      </section>

      <section className="section research-section" id="research">
        <div className="section-intro">
          <p className="section-label">{t.researchLabel}</p>
          <h2>{t.researchTitle}</h2>
          <p>{t.researchIntro}</p>
        </div>
        <div className="research-list">
          {t.research.map((item: ResearchItem) => {
            const body = (
              <>
                <div className="research-index">{item.index}</div>
                <div className="research-copy">
                  <p className="research-field">{item.field}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="research-meta">
                  <span>{item.methods}</span>
                  {item.linkLabel && <strong>{item.linkLabel}</strong>}
                </div>
              </>
            )

            return item.href ? (
              <a className="research-row linked" href={item.href} key={item.index}>
                {body}
              </a>
            ) : (
              <article className="research-row" key={item.index}>
                {body}
              </article>
            )
          })}
        </div>
      </section>

      <section className="section notes-section" id="notes">
        <div className="section-intro compact">
          <p className="section-label">{t.notesLabel}</p>
          <h2>{t.notesTitle}</h2>
        </div>
        <div className="note-list">
          {t.notes.map((note) => (
            <article className="note" key={note.date}>
              <time>{note.date}</time>
              <h3>{note.title}</h3>
              <p>{note.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section about-section" id="about">
        <div className="about-heading">
          <p className="section-label">{t.aboutLabel}</p>
          <h2>{t.aboutTitle}</h2>
        </div>
        <div className="about-body">
          {t.aboutText.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <dl className="facts">
            {t.facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div>
          <p className="section-label">{t.contactLabel}</p>
          <h2>{t.contactTitle}</h2>
        </div>
        <div className="footer-actions">
          <a href="mailto:2300010828@stu.pku.edu.cn">{t.email} ↗</a>
          <a href="https://github.com/Studyer-Tang">{t.github} ↗</a>
        </div>
        <p className="footer-note">© 2026 Qingjun Tang · {t.footer}</p>
      </footer>
    </main>
  )
}

export default App
