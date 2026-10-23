# Animated scene actors

These are licensed rigged models, separately from the original island code.
The scene loads them only after entering the island and aborts model downloads
when closing it. The character roots are normalized to metres and the source
idle, walk and run clips are blended at runtime. The human also uses its authored
Interact clip for feeding/petting. No motion-capture or model generation service
is called by visitors.

## Traveler

Adventurer from **Ultimate Modular Men**, by **Quaternius**, CC0 1.0 Universal.
[Original pack and license](https://quaternius.com/packs/ultimatemodularcharacters.html).
The provider's Drive download was over its public quota at verification time.
The same embedded Adventurer.gltf supplied as a reproduction attachment in
[Godot issue #67733](https://github.com/godotengine/godot/issues/67733) was used;
the original source and download mirror are recorded in
[`traveler-source.json`](../public/actors/traveler-source.json).

The embedded glTF was repacked as GLB, retaining Idle_Neutral, Walk, Run, Interact
and Wave and pruning unused animation accessors. The distributed geometry and
rig are unchanged; display normals are smoothed at runtime. It contains 10,202
triangles and is 1,333,828 bytes. Full CC0 text is bundled in
[`TRAVELER-LICENSE.txt`](../public/actors/TRAVELER-LICENSE.txt).

## Fox

[Official Khronos sample](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox),
with the exact revision recorded in
[`fox-source.json`](../public/actors/fox-source.json).

- Model: PixelMannen, CC0 1.0 Universal.
- Rigging and animation: tomkranis, CC BY 4.0.
- glTF conversion: AsoboStudio and scurest, CC BY 4.0.

The source GLB is copied unchanged (162,852 bytes). Display scale and animation
blending are runtime transforms. Original model credits and license are included
in FOX-SOURCE.md and FOX-LICENSE.md in public/actors. The island's visible Credits
menu retains these attributions and license links; no endorsement is implied.

[`sources.json`](../public/actors/sources.json) records each distributed model's
size and SHA-256. All sources and terms were verified on 2026-10-23.
