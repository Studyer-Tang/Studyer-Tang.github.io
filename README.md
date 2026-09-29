# Studyer-Tang's Academic Homepage

Personal academic homepage for Studyer-Tang at the School of Mathematical
Sciences, Open research. Focus: high-frequency equity data, market
microstructure, and statistical forecasting.

The bilingual homepage contains research interests, education, software, and
contact details. Reading recommendations live at `?page=reading&lang=en`
(or `lang=zh`) so both views work directly on GitHub Pages.

Edit biography, education, and research themes in `src/App.tsx`. Reading data
is in `src/reading.ts` and `src/further-reading.ts`. Education currently marks
公开项目与学习记录。 / Public projects and study notes.
planned doctoral studies; review the status when enrollment begins. Update
the `updated` date and `index.html` metadata when changing the biography.

## Local Development

Public project descriptions live in `src/projects.ts` (English and Chinese).
The list was checked against public GitHub repositories on 2026-09-29 and is
rendered locally without GitHub API requests from visitors' browsers.
It covers all seven public study/tool repositories; the profile and homepage
repositories are linked separately. When repositories are added, removed, or
made private, review this list and the bilingual profile READMEs together.
Check descriptions against each project's README, and update the footer date
in `src/App.tsx`. The statistics notes' chapter links should follow their
published PDFs and `PROGRESS.md`.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

Create a GitHub repository named `Studyer-Tang.github.io`, push this project to
the `main` branch, and enable GitHub Pages with GitHub Actions as the source.

The included workflow in `.github/workflows/deploy.yml` will build the site and
publish `dist` automatically after each push to `main`.
