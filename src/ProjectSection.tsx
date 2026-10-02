import { projects } from './projects'
type Project = (typeof projects)[number]
export function ProjectEntries({ entries, zh, offset = 0 }: { entries: Project[]; zh: boolean; offset?: number }) {
  const t = (cn: string, en: string) => zh ? cn : en
  return <ol className="project-entries" start={offset + 1}>{entries.map((project, index) => <li key={project.repo}>
    <span className="entry-number" aria-hidden="true">{String(index + offset + 1).padStart(2, '0')}</span>
    <article><div className="entry-meta"><span>{project.repo === 'learning-theory-to-optimization' ? t('数学推导与实验', 'Derivations & experiments') : project.label[zh ? 0 : 1]}</span><span>{project.language}</span></div>
      <h3><a href={project.url}>{project.repo === 'learning-theory-to-optimization' ? t('学习理论与优化', 'Learning theory & optimization') : project.name[zh ? 0 : 1]} <span aria-hidden="true">↗</span></a></h3>
      <p>{project.summary?.[zh ? 0 : 1] || project.description || t('项目说明与源代码见仓库。', 'Documentation and source are in the repository.')}</p>
      <div className="entry-links"><a href={project.url}>{t('代码与文档', 'Source & notes')} ↗</a>{project.release && <a href={project.release.url}>{project.release.tag} · {project.release.prerelease ? t('预览发布', 'Prerelease') : t('版本发布', 'Release')} ↗</a>}</div>
    </article>
  </li>)}</ol>
}
