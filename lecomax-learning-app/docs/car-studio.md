# 3D Car Studio

Route: `/car-studio`, linked from More / My space. This is part of the existing Expo 57 learning app, not the separate storefront mobile app.

## Rendering and build

### Current model — detailed asset replacement, 13 October 2026

The procedural sedan below has been superseded as the default. The studio now loads the authored **Car Concept** from the official Khronos glTF Sample Assets repository: 109 rendered mesh primitives, 213,347 triangles and 11,778,688 source bytes. Its textured exterior, cockpit, tyres, rims and authored door/bonnet/rear-hatch pivots replace the block-based geometry. Attribution is shown in the studio and preserved in `assets/car-studio/` with source metadata, license, mark notice and SHA-256 provenance. Model and textures are CC BY 4.0, Eric Chadwick / Darmstadt Graphics Group GmbH (2024).

`detailed-car.ts` loads the uncompressed, self-contained GLB embedded by the studio build script. The final viewer HTML is about 16.4 MB because the binary is base64 encoded. This increases app size but avoids runtime network dependencies and third-party cookie failures. Textures and geometry are preserved; runtime adaptations include semantic groups, separate transform anchors, glass transparency for the embedded background, reduced paint normal strength, cameras and lighting. `car-asset.ts` keeps attribution metadata independent of Three.js for the native wrapper.

Six actual groups are selectable: body, engine, interior, wheels/axles, brakes and exterior lights. Unavailable mechanical systems remain learning content; no fabricated internals are inserted. The authored concept-car engine is not identified as an S63 assembly. Existing BMW-specific lessons are visibly labeled as comparison material for another vehicle. The procedural `local-car.ts` remains for prior development tests, but is no longer the default or an automatic fallback.

Use `node scripts/detailed-car-smoke.cjs` for actual imported-asset rendering, controls, offline behavior, raycasting and disposal. `car-studio-smoke.cjs` checks multilingual lessons and the generic GLB loader; `car-studio-app-smoke.cjs` can target the live app with `STUDIO_APP_URL=http://localhost:8082`. No deployment is implied. Native device memory/performance remains unverified.

Replacement validation passed: bundle build, TypeScript, focused ESLint, 10 car/history tests, the actual imported-model smoke (including source SHA-256, 109 unique mesh names, six mapped groups, 213,347 triangles, zero network requests, raycasting, panel animations, paint, cutaway and disposal), and the English/French/Darija studio/GLB regression. Desktop, 390px phone, open-panel and cockpit screenshots were visually inspected. Live localhost app navigation, progress save/reload and visible history passed with synthetic auth. The initial live reload check timed out; its harness now waits explicitly for the larger model to become ready before testing restored progress. The initial detailed test also expected an unsupported Chassis button; it now verifies that unavailable mode is absent.

### Previous procedural assembly — superseded on 13 October 2026

The default viewer now loads `local-car.ts`, an original procedural LECOMAX GT sports sedan, directly into the bundled Three.js renderer. It makes no external requests and no longer automatically loads the Sketchfab SDK or iframe. The older hosted-viewer module remains in the repository for reference. The `model` manifest remains null: this is not a supplied, licensed BMW GLB.

The local model has 482 uniquely named meshes across all 12 learning-system IDs, with 157,660 triangles. Components include a V8-style assembly, transmission, driveline, suspension springs, brake discs/calipers, rims/tyres, radiator, exhaust, battery, seats/bolsters/headrests, transparent glazing, dashboard and instrument graphics. Geometry represents component types and approximate placement; it is not manufacturer CAD or a mechanically exact S63 assembly. Existing BMW-specific lesson text is identified separately from the original educational geometry.

Four doors, bonnet and boot have animated hinges. The cockpit camera enters the cabin; Interior reveals cabin geometry. Selecting an internal system reveals it using cutaway or interior mode. Existing isolation, exploded view, labels, paint and camera presets work with this geometry. Reset closes panels and returns to the exterior. Text quiz choices remain available for parts hidden behind other geometry.

Run `node scripts/local-car-smoke.cjs` for actual generated-geometry and offline checks. `node scripts/car-studio-smoke.cjs` retains multilingual learning/bridge and synthetic GLB loader checks. Set `STUDIO_APP_URL=http://localhost:8082` when running `node scripts/car-studio-app-smoke.cjs` to test the current dev app instead of the historical export. App smoke authentication is a disposable test interception.

