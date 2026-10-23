# Visual assets

## Real landscape photography

The current backgrounds are four real photographs: Lake Bled at blue hour,
Huangshan in mist, Fuji above a sea of clouds and a Skye coastal sunset.
[Photography credits](photography.md) record each creator, source, license,
original resolution and modifications. Machine-readable records and output
hashes are in [`src/photographs.json`](../src/photographs.json).
Every WebP also embeds attribution XMP. Derivatives are cropped, resized,
converted to sRGB and compressed, with no generative changes or retouching.
The displayed credit includes author, original file, license and modification
notice. CC BY-SA derivatives retain CC BY-SA; CC BY derivatives retain CC BY.

Former generated night-lake background assets have been removed from the
current site. They are not requested by any current page.

## Interactive island

`src/AmbientLight.tsx` draws a separate restrained light overlay. It does not
alter the photographic files. `src/island/world.ts` assembles a designed island
with original palace, pier, terrace and path geometry. It is separate from the
cover photographs and is not presented as a reconstruction of a real palace.
No upstream portfolio source or car model is used.

[Poly Haven photographic materials and vegetation](world-assets.md) supply
stone, timber, tile, ground, scanned trees and ferns under CC0. The pier opens
[actual filmed ocean waves](sea-recording.md) by Amada44 under CC BY-SA 4.0,
with a short loop crossfade and responsive video encoding. This is recorded
footage, not live imagery. The previous static 360° sea viewer and its two
large photo textures have been removed. [Animated actor credits](actors.md) document the Quaternius
traveler (CC0) and the Khronos Fox sample (model CC0; rigging, animation and
conversion CC BY 4.0). Full notices and machine-readable source hashes are
self-hosted alongside the assets. Visible Credits links retain required
attribution. No AI image or model generation service is used.

## Sky data and space imagery

`src/observatory/data/` includes a documented 400-star subset of HYG v4.1 by
David Nash / Astronexus, CC BY-SA 4.0. The adapted subset and full legal code are
downloadable under `public/observatory/`, with original identifiers, source
revision, hashes and processing notes. Catalog positions are propagated and
converted to the selected time and horizon by the application; they are not
invented decorative stars.

Sun/Moon positions are calculated locally with Astronomy Engine. The separate
Moon and Sun photographs are NASA archive images with dates and source links;
they do not represent a current live feed or the selected simulation time.
See [NASA image notice](../public/observatory/NASA-NOTICE.txt),
[image provenance](../public/observatory/images.json), and
[HYG notice](../public/observatory/HYG-NOTICE.txt) for terms and limitations.

The engine is [Three.js](https://threejs.org/), distributed under its MIT license. Bundled JavaScript dependency notices are
[available here](../public/licenses/THIRD-PARTY.txt).
Self-hosted font subsets and their OFL licenses are documented in
[`public/fonts/README.md`](../public/fonts/README.md).
