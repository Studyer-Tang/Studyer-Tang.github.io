# Island scene assets / 岛屿场景素材

The assets in `public/world-assets/` come from [Poly Haven](https://polyhaven.com/). All eight source assets use [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), which permits commercial use, modification and redistribution. The complete license is included as [`LICENSE-CC0.txt`](../public/world-assets/LICENSE-CC0.txt); see the provider's [asset license](https://polyhaven.com/license). These are third-party assets, separate from the site's code license. Credit is retained here even though CC0 does not require attribution.

这些素材来自实拍海岸全景、摄影/扫描材质及摄影制作的植被资产；未使用 AI 图像生成。宫殿和岛屿几何由项目代码另行构建，海岸全景也不代表宫殿所在地的实景。Poly Haven 的示例渲染图、网站标志与页面文案没有随项目分发。

## Sources

Verified on 2026-10-23. [`sources.json`](../public/world-assets/sources.json) records the original download URL, original byte count, source SHA-256 and provider MD5, authors, processing notes, and the byte count/SHA-256/dimensions of every distributed asset. Production loading is self-hosted and does not call Poly Haven's API.

| Source | Original creator(s) | Local prefix / purpose | Distributed size |
| --- | --- | --- | ---: |
| [Grey Stone Path](https://polyhaven.com/a/grey_stone_path) | Amal Kumar | `stone-*`, paths and stonework | 1,017,028 B |
| [Wood Floor Deck](https://polyhaven.com/a/wood_floor_deck) | Dimitrios Savva | `wood-*`, dock and timber | 844,324 B |
| [Grey Roof Tiles](https://polyhaven.com/a/grey_roof_tiles) | Rob Tuytel | `roof-*`, ceramic surface detail | 925,114 B |
| [Chinese Cedar Bark](https://polyhaven.com/a/chinese_cedar_bark) | Charlotte Baglioni | `bark-*`, trunks and branches | 971,512 B |
| [Aerial Grass Rock](https://polyhaven.com/a/aerial_grass_rock) | Rob Tuytel | `ground-*`, distant terrain | 1,147,544 B |
| [Fish Hoek Beach](https://polyhaven.com/a/fish_hoek_beach) | Greg Zaal (HDRI); Rico Cilliers (source collection's backplates) | `coast-environment.hdr`, island lighting only | 1,433,636 B |
| [Island Tree 02](https://polyhaven.com/a/island_tree_02) | Rob Tuytel (scanning/processing); Rico Cilliers (cleanup/processing) | `leaf.webp`, `leaves.webp`, `tree/*.glb` | 3,252,548 B |
| [Fern 02](https://polyhaven.com/a/fern_02) | Rob Tuytel (scanning); Rico Cilliers (modeling) | `fern/`, four plant variants | 2,111,553 B |

**Total scene asset payload: 11,703,259 bytes (11.16 MiB)**, excluding the small manifest and license text. The original large source downloads and original high-poly tree geometry are not shipped. The five PBR sets, HDR, fern and both tree levels together total **11,632,995 bytes**. The small standalone leaf images remain available as source derivatives but are not needed by the complete tree model.

## Material maps

Each of `stone`, `wood`, `roof`, `bark`, and `ground` has:

- `/world-assets/{name}-albedo.webp`: 1024 × 1024, sRGB, WebP quality 90.
- `/world-assets/{name}-normal.webp`: 512 × 512, linear RGB8, lossless WebP, OpenGL **+Y** normal convention.
- `/world-assets/{name}-arm.webp`: 512 × 512, linear RGB8, lossless WebP; **R = ambient occlusion, G = roughness, B = metallic**.

The linear data maps were downsampled with Lanczos to keep the scene small. No display gamma transform was applied. Do not mark normal/ARM textures as sRGB. Share maps across materials and reuse the same UV scale for all three channels. These surfaces are nonmetallic; use an appropriate metallic factor rather than turning the ARM image into a color map.

Approximate physical width of one texture repeat, from the source metadata: stone **1.8 m**, wood **1.8 m**, roof **3 m**, bark **2.27 m**, ground **15 m**. Repeat these maps instead of stretching one copy over the whole island. The roof image supplies surface detail; curved Chinese eaves and ridge geometry must come from the scene mesh.

## Environment lighting

`/world-assets/coast-environment.hdr` is the official 1024 × 512 Radiance RGBE
file for Fish Hoek Beach, copied unchanged (1,433,636 bytes). It supplies ambient
lighting and reflections in the island. It is not displayed as a live sea view.

## Foliage

`leaves.webp` is the original 1024 × 1024 photographed eight-leaf atlas combined with its source alpha mask. `leaf.webp` is a cropped complete green leaf, **177 × 382**, for simple instanced geometry. Its tip points up and its stem points down. The atlas contains individual leaves, not complete trees or branch clusters. Scale leaves plausibly and arrange them in branched groups; do not stretch one leaf into a tree crown.

Both files are RGBA WebP, quality 92. Alpha was converted from the original 16-bit mask by scaling to 8-bit, without saturating the intermediate values. Use alpha testing (for example, 0.5), suitable two-sided materials, and shared instanced geometry to avoid hundreds of separately sorted transparent objects. The source's 40.7 MB high-poly tree binary is intentionally excluded. A simplified complete tree is provided separately below.

`/world-assets/fern/fern.gltf` uses core glTF 2.0, one shared masked, double-sided material and local PNG maps; no Draco, KTX or WebP glTF extension is required. It contains four meshes:

| Node | Triangles | Approximate height |
| --- | ---: | ---: |
| `fern_02_b` | 2,384 | 0.43 m |
| `fern_02_c` | 2,248 | 0.35 m |
| `fern_02_a` | 784 | 0.29 m |
| `fern_02_d` | 816 | 0.21 m |

The source arranged the variants on a 1 m display grid. When instancing one plant, use that mesh's local geometry and choose its world position; do not also retain the display-grid offset. The combined source model has **6,232 triangles**. Its geometry and UVs are unchanged. The local derivative combines the original color image with the original alpha mask, correcting the provider glTF's JPEG color image that cannot carry transparency. The normal and ARM maps are converted to RGB8 PNG. Load the glTF once, reuse mesh geometry and material, and dispose shared resources when the world is destroyed.

## Simplified complete tree

`/world-assets/tree/island-tree.glb` is **2,564,432 bytes**, with **23,639 triangles**, **44,073 vertices** and three material groups (trunk, leaves, branches). It derives from the one original LOD0 in Island Tree 02; the provider glTF contains no alternative tree variants. Its final dimensions are approximately **3.87 m wide × 3.38 m high × 4.09 m deep**, with its lowest vertex at y = −0.014 m. Use the actual mesh bounds to place it on the terrain; do not rely on the provider's larger presentation-layout dimensions.

Offline [meshoptimizer](https://github.com/zeux/meshoptimizer) 1.3.0 simplifies the trunk and branches to 2,639 triangles. The original model contains 29,781 separate leaves, each modeled with 21 vertices and 24 triangles. Applying ordinary geometry simplification to those small leaves removed most of their visible area: the earlier 7,139-triangle model was rejected after browser review because it looked bare.

The current version preserves complete alpha leaf shapes. Each source leaf is fitted to an affine UV-to-position plane, using its original atlas bounds and orientation. A deterministic selection keeps 10,500 complete leaves as two-triangle cards, and scales each by 1.684 to compensate area. This gives 21,000 leaf triangles and approximately 83% of the original effective leaf surface area in a sampled alpha-mask calculation. It changes leaf curvature, count and size; it is a visual level of detail derivative, not unchanged source geometry. The trunk/branch source UVs and branch texture transform remain intact.

The full source file and temporary conversion tools are not part of the repository or production dependencies. Geometry is stored as ordinary glTF buffers: there is no Draco, KTX or meshopt runtime decoder requirement. The only material extension is `KHR_texture_transform`, supported by the existing Three.js GLTFLoader.

The embedded 1K trunk/branch photographs use JPEG quality 90 without chroma subsampling. The 1K leaf color and source alpha use PNG with `alphaMode: MASK`, cutoff 0.47. These retain the original tree-specific UV appearance rather than substituting the unrelated tiling bark material. Roughness uses constants; extra normal/ARM images are omitted to keep the model small. Share its three material groups and instance each group instead of cloning all GPU resources per tree. A 3.38 m model enlarged to 8–12 m also enlarges its photographic leaves: choose scene scale deliberately.

The manifest records source/result hashes, per-material triangle counts and the leaf-card conversion method. These measurements do not replace visual evaluation. The high-detail replacement was reviewed in the integrated browser scene on 2026-10-23 and accepted for canopy density. Lighting and distant-LOD transitions require scene-level verification; the rejected sparse model is not shipped.

### Distant tree LOD

`/world-assets/tree/island-tree-lod.glb` is a **geometry-only companion**, **617,852 bytes**, with **10,239 triangles** and **17,273 vertices**. It keeps 3,800 complete alpha leaf cards using the same method, with a per-leaf scale of 2.799, plus the unchanged simplified trunk and branches. It is intended for distant rendering, not close inspection.

It deliberately contains **no images**. On load, replace its placeholder materials by the high-detail tree's shared materials using these names, in the same order: `scanned-trunk`, `photographic-leaves`, `scanned-branches`. Rendering its placeholder materials directly will produce untextured geometry. Reuse the high-detail tree's bounding-box height and feet offset for both models; independently normalizing the two LODs causes size/ground-position jumps. The original local coordinates are preserved. This avoids downloading or creating duplicate GPU copies of identical tree textures.

## Verification

Downloaded source bytes were checked against the provider's size and MD5; every distributed asset has a SHA-256 in the manifest. Source and final material contact sheets, the photographic sea detail, leaf cutout and fern transparency were visually inspected. Static checks cover all local glTF references, buffer/accessor bounds and alpha ranges. Visual acceptance of the final integrated scene remains a separate browser/rendering check.
