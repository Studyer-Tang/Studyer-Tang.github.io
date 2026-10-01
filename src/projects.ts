import catalog from './projects.json'

// Refreshed at build time; visitors never need a GitHub API request.
export const projects = catalog.projects
export const projectsUpdated = catalog.updatedAt.slice(0, 10)
