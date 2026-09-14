// Public repository snapshot reviewed on 2026-09-14. No client-side API calls.
export const projects = [
  {
    repo: 'ThesisCraft', name: 'ThesisCraft',
    label: ['论文排版', 'Thesis formatting'],
    description: ['本地 Word / WPS 论文排版工具，支持学校模板、中西文字体、标题编号、图表公式交叉引用与排版检查。', 'Local thesis formatting for Word and WPS, with institutional templates, Chinese and Latin typography, heading numbering, cross-references, and layout checks.'],
  },
  {
    repo: 'rigorous-research', name: 'Rigorous Research', alias: 'PaperTrail',
    label: ['研究核查', 'Research review'],
    description: ['面向数学证明、统计推断与量化金融的研究工具，记录假设、证据和计算过程。PaperTrail 提供论文结论与来源的整理、核查界面。', 'Tools for mathematical proofs, statistical inference, and quantitative finance that record assumptions, evidence, and computations. PaperTrail organizes paper claims and their supporting sources for review.'],
  },
  {
    repo: 'paperstage-skill', name: 'PaperStage',
    label: ['学术演示', 'Academic presentations'],
    description: ['供 AI 助手使用的科研演示技能，结合 LaTeX 公式、学术版式与来源核查，支持根据论文和机构模板制作 PPT。', 'A research presentation skill for AI assistants, combining LaTeX-source equations, academic layouts, and source checks to build slides from papers and institutional references.'],
  },
  {
    repo: 'academic-clipboard', name: 'Academic Clipboard',
    label: ['科研素材', 'Research snippets'],
    description: ['面向学习与研究的本地优先悬浮剪贴板，整理复制内容和研究片段，减少材料在不同应用间流转的负担。', 'A local-first floating clipboard and snippet manager for study and research, helping keep copied material organized across applications.'],
  },
]

export const otherProjects = [
  { repo: 'advanced-mathematical-statistics-notes', name: ['高等统计学笔记', 'Advanced statistics notes'], description: ['中文学习笔记、推导与例题', 'Chinese study notes, derivations, and worked examples'] },
  { repo: 'AutoElectiveOrb', name: ['AutoElectiveOrb', 'AutoElectiveOrb'], description: ['带本地 OCR 与选课前检查的 Windows 悬浮助手', 'A Windows course assistant with local OCR and preflight checks'] },
  { repo: 'codex-daily-token-dashboard', name: ['Codex Daily Token Dashboard', 'Codex Daily Token Dashboard'], description: ['本地使用量看板', 'A local usage dashboard'] },
  { repo: 'DropOrb', name: ['DropOrb', 'DropOrb'], description: ['文件、剪贴板与快捷操作的 Windows 拖放悬浮球', 'A Windows drop orb for files, clipboard content, and quick actions'] },
]
