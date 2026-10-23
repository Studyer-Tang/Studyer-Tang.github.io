# Real moving ocean footage

The pier's **Ocean waves** view uses **Waves of the sea (Video)** by
[Amada44](https://commons.wikimedia.org/wiki/User:Amada44), recorded on
2014-07-13. [Original source and license declaration](https://commons.wikimedia.org/wiki/File:Waves_of_the_sea_(Video).webm).
The original is 18.203 seconds, 1920×1080 at 25 fps, with real coastal surf and
rocks. Its source page does not identify the location; the site does not invent
one. This is filmed video, not generated motion, a warped photo or a live feed.

The source and all distributed derivatives use **CC BY-SA 4.0**. Visible credits
link the creator's source, license and modification notice. A [notice](../public/sea/NOTICE.txt)
and [complete legal code](../public/sea/LICENSE-CC-BY-SA-4.0.html) are bundled.
The website's code license is separate from the media license. No endorsement
is implied. [`src/sea-recording.json`](../src/sea-recording.json) records the
source URL, date, original hash, encoding properties and derivative hashes.

## Processing

The source is trimmed at 18.2 seconds. The loop begins at original 0.6 seconds;
the final 0.6 seconds crossfade into original 0–0.6 seconds, meeting the next
iteration at source time 0.6 seconds. The output lasts **17.6 seconds / 440 frames**.
Footage always plays forward. Audio is removed. There is no AI generation or
interpolation. The slight camera movement remains part of the original video.

| File | Encoding | Size |
| --- | --- | ---: |
| `waves-1080p.mp4` | 1920×1080, H.264 High Level 4.1, yuv420p, 25 fps | 8,696,655 B |
| `waves-portrait.mp4` | 608×1080, H.264 High Level 4.1, yuv420p, 25 fps | 3,350,416 B |
| `waves-poster.webp` | First frame of edited recording, 1920×1080 | 153,634 B |

FFmpeg 7.1 / libx264 encodes both versions directly from the same source and
crossfade, using the slow preset, CRF 24 / 25 and VBV caps of 4 / 1.5 Mbps.
The mobile version crops the original centre (x=656…1264) without resizing, retaining all 1080 vertical pixels instead of enlarging a narrow slice of a 720p landscape clip. The `moov` atom precedes `mdat`
(faststart), so playback can start without fetching the entire MP4. The poster
is WebP quality 88. The two MP4 resolutions are alternatives; only one loads
per view, selected when the viewer opens at the 760 px breakpoint.

## Playback and verification

The viewer uses the browser's native video decoder, with no Three.js import,
additional WebGL context or JavaScript animation loop. Opening requests the
selected recording and starts muted, inline playback when allowed. A persistent
play/pause button remains available. Space/K toggle playback while the video
has focus. Reduced motion starts with the matching poster and an explicit Play
button; blocked autoplay also offers Play. Hiding the tab pauses, and returning
resumes only when playback was previously requested. A manual pause remains
paused. Closing removes the source and releases the decoder. The island behind
the viewer stays paused through its existing activity lifecycle.

Tests validate the MP4 container's actual track codec, dimensions, constant frame
rate, duration, lack of audio, faststart order, file hashes and transfer budgets.
Controller tests cover autoplay rejection, visibility, manual pause, reduced
motion, late promises, retries and resource cleanup. Browser acceptance checks
actual playback time advancing, different wave frames, pause/resume, looping,
mobile source selection, and returning to the island. These recordings replace
the previous static 360° photo viewer and its two large panoramic textures.
