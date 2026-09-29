// Public repository snapshot reviewed on 2026-09-29. No client-side API calls.
type Project = {
  repo: string
  name: [string, string]
  label: [string, string]
  description: [string, string]
  links?: { path: string; label: [string, string] }[]
}

export const projects: Project[] = [
  {
    repo: 'advanced-mathematical-statistics-notes',
    name: ['高等统计学笔记', 'Advanced Mathematical Statistics Notes'],
    label: ['统计学学习', 'Statistics study notes'],
    description: ['依据 Fang Yao 老师课程讲义整理的个人中文学习笔记，包含术语翻译、直观解释、推导与例题。已整理经验分布、统计模型、指数族、充分性与完备性等前两章内容，附独立 PDF、LaTeX 源码和学习历程；并非课程官方讲义或译本。', 'Personal Chinese study notes based on Fang Yao’s course lectures, with terminology, intuition, derivations, and worked examples. The first two chapters cover empirical distributions, statistical models, exponential families, sufficiency, and completeness, with PDFs, LaTeX sources, and a learning log. These are not official course notes or translations.'],
    links: [
      { path: 'blob/main/output/pdf/chapter-01-cn.pdf', label: ['第 1 章 PDF', 'Chapter 1 PDF'] },
      { path: 'blob/main/output/pdf/chapter-02-cn.pdf', label: ['第 2 章 PDF', 'Chapter 2 PDF'] },
      { path: 'blob/main/PROGRESS.md', label: ['学习进度', 'Study progress'] },
    ],
  },
  {
    repo: 'ThesisCraft', name: ['ThesisCraft · 学研排版', 'ThesisCraft'],
    label: ['论文排版', 'Thesis formatting'],
    description: ['本地 Word / WPS 论文排版工具，支持学校模板、中西文字体、标题编号、图表公式交叉引用与排版检查。', 'Local thesis formatting for Word and WPS, with institutional templates, Chinese and Latin typography, heading numbering, cross-references, and layout checks.'],
  },
  {
    repo: 'paperstage-skill', name: ['PaperStage', 'PaperStage'],
    label: ['学术演示', 'Academic presentations'],
    description: ['供 AI 助手使用的科研演示技能，结合 LaTeX 公式、学术版式与来源核查，支持根据论文和机构模板制作 PPT。', 'A research presentation skill for AI assistants, combining LaTeX-source equations, academic layouts, and source checks to build slides from papers and institutional references.'],
  },
  {
    repo: 'academic-clipboard', name: ['Academic Clipboard', 'Academic Clipboard'],
    label: ['科研素材', 'Research snippets'],
    description: ['面向学习与研究的本地优先悬浮剪贴板，保存文本与截图，整理来源、页码和批注，并转换 DOI、BibTeX、公式与表格片段。', 'A local-first floating clipboard for text and screenshots, with source, page, and annotation records and conversions for DOI, BibTeX, equation, and table snippets.'],
  },
]

export const otherProjects = [
  { repo: 'AutoElectiveOrb', name: ['AutoElectiveOrb', 'AutoElectiveOrb'], description: ['Windows 悬浮选课助手，提供课程余量监控、抽签结果查看与换课前检查；验证码识别使用第三方在线服务。', 'A Windows course assistant with availability monitoring, lottery-result viewing, and pre-swap checks; CAPTCHA recognition uses a third-party online service.'] },
  { repo: 'codex-daily-token-dashboard', name: ['Codex Daily Token Widget', 'Codex Daily Token Widget'], description: ['从本机会话日志汇总每日、任务与轮次 Token 用量的 Windows 悬浮窗和网页看板；统计不等同于 API 账单或订阅额度。', 'A Windows widget and web dashboard for daily, task, and turn-level token usage from local session logs; these counts are not API billing or subscription quota figures.'] },
  { repo: 'DropOrb', name: ['DropOrb', 'DropOrb'], description: ['文件、剪贴板与快捷操作的 Windows 拖放悬浮球', 'A Windows drop orb for files, clipboard content, and quick actions'] },
]