The older missing-asset and historical implementation notes below still describe the requirements for an exact licensed BMW replacement. They do not describe the now-visible default local assembly. Native-device rendering/performance and physical BMW accuracy remain unverified; no deployment is included.

Validation for the local assembly: studio bundle build, TypeScript, focused lint and 15 focused car/progress/navigation/history tests passed. The local geometry smoke passed with external requests blocked, actual raycast selection, all panel hinges opening/closing, isolate/paint/cutaway, lifecycle pause/disposal and responsive layouts. Desktop, mobile, opened-panel, cockpit and interior screenshots were inspected; an initial camera collision with a headrest was corrected before the final pass. The existing three-language studio smoke and GLB regression passed. The live app smoke at localhost:8082 passed navigation, iframe rendering, progress save/reload and visible history using synthetic auth, without modifying real account state.

Three.js 0.180.0 is bundled locally with esbuild into `data/car-studio-runtime.json`. No CDN executes code. The existing WebView 13.16.1 displays it on Android/iOS; a sandboxed iframe displays it on web. This avoids adding expo-gl or React renderer peer dependencies to React 19.2 / RN 0.86. Expo 57 documents WebView support: https://docs.expo.dev/versions/v57.0.0/sdk/webview/ . Native platform performance still needs real-device validation.

Run `npm run studio:build` after modifying any studio runtime, CSS, curriculum, viewer or manifest, before exporting/releasing. The existing dev launcher also rebuilds it on startup. During an already-running dev session, rerun this command to regenerate the bundled runtime. React Native wrapper changes use normal Metro refresh.

## Missing production asset — explicitly NOT completed

No car GLB/GLTF was found in this repository. No third-party vehicle geometry was downloaded or licensed. The actual required asset is **BMW M5 Competition F90 LCI, June 2020 facelift**, a mobile-optimized, self-contained GLB 2.0 with PBR textures, exterior and interior geometry. Mechanical exploration additionally requires individually modelled, accurately placed internal systems. A pre-facelift 2018 M5 is not an acceptable replacement.

Research candidates (not endorsed or licensed):
- https://sketchfab.com/3d-models/2018-bmw-m5-30fa0c4408bc43be8c3a67c51fcc6184 — wrong model year; no provenance or redistribution rights verified.
- https://deep3dsea.com/downloads/bmw-m5-f90-2021/ — facelift listing found; author provenance, actual file contents, internal systems and app redistribution rights not verified. Do not use without review.

A valid license must allow embedding and distributing the geometry and textures in this application. Obtain it from the original creator or commission a model; preserve the invoice/license, attribution, origin and file hash. Product photographs and BMW press materials are references, not a geometry license.

## Asset contract

Set `model` in `features/car-studio/vehicle.ts` only after review. Required fields:
`url` (versioned HTTPS GLB with CORS support, including opaque iframe origins), `source` (creator URL), `license`, `attribution`, `meshes` (registry IDs → exact unique mesh names), `paintMaterials` (exact body-paint material names). Serve with immutable cache headers. Fetch uses the browser/WebView HTTP cache; offline model availability is not guaranteed. Lessons and simulations are locally bundled.

Use metres, +Y up, +Z forward. Centreline at X=0. Preserve authentic dimensions; the viewer translates the centre but does not rescale. Aim for ≤150k triangles, ≤2k textures, ≤20 MB; runtime rejects >300k triangles or >32 MB. Use embedded PNG/JPEG/WebP textures and uncompressed geometry; Draco, KTX2 and meshopt decoders are not configured. Audit total GPU texture memory before shipping (file size alone is insufficient).

Suggested separately named meshes: `body_shell`, `hood`, `front_grille`, `headlamp_l/r`, `mirror_l/r`, `engine_block`, `turbo_l/r`, `gearbox`, `transfer_case`, `front/rear_prop_shaft`, `front/rear_suspension_*`, `brake_disc_*`, `brake_caliper_*`, `wheel_*`, `tyre_*`, `radiator_*`, `exhaust_*`, `steering_rack`, `rear_differential`, `electrical_*`, `cockpit`, `seats`. These names are a delivery contract, not claims about an existing asset. Map each mesh once to the 12 registry IDs. Do not map a whole car mesh as an engine. Unmapped surfaces remain visible but are not falsely identified.

