# Qingjun’s academic homepage

A bilingual academic homepage for statistics, financial markets and practical
research tools. [Visit the site](https://studyer-tang.github.io/).

## Editing

- Biography, education and research: `src/App.tsx`; keep future plans clearly labelled.
- Reading: `src/reading.ts` and `src/further-reading.ts`.
- Project layout: `src/ProjectSection.tsx`. Styling: `src/App.css` and `src/index.css`.
- Project facts: `src/projects.json` is a local development snapshot, refreshed during
  every production build. Change a project's GitHub **About description** to update
  its summary; do not maintain a second project list here.

## Automatic project updates

The Pages workflow runs on main pushes, manual dispatch, and every six hours.
It checks out the shared standard-library Python generator from
[the profile repository](https://github.com/Studyer-Tang/Studyer-Tang/blob/main/scripts/sync_projects.py),
fetches current public repositories and releases, then builds and deploys in the
same run. New projects appear automatically; deleted, private, archived and forked
repositories disappear. Previews are labelled separately from stable releases.
An API failure stops deployment and preserves the last successful live site.

No browser-side API calls, tracking, external widget service or personal access token
is required. Descriptions retain the language of the repository About field; headings
and interface labels are bilingual. Personal information is never generated from code.

Schedules may be delayed; GitHub disables schedules in public repositories after
60 days without activity. Re-enable them under Actions when needed. See
[automation details](https://github.com/Studyer-Tang/Studyer-Tang/blob/main/AUTOMATION.md).

## Development

```sh
npm ci
npm run dev
npm run lint
npm run build
```

English: `?lang=en`; Chinese: `?lang=zh`; reading: `?lang=zh&page=reading`.
PRs run checks without deploying. Main pushes, manual runs and scheduled runs deploy
with the GitHub Pages environment. In Settings → Pages, the source is GitHub Actions.
