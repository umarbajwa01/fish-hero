# Craft — A Living Koi

A React **JavaScript** hero based on the supplied Craft reference. Open **Services** to choose one of five palettes: red and cream (default), blue and pearl, black and white, golden and white, or orange and white. The panel also contains the optional skeleton control and original reference videos.

## Run on Windows / VS Code

Install Node.js 20.19+ or a current LTS release. Open this folder in VS Code, then run:

```powershell
npm install
npm run dev
```

Open the local URL Vite prints. To check the interaction and production build:

```powershell
npm test
npm run build
npm run preview
```

Deploy the generated `dist` folder on any static host. No API key, server, database, or environment file is needed.

## Cursor interaction

- The fish's **nose** steers towards the pointer along a curved swimming path. Forward speed follows the head's direction; bounded turning and braking prevent sideways sliding and abrupt 180-degree flips.
- A 40-joint spine propagates each turn from the shoulders through the belly to the tail base. Joint lengths stay constant while the torso forms C/S curves. A travelling swim wave continues through the body.
- Pectoral and pelvic fins have independent root pivots and tip flutter. The long caudal fin follows the tail base with its own delayed stroke.
- A stationary cursor remains the target. The fish does not resume an unrelated path after a timeout.
- Pointer input works with the operating system's reduced-motion preference enabled. Direct cursor input still bends the body and tail. The preference shortens their lag and stops the ambient cycle once the fish settles.
- Pointer tracking runs independently of the renderer. WebGL initialization errors, shader failures or context loss switch to an animated Canvas surface without resetting the target. A final DOM image fallback still follows the pointer if both canvas contexts are unavailable.
- Mouse, pen, touch movement and tapping use the same normalized target. Page scrolling remains available on touch devices.
- Explicit pause stops the fish, star twinkling and ambient background drift; resuming follows the newest pointer position. Opening the Services or reference dialogs also pauses these animations.
- The textured fish appears directly after loading, with a short fade-in. There is no startup skeleton. The optional Services control can still show the skeleton manually.
- Before the first pointer input, a restrained ambient path runs. Lenis and GSAP ScrollTrigger animate the title and stars. The fish is layered above “Craft”.
- Stars continuously brighten and dim on individual, staggered cycles, including when the page is not scrolling. A separate star-field layer drifts gently while two broad background gradients move on slower cycles. Reduced-motion preferences disable all three decorative effects.

## Visual approach

The koi uses a generated transparent photographic-style texture on a deforming Three.js mesh. A shared articulated rig deforms the visible torso, tail and fins at runtime. The Canvas fallback maps the same pose onto textured triangles, rather than moving a rigid image. This is a **2.5D surface**, not a full volumetric model or a video overlay. It replaces the earlier procedural model and static cartoon SVG. The supplied MP4s remain in the optional reference viewer only.

The final image prompt and asset provenance are in `ASSET_NOTES.md`.

All five palettes use the same fish texture and swimming rig. Blue uses a hue shift; black and white uses a grayscale/contrast filter with a neutral charcoal background and white text. Golden and orange use SVG colour matrices that recolour the red markings while preserving neutral white highlights, alpha and shading. Their backgrounds are dark amber and burnt orange. Theme changes do not restart the fish. Black and white, golden, and orange are original palette variants; their reference buttons open the supplied coral video.

## Structure

```text
src/
  App.jsx                        Page and interface state
  components/                    Koi layer, stars and Services dialog
  hooks/                         Scroll and motion preferences
  themes.js                      Five palette labels, fish filters and references
  scene/
    steering.js                  Forward swimming, turning and arrival braking
    swimRig.js                   Articulated spine, turn history and fin pivots
    fishSurface.js               Shared spine, mesh and skeleton deformation
    renderers.js                 WebGL, animated Canvas and DOM renderers
    createExperience.js          Input, lifecycle, renderer failover and animation
  styles.css                     Responsive layout and visual styling
scripts/verify-motion.mjs         Cursor and renderer-failover regression checks
public/assets/                   Transparent koi texture and reference videos
```

## Editing

- Hero wording, lower-left text and brand name: `src/App.jsx`.
- Background and typography: `src/styles.css`.
- Palette labels and fish colour filters: `src/themes.js`.
- Golden/orange colour matrices: `src/components/FishColorFilters.jsx`.
- Star positions, twinkle durations and offsets: `src/components/Constellation.jsx`.
- Fish size and mesh resolution: `src/scene/fishSurface.js`.
- Body curvature, turn delay, swim amplitude and fin movement: `src/scene/swimRig.js`.
- Fish texture: `public/assets/koi-coral-v2.png`.
- Cursor responsiveness: `src/scene/steering.js`.

## Verification

`npm test` exercises pointer event handling, touch, reduced motion, stationary targets, renderer initialization failure, mid-flight context loss, animated Canvas/DOM fallback, pause/resume, resize, cleanup, refresh-rate consistency and 900 articulated poses. It also checks visible torso curvature, constant segment lengths, delayed tail response, independent fin motion, forward-only swimming and articulation with reduced motion enabled. Canvas rendering was inspected across turn sequences using a native Canvas implementation. `docs/swimming-motion-preview.mp4` is a 10-second offline motion study generated with the production Canvas renderer and scripted cursor movement; it is not a browser recording. Reference observations and tuning details are in `docs/MOTION_NOTES.md`. Full browser and GPU rendering QA was unavailable in the build environment; these checks do not substitute for browser visual testing.

## Fidelity notes

The fish texture is a recreation. Outfit ExtraBold is a close geometric font substitute; the exact font could not be established from the video. The linked eggplant site did not load in the inspection browser, so its exact interaction timing was not measured.

The page intentionally remains a hero study. Portfolio projects and a full footer can be added as separate components once supplied.

## Credits

- Three.js (MIT), React (MIT), Lenis (MIT), GSAP (its standard license).
- Outfit and Barlow Condensed (SIL Open Font License), served locally through Fontsource.
- Reference videos supplied by the user. FINSMITH wording is retained to match the requested reference; replace it before using the page as a personal portfolio.
