import { useState } from 'react'
import './App.css'

type Language = 'en' | 'zh'

const content = {
  en: {
    nav: ['Research', 'Projects', 'Writing', 'Contact'],
    langLabel: '中文',
    eyebrow: 'Peking University · Mathematics · Finance · Statistics',
    title: 'Qingjun Tang',
    subtitle:
      'Student and independent research enthusiast working toward rigorous, reproducible research in mathematics, statistical inference, and quantitative finance.',
    primary: 'View projects',
    secondary: 'Contact',
    statusTitle: 'Current direction',
    status:
      'I study how formal reasoning, empirical validation, and careful computational practice can make AI-assisted research more reliable.',
    metrics: [
      ['Focus', 'Mathematics and inference'],
      ['Methods', 'Proofs, statistics, computation'],
      ['Tools', 'Python, LaTeX, Git'],
    ],
    researchKicker: 'Research Interests',
    researchTitle: 'Problems I like are precise, testable, and slightly stubborn.',
    interests: [
      'Algebra and mathematical structures',
      'Statistical inference and uncertainty',
      'Quantitative finance and risk',
      'Reproducible computational research',
      'AI-assisted mathematical verification',
      'Financial time series and empirical modeling',
    ],
    projectsKicker: 'Selected Work',
    projectsTitle: 'Public projects with a verification-first style.',
    projects: [
      {
        name: 'Rigorous Research',
        tag: 'Codex Skill',
        href: 'https://github.com/Studyer-Tang/rigorous-research',
        description:
          'Inference-contract tooling for mathematical proofs, statistical inference, and quantitative finance.',
      },
      {
        name: 'Personal Research Profile',
        tag: 'Website',
        href: 'https://github.com/Studyer-Tang',
        description:
          'A bilingual academic profile collecting interests, notes, projects, and contact information.',
      },
      {
        name: 'Research Notes',
        tag: 'In progress',
        href: 'https://github.com/Studyer-Tang?tab=repositories',
        description:
          'Reading notes and small experiments for turning papers into reproducible research questions.',
      },
    ],
    writingKicker: 'Working Style',
    writingTitle: 'A compact research loop',
    steps: [
      ['Read', 'Extract definitions, assumptions, and the exact claim being made.'],
      ['Check', 'Separate symbolic reasoning, numerical evidence, and unsupported inference.'],
      ['Reproduce', 'Keep data choices, code paths, and negative results visible.'],
      ['Write', 'State the scope carefully before claiming novelty or resolution.'],
    ],
    contactKicker: 'Contact',
    contactTitle: 'Open to careful conversations about math, finance, statistics, and research tooling.',
    email: 'Email',
    github: 'GitHub',
  },
  zh: {
    nav: ['研究方向', '项目', '写作方法', '联系'],
    langLabel: 'EN',
    eyebrow: '北京大学 · 数学 · 金融 · 统计',
    title: 'Qingjun Tang',
    subtitle:
      '学生与独立数学爱好者，关注数学、统计推断与量化金融中的严谨性、可复现性和可验证研究。',
    primary: '查看项目',
    secondary: '联系我',
    statusTitle: '当前方向',
    status:
      '我关心形式推理、经验验证与计算实践如何结合，帮助人和 AI 协作时更可靠地做研究。',
    metrics: [
      ['关注', '数学与推断'],
      ['方法', '证明、统计、计算'],
      ['工具', 'Python、LaTeX、Git'],
    ],
    researchKicker: '研究兴趣',
    researchTitle: '我喜欢边界清楚、可以检验、又有一点顽固的问题。',
    interests: [
      '代数与数学结构',
      '统计推断与不确定性',
      '量化金融与风险',
      '可复现计算研究',
      'AI 辅助数学验证',
      '金融时间序列与实证建模',
    ],
    projectsKicker: '代表项目',
    projectsTitle: '以验证优先为风格的公开项目。',
    projects: [
      {
        name: 'Rigorous Research',
        tag: 'Codex Skill',
        href: 'https://github.com/Studyer-Tang/rigorous-research',
        description: '面向数学证明、统计推断和量化金融的 inference-contract 工具。',
      },
      {
        name: 'Personal Research Profile',
        tag: 'Website',
        href: 'https://github.com/Studyer-Tang',
        description: '双语学术主页，用于整理研究兴趣、笔记、项目和联系方式。',
      },
      {
        name: 'Research Notes',
        tag: '进行中',
        href: 'https://github.com/Studyer-Tang?tab=repositories',
        description: '把论文阅读转化为可复现实验与清晰研究问题的笔记系统。',
      },
    ],
    writingKicker: '工作方式',
    writingTitle: '一个紧凑的研究循环',
    steps: [
      ['阅读', '抽取定义、假设与真正需要证明的命题。'],
      ['检查', '区分符号推理、数值证据和没有支撑的推断。'],
      ['复现', '保留数据选择、代码路径与负面结果。'],
      ['写作', '在声称新颖性或解决问题之前，先说清楚适用范围。'],
    ],
    contactKicker: '联系',
    contactTitle: '欢迎交流数学、金融、统计与研究工具中的严谨性问题。',
    email: '邮箱',
    github: 'GitHub',
  },
}

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const t = content[language]

  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#home" aria-label="Qingjun Tang home">
          QT
        </a>
        <div className="navlinks">
          {t.nav.map((item, index) => (
            <a key={item} href={['#research', '#projects', '#writing', '#contact'][index]}>
              {item}
            </a>
          ))}
          <button
            className="language-toggle"
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            aria-label="Switch language"
          >
            {t.langLabel}
          </button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className="lede">{t.subtitle}</p>
            <div className="hero-actions" aria-label="Primary links">
              <a className="button primary" href="#projects">
                {t.primary}
              </a>
              <a className="button secondary" href="mailto:2300010828@stu.pku.edu.cn">
                {t.secondary}
              </a>
            </div>
          </div>

          <aside className="signal-panel" aria-label="Research status">
            <div className="panel-ring" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="panel-kicker">{t.statusTitle}</p>
            <p className="panel-text">{t.status}</p>
            <dl>
              {t.metrics.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="section research" id="research">
        <div className="section-head">
          <p className="section-kicker">{t.researchKicker}</p>
          <h2>{t.researchTitle}</h2>
        </div>
        <div className="interest-grid">
          {t.interests.map((interest) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
      </section>

      <section className="section projects" id="projects">
        <div className="section-head">
          <p className="section-kicker">{t.projectsKicker}</p>
          <h2>{t.projectsTitle}</h2>
        </div>
        <div className="project-grid">
          {t.projects.map((project) => (
            <a className="project-card" href={project.href} key={project.name}>
              <span>{project.tag}</span>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="section writing" id="writing">
        <div className="section-head">
          <p className="section-kicker">{t.writingKicker}</p>
          <h2>{t.writingTitle}</h2>
        </div>
        <div className="step-list">
          {t.steps.map(([label, body], index) => (
            <article key={label}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{label}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer" id="contact">
        <div>
          <p className="section-kicker">{t.contactKicker}</p>
          <h2>{t.contactTitle}</h2>
        </div>
        <div className="footer-links">
          <a href="mailto:2300010828@stu.pku.edu.cn">{t.email}</a>
          <a href="https://github.com/Studyer-Tang">{t.github}</a>
        </div>
      </footer>
    </main>
  )
}

export default App
