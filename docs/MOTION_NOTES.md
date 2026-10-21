# Swimming movement revision

## Reference observations

Both the supplied coral Craft clip and blue-and-white butterfly koi clip were sampled at 250–300 ms intervals. The coral clip is the primary movement reference.

| Coral clip time | Visible behavior | Rig behavior used here |
| --- | --- | --- |
| 0.10–0.85 s | Head and tail face different directions; the torso stays curled while fins move. | The pose is built from individual spine directions, rather than rotating the entire image. |
| 1.10–1.60 s | The head turns upward while the belly forms a pronounced arc and the tail trails to the left. | Heading history reaches the belly and tail base with increasing delay; forward motion slows through tight corners. |
| 1.85–2.35 s | The head turns left before the tail finishes the previous turn. | A turn propagates through the articulated chain; the caudal membrane follows its own root. |
| 2.60–2.85 s | The torso begins to straighten while the fin tips remain curved. | Fins combine root rotation with a separate tip ripple. |

These are visual observations of the supplied animation, not measurements of biological swimming mechanics. No exact frame-for-frame or volumetric reconstruction is claimed.

## Changes

The previous version applied a small vertical displacement to a straight image, then rotated that image as one object. Its fallback repeated the same limitation. The new rig integrates 40 spine directions into a curve with fixed segment lengths. Head, shoulders, belly and tail base therefore point in different directions through a turn.

The turn delay reaches its full value at the anatomical tail base, before the long tail fin begins. This matters because bending only the transparent tip region leaves the visible torso looking rigid. Normal turn propagation is approximately 0.8–0.9 seconds from head to tail base, with a shorter delay under reduced-motion preferences. These are artistic timing choices based on the reference sequences.

The fish steers before translating. Its velocity remains aligned with the head, speed eases down near the target, and angular speed is bounded. It does not jump sideways or flip instantly when the pointer reverses direction.

Cursor pursuit uses a `0.995` speed multiplier: a 0.5% reduction requested after the swimming revision. The multiplier applies to cruising and arrival speed limits after pointer input. Ambient swimming, turn controls, spine delay and fin parameters retain their previous settings.

The automatic startup skeleton has been removed. Once its texture loads, the fish appears directly with a short fade-in. Skeleton rendering is available only through the explicit Services control.

The pectoral and pelvic fins pivot around separate roots. The long tail uses a delayed stroke and flexible membrane. Both WebGL and Canvas render the same rig; Canvas uses triangular texture mapping so the fish can curve horizontally and vertically without the old strip-shear constraint.

Reduced-motion preferences suppress autonomous swimming at rest while retaining body articulation during direct cursor interaction. The pause control still freezes movement explicitly.

## Stars and background

The reference's stars fade between bright and barely visible states. The earlier implementation used fixed opacity and only moved the constellation during scrolling. Each star now has an independent 2.4–5.45 second opacity/scale cycle and a negative start offset, so the field twinkles immediately without synchronized flashing. A nested star field drifts over 14-second passes, independently of its scroll transform. Broad background gradients drift over 18- and 25-second passes. These timings are visual tuning, not frame-exact measurements of the reference.

The existing pause control and open dialogs pause all ambient effects; reduced-motion preferences disable them. Five palettes are available: red, blue, black and white, golden and white, and orange and white. Golden/orange filters preserve neutral whites and alpha while changing the red markings. Palette switching changes colour only and keeps the current swimming pose and cursor target.

## Review material

`swimming-motion-preview.mp4` uses the production Canvas renderer, the final fish texture and the same movement functions as the website. A scripted pointer travels around the hero. It is an offline motion study, not a browser screen recording.

The website still uses a textured 2.5D surface. It cannot reproduce the source video's changing 3D viewpoint and lighting exactly. Full browser and GPU visual QA was unavailable in this environment.
