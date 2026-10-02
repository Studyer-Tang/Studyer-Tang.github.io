import catalog from './projects.json'

export type Project = {
  repo: string
  name: string[]
  label: string[]
  description: string
  summary?: string[]
  url: string
  language: string | null
  pushedAt: string
  release: { tag: string; url: string; prerelease: boolean; publishedAt: string } | null
}

// Optional summaries keep older generator snapshots usable during rollout.
export const projects: Project[] = catalog.projects
// updatedAt records a catalog change, rather than every scheduled API check.
export const projectsUpdated = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(catalog.updatedAt))
