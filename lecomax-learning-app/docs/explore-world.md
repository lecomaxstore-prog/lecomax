# Explore World architecture

The Academy is Expo Router / React Native, not the Next.js storefront in the repository root. Its existing Explore tab renders `app/explore.tsx`. World exploration has its own `/world` route reached from that tab. Existing course discovery stays available.

The module uses existing UI components, SchoolProvider theme and language, AsyncStorage write queue, owner authentication and manual CloudProgress backup. Namespaced `drafts['world:v1']` holds journal, visited topics, question evidence and map activity. Existing `/api/learning-mobile/progress` validates the full snapshot and stores it in the Academy Postgres database with authenticated ownership and revision conflict protection. No schema migration or separate credentials are necessary. Cloud backup is manual, not automatic synchronization; unavailable servers surface the existing retryable error.

The globe is a bundled Three.js runtime in a sandboxed iframe on web and WebView on native. Natural Earth 1:110m public-domain polygons are converted to a canvas texture and selectable geographic polygons. No runtime CDN, map key, telemetry or live-data dependency. Three.js MIT license is embedded. Touch/pinch, mouse, keyboard, labels, reset, and an equivalent 2D map are supported. Boundaries are generalized and disputed boundaries reflect the source, not a sovereignty claim. Small territories absent from the dataset are not invented.

Content is reviewed, static English educational text with source links and review date. Navigation and country names use the app's English/French/Arabic preferences. The existing AI Tutor supports explanations in English, French, Arabic and Darija; its world context is resolved by a bundled topic ID, not arbitrary URL text. AI availability depends on the configured authenticated backend. Explanations are generated only after a learner sends a question.

Question evidence distinguishes incorrect attempts, corrected answers and first-attempt answers. Reading alone is not mastery. Missions require topic visits and correct answers; the Morocco mission additionally requires map selection. Review prioritizes misunderstood concepts. This is practice evidence, not a validated assessment of long-term mastery.

Build: `node scripts/prepare-world-map.cjs`, then `node scripts/build-world.cjs`. Source dataset downloaded from Natural Earth's official GitHub repository on 2026-10-16. Review source changes before regenerating. No deployment is authorized by this work.

## Delivered content and limits

This first module contains 29 topic lessons, the eight-planet comparison, nine missions and 177 selectable map entries. Morocco and Brazil have expanded country profiles; other entries explicitly show only the available map facts. Topic coverage is introductory, except the longer reference Earth lesson. Planet and nature illustrations are stylized original vector drawings, not photographs or physical simulations. There is no orbital animation or live satellite feed. English lesson text is not an authored four-language curriculum; the existing Tutor provides the multilingual teaching path.

## Reproducible checks

- `node --test tests/world.test.cjs tests/change-history.test.cjs tests/change-history-interaction.test.cjs tests/academy-backup-route.test.cjs tests/tutor-route.test.cjs`
- `node scripts/check-world-globe.cjs` uses installed Edge to exercise the bundled runtime and force a WebGL failure.
- Export web to `dist-world-check`, then `node scripts/check-world-app.cjs`. This starts a temporary localhost server, uses isolated mock authentication, verifies lesson/journal interactions and reload persistence, and closes the server. It does not verify a real account, database deployment or paid AI provider.
- Screenshots in `artifacts/world/` are test captures of the current implementation, not hosted previews or historical app snapshots.
- Physical Android touch/performance, live cloud round-trip and live multilingual AI quality remain untested. Expo Android export verifies bundling only.
