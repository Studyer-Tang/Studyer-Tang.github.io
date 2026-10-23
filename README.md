# Studyer-Tang · Field notes

A bilingual personal space for interests, reading and research questions.
[Visit the site](https://studyer-tang.github.io/). Four licensed landscape
photographs frame the cover; an optional island lets visitors walk or run between
a Chinese palace, observatory, woodland and offshore pier. Only the GitHub handle is
used for the owner's identity.

## Editing

- Page copy and contact: `src/App.tsx`; interests: `src/interests.ts`;
  research: `src/research.ts`; reading: `src/literature.ts`, `src/reading.ts`
  and `src/further-reading.ts`.
- Routing: `src/navigation.ts`. Typography/layout: `src/index.css`, `src/App.css`.
- Route transitions: `src/useRouteTransition.ts`, `src/route-transition.ts`.
- Landscapes: `src/Scenery.tsx`, `src/Scenery.css`, `src/AmbientLight.tsx`.
  Photo files: `public/photos/`; source records: `src/photographs.json`;
  [photographers, licenses and modifications](docs/photography.md).
- Island: `src/IslandGate.tsx` lazily opens `src/IslandExplorer.tsx`;
  `src/island/world.ts` builds the scene, `movement.ts` handles collision and
  pathfinding, and `landmarks.ts` maps places to chapters.
- Activities: `src/Seascape.tsx` opens a photographic panorama;
  `src/observatory/` contains the sky chart and local ephemeris calculations.
- [Scene assets](docs/world-assets.md), [animated actors](docs/actors.md), and
  [visual asset and data licenses](docs/visual-assets.md).
- [Font sources, licenses and subset regeneration](public/fonts/README.md).

Research text describes interests, not completed results or a fixed research
plan. Reading entries are suggestions and interests, not a completed reading log.
There is no project catalog, tracking, browser-side account API or token.
All visitor assets are hosted with the site; photography credit links open their
original sources only when followed.

## Development

```sh
npm ci
npm run dev
npm test
npm run check:fonts
npm run lint
npm run build
```

Chinese is the default; English uses `?lang=en`. Chapters use
`?chapter=interests`, `research`, `reading`, or `personal`. Previous page query
parameters and section anchors remain supported. Back/forward restores chapters,
language and the island overlay; `?island=1` opens the island directly.
A horizontal two-finger trackpad swipe over main content changes one chapter at a
time, filtering momentum. Vertical scrolling and pinch zoom keep normal behavior.

## Landscape and island controls

The cover changes photograph every 28 seconds. Numbered buttons and arrows also
select a scene. A new image loads before crossfading; each scene shows its author,
original source, license and crop/compression notice. Responsive WebP versions
are 2000×1250 on desktop and 900×1200 on phones. The eight files total 1.26 MiB;
only the selected size and scene are requested. Fine ambient light follows the
pointer at up to 30 fps. Reading, reduced motion, hidden tabs, the island and the
pause switch stop automatic scenery changes and light animation. No preferences
or personal data are written to browser storage.

Choose **Explore the island** to load the separate Three.js scene. Use **WASD**
or arrow keys to walk, **Shift** to run, and **E** near a landmark to enter its
activity or chapter. Click the ground to walk there; drag to orbit the camera,
and scroll to zoom. Touch screens
have a direction joystick and a hold-to-run button. Keyboard movement applies
only while the canvas has focus. Pause, reset and Escape/Leave are always
available; equivalent text links reach every chapter without walking.

The palace, curved eaves, stone terraces, paths and pier are authored in code;
photographic PBR surfaces, scanned vegetation and rigged animated actors supply
the detail. The pier is part of the walkable world. A nearby fox can be petted,
fed, invited along or asked to stay. Asset provenance, derivative hashes and
licenses are retained in the repository and the island's Credits menu.
The island is a designed setting, not a reconstruction of the cover photographs.
Rendering is
capped at DPR 1.5, with 30 fps idle/mobile and up to 60 fps while moving. Hidden
or paused scenes stop their frame loop; closing disposes scene resources. System
reduced motion starts the island paused and disables its ambient movement.
WebGL failures retain the content links and a retry option. The 3D engine loads
only after entering the island; ordinary reading does not require WebGL.

At the pier, **Real sea view** opens a self-hosted 360° photograph of Fish Hoek
Beach, South Africa: 8K on supported desktop devices and 4K on smaller devices.
Drag or use arrow keys to look around; the zoom buttons and wheel change the
field of view. This is a dated still panorama, not a live camera. It renders on
demand and releases its GPU resources on exit. Compressed file size is not GPU
memory usage: an 8K RGBA image alone uses about 128 MiB when decoded.

The **Observatory** plots 400 real HYG catalog stars and locally calculates the
Sun and Moon for a chosen UTC time and latitude/longitude. It starts at Greenwich
and does not request the visitor's location. Select a star to inspect its
position, change the magnitude limit, or advance the time. Moon and Sun tabs show
dated NASA archive photographs, separately from the calculated sky; they are
not live telescope views. The chart is educational and omits weather, refraction
and local obstructions. HYG data retains CC BY-SA 4.0, NASA imagery its published
usage terms, and Astronomy Engine its MIT license. No visitor input is uploaded.

## Deployment and references

PRs run checks without deploying. Main pushes and manual runs build and deploy
through the GitHub Pages environment. Settings → Pages uses GitHub Actions.

The concise cover originally drew inspiration from
[dmego/home.github.io](https://github.com/dmego/home.github.io). Scene switching,
small interactive details and exploration draw respectively on
[Anthony Fu](https://antfu.me/), [Josh W. Comeau](https://www.joshwcomeau.com/) and
[Bruno Simon](https://bruno-simon.com/). The interface and island implementation
are independently authored. Third-party photography and fonts keep their own
licenses; see [visual assets](docs/visual-assets.md).
