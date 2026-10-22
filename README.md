# Studyer-Tang · Field notes

A bilingual personal space for interests, reading and research questions.
[Visit the site](https://studyer-tang.github.io/). An original night-lake landscape
frames an open editorial cover with personal interests, research interests, a
bookshelf and an about page. Self-hosted Chinese and Latin serif fonts keep the
typography consistent across platforms. Only the GitHub handle is used for the owner's identity.

## Editing

- Page copy and GitHub contact: `src/App.tsx`.
- Personal interests: `src/interests.ts`.
- Research interests: `src/research.ts`.
- Reading: `src/literature.ts`, `src/reading.ts` and `src/further-reading.ts`.
- Routing: `src/navigation.ts`.
  Styling: `src/App.css` and `src/index.css`.
- Route transitions: `src/useRouteTransition.ts` and `src/route-transition.ts`.
- Font sources, licenses and regeneration: [font assets](public/fonts/README.md).
- Scenery and motion controls: `src/Scenery.tsx` and `src/Scenery.css`.
  Image provenance and generation prompt: [visual assets](docs/visual-assets.md).

The site is self-contained: no repository catalog, browser-side API calls,
tracking, external widget service or personal access token is required. Research
text describes interests, not completed results or a fixed research plan. Reading
entries are suggestions and interests, not a completed reading log.

## Development

```sh
npm ci
npm run dev
npm test
npm run check:fonts
npm run lint
npm run build
```

Chinese is the default; English: `?lang=en`. Chapters use `?chapter=interests`,
`research`, `reading`, or `personal` (About & contact). The previous `?lang=zh&page=reading` and
section anchors remain supported. Browser back/forward restores chapters and
language. Former project URLs now open personal interests. A horizontal two-finger trackpad swipe over the main content changes
one section at a time, with momentum filtered; vertical scrolling and pinch zoom
retain their normal behavior. Mobile visitors use the visible navigation links.
Scenery uses local WebP images with CSS water, mist and camera movement. The motion
button pauses the background; system reduced-motion preferences and hidden tabs
also stop it. It uses no per-frame JavaScript, video download or motion library.
The switch applies to the current visit and writes no browser storage.
PRs run checks without deploying. Main pushes and manual runs deploy
with the GitHub Pages environment. In Settings → Pages, the source is GitHub Actions.

The centered identity and concise navigation were inspired by
[dmego/home.github.io](https://github.com/dmego/home.github.io). The interface,
landscape and implementation here are original; no upstream scripts, photographs,
fonts or services are loaded by visitors.

Navigation uses native view transitions where available and a short CSS entry
animation elsewhere. Trackpad gestures remain scoped to the content; vertical
scrolling is preserved. System reduced-motion settings disable transitions and
landscape motion. The mountains stay still while water and mist move gently.
