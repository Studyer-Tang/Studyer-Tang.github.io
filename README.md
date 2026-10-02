# Qingjun’s academic homepage

A bilingual academic homepage for statistics, financial markets and practical
research tools. [Visit the site](https://studyer-tang.github.io/). The interface is
an open book, with a title page, a prose preface, chapter bookmarks and facing pages.

## Editing

- Biography, education and research: `src/App.tsx`; keep future plans clearly labelled.
- Reading: `src/reading.ts` and `src/further-reading.ts`.
- Project entries: `src/ProjectSection.tsx`. Book layout and navigation: `src/App.tsx`.
  Styling: `src/App.css` and `src/index.css`.
- Project facts: `src/projects.json` is a local development snapshot, refreshed during
  every production build. Names, categories and bilingual summaries are maintained
  in the profile generator's `FEATURED` and `SUMMARIES`; URLs, GitHub About fields
  and release metadata remain automatic. New repositories use their About field
  until a human-edited summary is added. Do not maintain a separate project list here.

## Automatic project updates

The Pages workflow runs on main pushes, manual dispatch, and every six hours.
It checks out the shared standard-library Python generator from
[the profile repository](https://github.com/Studyer-Tang/Studyer-Tang/blob/main/scripts/sync_projects.py),
fetches current public repositories and releases, then builds and deploys in the
same run. New projects appear automatically; deleted, private, archived and forked
repositories disappear. Prereleases are labelled separately from other published releases.
An API failure stops deployment and preserves the last successful live site.

No browser-side API calls, tracking, external widget service or personal access token
is required. Headings and interface labels are bilingual. Curated project summaries are bilingual;
unlisted repositories retain their About language. Personal information is never
generated from code. A published release label makes no claim of stability.

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

Chinese is the default; English: `?lang=en`. Chapters use `?chapter=projects`,
`research`, `reading`, or `personal`. The previous `?lang=zh&page=reading` and
section anchors remain supported. Browser back/forward restores chapters and
language. On narrow screens the facing pages form one reading column; reduced
motion disables the page animation. Published release tags are labelled
“Release”, with prereleases identified separately.
PRs run checks without deploying. Main pushes, manual runs and scheduled runs deploy
with the GitHub Pages environment. In Settings → Pages, the source is GitHub Actions.
