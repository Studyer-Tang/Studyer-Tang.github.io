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
    identity: '北京大学 · 数学与应用数学（金融方向）',
    name: '唐庆军',
    romanizedName: 'Qingjun Tang',
    intro:
      '我关心一个朴素的问题：面对高维、非平稳而且充满噪声的数据，我们怎样知道一个结论是真的，而不只是恰好拟合了过去？',
    detail:
      '目前主要学习统计推断、金融时间序列与可靠的计算研究，也在制作让研究过程更容易复查和复现的开源工具。',
    projectsLink: '查看研究',
    githubLink: 'GitHub',
    nowLabel: 'NOW · 2026',
    nowTitle: '从漂亮的回测，走向可信的推断。',
    figureLabel: 'signal / noise',
    figureCaption: '真正的问题不是能否拟合一条曲线，而是它能否在下一个样本中继续成立。',
    researchLabel: 'Selected research',
    researchTitle: '正在认真追问的三个问题',
    researchIntro:
      '不罗列宽泛的兴趣，只保留目前真正投入时间、能够被检验的研究问题。',
    research: [
      {
        index: '01',
        field: '市场微观结构',
        title: '订单流能否揭示正在变化的市场状态？',
        description:
          '从逐笔数据中提取订单簿特征，使用隐马尔可夫模型识别潜在状态，并通过回归与假设检验考察这些状态是否具有稳定、可解释的差异。',
        methods: 'HMM · order book · inference',
      },
      {
        index: '02',
        field: '高维统计',
        title: '一个因子在样本外为什么仍然有效？',
        description:
          '关注特征压缩、共线性、结构突变与多重检验，尝试把“回测表现很好”拆解为可以验证、可以失败，也可以被解释的统计命题。',
        methods: 'regularization · time series · validation',
      },
      {
        index: '03',
        field: '开放研究工具',
        title: '怎样让计算研究更容易被复查？',
        description:
          'Rigorous Research 将假设、数据来源、计算路径与结论边界放在同一份研究记录中，目标不是替代判断，而是让判断留下清楚的证据。',
        methods: 'Python · provenance · reproducibility',
        href: 'https://github.com/Studyer-Tang/rigorous-research',
        linkLabel: '查看项目 ↗',
      },
    ] satisfies ResearchItem[],
    notesLabel: 'Notebook',
    notesTitle: '最近在想',
    notes: [
      {
        date: '2026.08',
        title: '“开放问题”究竟指哪一个问题？',
        text: '当原始定义、自然修正和作者意图不完全一致时，先画出问题的版本树，再讨论结果解决了什么。',
      },
      {
        date: '2026.07',
        title: '高回测指标不是研究的终点',
        text: '数据窥探、交易成本和状态变化会怎样共同侵蚀样本外表现，以及哪些检验真正有信息量。',
      },
      {
        date: '2026.06',
        title: '把负面结果留在研究记录里',
        text: '失败的模型和被排除的解释不是废料，它们决定下一次研究从哪里继续。',
      },
    ],
    aboutLabel: 'About',
    aboutTitle: '比起更复杂的模型，我更在意更清楚的问题。',
    aboutText: [
      '我是北京大学数学科学学院本科生。数学训练让我习惯先检查定义、假设和逻辑边界；量化研究经历则让我看到，真实数据经常比模型预设的世界更混乱。',
      '我喜欢可以被反驳的结论、能从头复现的实验和诚实保留限制的写作。研究之外，我也在尝试把这些习惯做成小而有用的开源工具。',
    ],
    facts: [
      ['学习', '数学、统计与金融'],
      ['工具', 'Python、SQL、LaTeX'],
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
    identity: 'Peking University · Mathematics & Applied Mathematics (Finance)',
    name: 'Qingjun Tang',
    romanizedName: '唐庆军',
    intro:
      'I keep returning to a simple question: with high-dimensional, non-stationary, noisy data, how do we know a result is real rather than merely well fitted to the past?',
    detail:
      'I currently study statistical inference, financial time series, and reliable computational research, while building small open-source tools that make research easier to inspect and reproduce.',
    projectsLink: 'View research',
    githubLink: 'GitHub',
    nowLabel: 'NOW · 2026',
    nowTitle: 'From an attractive backtest to a credible inference.',
    figureLabel: 'signal / noise',
    figureCaption: 'The question is not whether a curve can be fitted, but whether it survives the next sample.',
    researchLabel: 'Selected research',
    researchTitle: 'Three questions I am taking seriously',
    researchIntro:
      'Instead of a long list of interests, these are the testable questions that currently receive my time.',
    research: [
      {
        index: '01',
        field: 'Market microstructure',
        title: 'Can order flow reveal a changing market state?',
        description:
          'I extract order-book features from transaction data, use hidden Markov models to identify latent states, and test whether the resulting distinctions are stable and interpretable.',
        methods: 'HMM · order book · inference',
      },
      {
        index: '02',
        field: 'High-dimensional statistics',
        title: 'Why should a factor continue to work out of sample?',
        description:
          'I focus on compression, collinearity, structural change, and multiple testing—turning “a strong backtest” into statistical claims that can be tested, fail, and be explained.',
        methods: 'regularization · time series · validation',
      },
      {
        index: '03',
        field: 'Open research tooling',
        title: 'How can computational research become easier to audit?',
        description:
          'Rigorous Research keeps assumptions, data provenance, computational paths, and claim boundaries in one record. It does not replace judgment; it leaves judgment with evidence.',
        methods: 'Python · provenance · reproducibility',
        href: 'https://github.com/Studyer-Tang/rigorous-research',
        linkLabel: 'View project ↗',
      },
    ] satisfies ResearchItem[],
    notesLabel: 'Notebook',
    notesTitle: 'Recent thoughts',
    notes: [
      {
        date: '2026.08',
        title: 'Which open problem are we actually solving?',
        text: 'When a printed definition, a natural correction, and authorial intent diverge, map the versions before discussing what a result resolves.',
      },
      {
        date: '2026.07',
        title: 'A strong backtest is not the end of the research',
        text: 'How data snooping, trading costs, and regime changes jointly erode out-of-sample performance—and which tests remain informative.',
      },
      {
        date: '2026.06',
        title: 'Keeping negative results visible',
        text: 'Failed models and rejected explanations are not waste; they determine where the next investigation should begin.',
      },
    ],
    aboutLabel: 'About',
    aboutTitle: 'I care more about a clearer question than a more complicated model.',
    aboutText: [
      'I am an undergraduate at the School of Mathematical Sciences, Peking University. Mathematics taught me to inspect definitions, assumptions, and logical boundaries; quantitative research showed me how often real data refuses the world a model presumes.',
      'I value falsifiable claims, experiments that can be rebuilt from scratch, and writing that keeps its limitations visible. I also turn these habits into small, useful open-source tools.',
    ],
    facts: [
      ['Study', 'Mathematics, statistics, finance'],
      ['Tools', 'Python, SQL, LaTeX'],
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
        ? '唐庆军 | 数学、统计与金融'
        : 'Qingjun Tang | Mathematics, Statistics, Finance'
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
          {t.research.map((item) => {
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
