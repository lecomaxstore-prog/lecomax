# Curiosity Universe architecture and editorial workflow

The Expo app uses `/curiosity` with the existing School provider, OwnerGate, UI theme, persistence and authenticated `/tutor` service. Discovery records are bundled TypeScript, with no model calls on browsing or reshuffling. Journal state lives in `drafts['curiosity:v1']`, preserving existing progress and participating in the existing backup path. Invalid journal data blocks mutation rather than overwriting it.

The catalog contains source-checked summaries, not expert peer review. Source check dates mean the reference was inspected during implementation, not that an institution endorsed the lesson. Diagrams are conceptual labeled flows, not engineering drawings. Future research is explicitly marked. English authored text is available offline; the tutor can explain in English, French, Arabic and Moroccan Darija, with generated translations labeled as AI responses.

Publication workflow: create a draft outside `catalog.ts`; record claims, primary sources, evidence category, question/feedback, limitations and related IDs. An editor must inspect the sources, check each claim and answer, record the actual check date, and review terminology and translations. Only then add the entry to the bundled catalog. Run `node --test tests/curiosity.test.cjs`, typecheck and focused lint before publication. AI outputs stay in private tutor sessions and have no catalog-write endpoint. Corrections require a new append-only Change History report. Deployment is a separate authorized operation.

Phases: architecture and navigation; home and catalog; AI journey; process and component explorer; recommendations, map and journal. Tests cover catalog integrity, context, review scheduling and persistence. No third-party 3D assets or generated engineering diagrams are used. Each topic currently has one retrieval question: a passing check is evidence for that question, not proof of topic mastery. Collections and history are finite per catalog; no learner records are reset by this feature.

Limits: this is a curated catalog, not an encyclopedia of every subject. Manufacturing journeys are introductory abstractions. Source content may evolve. Real model responses require working server configuration and authentication. Physical Android performance, screen-reader behavior and expert editorial approval require separate validation.

## Validation of this implementation

- App typecheck and focused ESLint passed.
- 11 discovery/change-history tests and 17 Tutor regression tests passed.
- Web export, Android JavaScript export, and Android Hermes bytecode export passed. The first Hermes attempt was denied by the local sandbox; the allowed retry passed. These exports are not an APK installation or device-performance test.
- `node scripts/check-curiosity-app.cjs` and the same command with `--dark` passed in disposable Edge browser sessions. Checks cover mode navigation, AI journey nodes, the weight experiment, incorrect/correct feedback, bookmarks, collections, reload persistence, map navigation, 390-pixel overflow and contextual Tutor handoff. Authentication is mocked; no real model call or cloud write is made.
- Screenshots are in `artifacts/curiosity-{desktop,mobile}[-dark].png`. They show this implementation, not an archived historical app build.
- The current catalog is English, with French/Arabic navigation entry labels and contextual AI language options. Full authored translations, comprehensive invention timelines, additional manufacturing journeys and anatomical/engineering illustrations are not included in this introductory catalog. The existing Tutor provides open-ended exploration beyond the bundled topics, subject to network and service availability.
