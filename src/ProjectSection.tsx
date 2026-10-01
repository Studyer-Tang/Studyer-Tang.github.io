import { projects, projectsUpdated } from './projects'

export function Projects({ zh }: { zh: boolean }) {
  const t = (cn: string, en: string) => zh ? cn : en
  return <section id="software" aria-labelledby="projects-title">
    <div className="section-heading"><span aria-hidden="true">01</span><h2 id="projects-title">{t('开源项目', 'Open-source projects')}</h2><span className="project-count">{projects.length}</span></div>
    <p className="section-note">{t('从论文摘录、写作排版到统计学学习，把日常研究中的重复工作做得更轻。', 'Practical tools for collecting research, formatting papers and studying statistics.')}</p>
    <div className="project-grid">{projects.map(project => <article className="project-card" key={project.repo}>
      <div className="project-meta"><span className="topic-label">{project.label[zh ? 0 : 1]}</span><span>{project.language}</span></div>
      <h3><a href={project.url}>{project.name[zh ? 0 : 1]} <span aria-hidden="true">↗</span></a></h3>
      <p className="project-description">{project.description || t('查看仓库中的使用说明。', 'See the repository for usage instructions.')}</p>
      <div className="project-bottom">
        {project.release ? <>
          <p className="release-status"><span className={project.release.prerelease ? 'release-preview' : 'release-stable'}>{project.release.prerelease ? t('预览版', 'Preview') : t('正式版', 'Stable')}</span> <span>{project.release.tag}</span></p>
          <div className="project-actions"><a className="release-link" href={project.release.url}>{t('查看发布', 'View release')} ↗</a><a href={project.url}>{t('代码与文档', 'Code & docs')} ↗</a></div>
        </> : <>
          <p className="release-status">{t('源码与使用文档', 'Source & documentation')}</p>
          <div className="project-actions"><a href={project.url}>{t('浏览项目', 'Explore project')} ↗</a></div>
        </>}
      </div>
    </article>)}</div>
    <div className="projects-footer"><p>{t('项目数据更新', 'Project data updated')} <time dateTime={projectsUpdated}>{projectsUpdated}</time> · {t('每 6 小时同步', 'Synced every 6 hours')}</p><a href="https://github.com/Studyer-Tang?tab=repositories">{t('全部仓库', 'All repositories')} ↗</a></div>
  </section>
}
