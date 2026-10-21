# Studyer-Tang · Field notes

A bilingual academic homepage for statistics, financial markets and practical
research tools. [Visit the site](https://studyer-tang.github.io/). An original
night-lake landscape frames a quiet cover, with dedicated project, research,
reading and about pages. Only the GitHub handle is used for the owner's identity.

## Editing

- Public project overview and GitHub contact: `src/App.tsx`.
- Research questions, planned experiments and scope: `src/research.ts`.
- Reading: `src/reading.ts` and `src/further-reading.ts`.
- Project entries: `src/ProjectSection.tsx`. Routing: `src/navigation.ts`.
  Styling: `src/App.css` and `src/index.css`.
- Scenery and motion controls: `src/Scenery.tsx` and `src/Scenery.css`.
  Image provenance and generation prompt: [visual assets](docs/visual-assets.md).
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
unlisted repositories retain their About language. The scheduled generator refreshes
project facts only. A published release label makes no claim of stability.

Schedules may be delayed; GitHub disables schedules in public repositories after
60 days without activity. Re-enable them under Actions when needed. See
[automation details](https://github.com/Studyer-Tang/Studyer-Tang/blob/main/AUTOMATION.md).

## Development

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Chinese is the default; English: `?lang=en`. Chapters use `?chapter=projects`,
`research`, `reading`, or `personal` (About & contact). The previous `?lang=zh&page=reading` and
section anchors remain supported. Browser back/forward restores chapters and
language. A horizontal two-finger trackpad swipe over the main content changes
one section at a time, with momentum filtered; vertical scrolling and pinch zoom
retain their normal behavior. Mobile visitors use the visible navigation links.
Scenery uses local WebP images with CSS water, mist and camera movement. The motion
button pauses the background; system reduced-motion preferences and hidden tabs
also stop it. It uses no per-frame JavaScript, video download or motion library.
The switch applies to the current visit and writes no browser storage.
Published release tags are labelled
“Release”, with prereleases identified separately.
PRs run checks without deploying. Main pushes, manual runs and scheduled runs deploy
with the GitHub Pages environment. In Settings → Pages, the source is GitHub Actions.

The centered identity and concise navigation were inspired by
[dmego/home.github.io](https://github.com/dmego/home.github.io). The interface,
landscape and implementation here are original; no upstream scripts, photographs,
fonts or services are loaded by visitors.
