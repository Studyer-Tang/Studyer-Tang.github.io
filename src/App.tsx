import './App.css'

const researchInterests = [
  'Financial machine learning',
  'Quantitative finance',
  'Financial time series',
  'Market microstructure',
  'Portfolio optimization',
  'Interpretable machine learning',
]

const projects = [
  {
    title: 'Financial Paper Reproduction',
    type: 'Research workflow',
    description:
      'Reproducing empirical finance papers with clear data notes, baseline models, robustness checks, and transparent experiment records.',
    items: ['Data documentation', 'Python notebooks', 'Result validation'],
  },
  {
    title: 'Quantitative Finance Playground',
    type: 'Learning lab',
    description:
      'Small, focused experiments for understanding factor models, risk measurement, volatility modeling, and time-series forecasting.',
    items: ['Factor models', 'Risk metrics', 'Rolling validation'],
  },
  {
    title: 'Research Notes',
    type: 'Knowledge base',
    description:
      'Structured notes for papers, methods, research questions, limitations, and possible extensions.',
    items: ['Paper summaries', 'Method notes', 'Research ideas'],
  },
]

const principles = [
  'Make assumptions explicit.',
  'Treat reproducibility as part of the result.',
  'Prefer careful verification over fast-looking output.',
]

function App() {
  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#home" aria-label="Qingjun home">
          Qingjun
        </a>
        <div className="navlinks">
          <a href="#research">Research</a>
          <a href="#projects">Projects</a>
          <a href="#notes">Notes</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Peking University · Research Preparation</p>
          <h1>Financial machine learning, built with reproducible habits.</h1>
          <p className="lede">
            I am Qingjun, a student preparing for doctoral-level research at the
            intersection of finance, statistics, and machine learning. I am
            building my foundation through coursework, paper reproduction, and
            small empirical projects.
          </p>
          <div className="hero-actions" aria-label="Contact and profile links">
            <a className="button primary" href="mailto:2300010828@stu.pku.edu.cn">
              Email me
            </a>
            <a className="button secondary" href="https://github.com/Studyer-Tang">
              GitHub
            </a>
          </div>
        </div>
        <aside className="status-panel" aria-label="Current focus">
          <span className="panel-label">Current Focus</span>
          <h2>From coursework to research output</h2>
          <p>
            Probability, econometrics, financial time series, machine learning,
            and reproducible computational experiments.
          </p>
          <div className="signal-grid">
            <span>Python</span>
            <span>R</span>
            <span>LaTeX</span>
            <span>Zotero</span>
          </div>
        </aside>
      </section>

      <section className="section intro">
        <p>
          Good research should be understandable, reproducible, and open to
          verification. This site collects my research direction, projects, notes,
          and long-term academic goals.
        </p>
      </section>

      <section className="section split" id="research">
        <div>
          <p className="section-kicker">Research</p>
          <h2>Questions I am learning to ask carefully</h2>
        </div>
        <div className="interest-list">
          {researchInterests.map((interest) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
      </section>

      <section className="section" id="projects">
        <div className="section-heading">
          <p className="section-kicker">Projects</p>
          <h2>Work in progress</h2>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.title}>
              <p className="project-type">{project.type}</p>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <ul>
                {project.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section timeline" id="notes">
        <div className="section-heading">
          <p className="section-kicker">Workflow</p>
          <h2>How I turn reading into research practice</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <p>Collect papers and maintain literature notes with Zotero and Markdown.</p>
          </li>
          <li>
            <span>02</span>
            <p>Extract research questions, assumptions, data choices, and limitations.</p>
          </li>
          <li>
            <span>03</span>
            <p>Reproduce baseline results in Python with documented experiment settings.</p>
          </li>
          <li>
            <span>04</span>
            <p>Write short reports that separate empirical evidence from speculation.</p>
          </li>
        </ol>
      </section>

      <section className="section principles">
        <div className="section-heading">
          <p className="section-kicker">Principles</p>
          <h2>Research habits I want to keep</h2>
        </div>
        <div className="principle-row">
          {principles.map((principle) => (
            <p key={principle}>{principle}</p>
          ))}
        </div>
      </section>

      <footer className="footer" id="contact">
        <div>
          <p className="section-kicker">Contact</p>
          <h2>Open to research conversations in quantitative finance and ML.</h2>
        </div>
        <div className="footer-links">
          <a href="mailto:2300010828@stu.pku.edu.cn">2300010828@stu.pku.edu.cn</a>
          <a href="https://github.com/Studyer-Tang">github.com/Studyer-Tang</a>
        </div>
      </footer>
    </main>
  )
}

export default App