X-ray requires body plus internal mapped geometry. Engine/interior/chassis modes, isolation, exploded view and labels are capability-gated. Exploded offsets are a visual aid, not a repair/disassembly sequence. Paint only touches explicitly named PBR materials. Select uses raycasting and world-space labels, not screen-coordinate hotspots. Double-tap focuses; one finger orbits, two fingers pan/zoom. GPU resources and image bitmaps are disposed; fetch aborts on unmount; idle/hidden viewers stop rendering.

## Learning and accuracy

12 system lessons, three levels, a written step-by-step guided tour, text quizzes without an asset and raycast identification quizzes when geometry is available. Guided tour advances with Next; no audio narration. Five original interactive 2D engineering diagrams are explicitly educational: single-cylinder four-stroke timing (not an S63 V8 assembly or BMW firing order), illustrative transmission ratios, prescribed suspension motion, brake clamp-force illustration and differential speed principle. They do not simulate vehicle dynamics or failure diagnosis.

English, French and Moroccan Darija content follows the app's language (`ar` selects Darija here). Manufacturer facts: https://www.press.bmwgroup.com/united-kingdom/article/detail/T0309398EN_GB/the-new-bmw-m5-competition?language=en_GB (June 2020 UK/European launch, 4.4 L V8, 460 kW / 625 metric PS, 750 Nm, eight-speed M Steptronic, M xDrive). Generic mechanism explanations are distinguished from BMW-specific measurements. No service intervals, part dimensions, repair instructions or actual gear ratios are invented.

Progress and quiz attempts use a separately validated `carStudio` field in the existing School provider / AsyncStorage. Older saves migrate to an empty field without changing course statistics. Its storage failure/retry mechanism is surfaced. Change History is linked from the studio and all previous reports are preserved.

## Release checks remaining

Supply/review the licensed GLB and registry; verify every mesh, internal position, material, label, camera and mode against the actual asset. Test pinch/pan/double-tap and lifecycle on Android and iOS, portrait/landscape, GPU memory, temperature/battery and mid-range-device frame rates. No 60 FPS or real-device claim has been made. Rebuild the installed application to deliver local changes; this task does not deploy it.

## Validation performed in this implementation

- TypeScript and focused ESLint: passed.
- 13 focused tests: passed (curriculum, registry validation, message validation, progress migration/persistence, existing course progress, More navigation, immutable history).
- `node scripts/car-studio-smoke.cjs`: passed in headless Edge, all three languages and 12 panels, quiz/progress bridge events, written tour, simulation scrubber, 320px portrait, 844px landscape and 1440px desktop. Original synthetic GLB fixture validated rendering/load, raycast touch selection, orbit/wheel zoom, CDP-emulated two-finger pinch/pan, highlight, X-ray, isolation, paint, labels, exploded mode, disposal and 404 recovery. This is not real-device or BMW geometry testing.
- `node scripts/car-studio-app-smoke.cjs`: passed against local Expo web export with synthetic auth interception. More → Studio, actual AsyncStorage save/reload, untouched course-completion array, visible Change History.
- Expo web and Android JavaScript exports: passed. No APK/device installation or iOS export was performed.
- Full regression first run: 233/239 passed; six failures. The affected More harness was corrected and passed. The offline-adapter timeout passed on isolated rerun. Four unrelated checks still fail: academy source fingerprint drift (`lib/use-store-refresh.ts`), content snapshot drift (`app/admin/analytics/page.tsx`), curriculum harness missing `StudioVisual`, wellness harness missing a `react-native` stub. Logs: `artifacts/car-studio-regression.log`, `artifacts/car-studio-unrelated-checks.log`.
- Whole-app lint: four errors / two warnings in existing Home/PythonStudio/phone-relay code. Studio and directly modified app/progress files pass focused lint. Log: `artifacts/car-studio-lint.log`.
- Installed dependency graph reports no peer conflict for React, RN, WebView or Three.js. npm install reported 29 dependency audit findings across the app; no broad dependency upgrades were made.

New implementation files live in `features/car-studio/` (screen, platform frames, typed bridge props, curriculum/manifest, viewer, runtime, simulations, CSS), `app/car-studio.tsx`, `utils/car-studio-progress.ts`, `scripts/build-car-studio.cjs`, the two car-studio smoke scripts, `tests/car-studio.test.cjs`, this document and generated `data/car-studio-runtime.json`. Modified files: More navigation, Change History route/documentation, shared progress schema, More-screen test harness, dev launcher, package/lockfile and tsconfig. Immutable change reports list exact paths. Three.js's full MIT license is embedded in the runtime. No third-party vehicle asset is included.
