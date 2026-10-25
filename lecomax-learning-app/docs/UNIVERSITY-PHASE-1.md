# L’ECOMAX Learn — university foundation, 2026-10-07

## Existing application and audit

This is an incremental upgrade of `lecomax-learning-app`, the existing Expo Router / React Native / TypeScript application. The adjacent Next.js shop and `mobile` storefront are separate applications and are outside this change.

Reviewed the app routes, shared UI and design tokens, course definitions and navigation, lesson renderer and types, generated offline index/loaders, glossary, search, AsyncStorage provider/progress validation, and existing tests and build scripts. The repository already contains substantial website courses, Python and IPTV workshops, a teacher, bookmarks, notes, quiz feedback, lesson stages, theme/language settings, and offline JSON content. These remain in place.

Weaknesses addressed:

- The path screen mixed an extensive library with an implied beginner sequence. A beginner needs an explicit curriculum and honest coverage indicators.
- Website module cards used large descriptions and repeated decoration, reducing visible choices on phones.
- Search returned lessons and source files but omitted curriculum topics and definitions.
- Generic lesson presentation lacked authored, offline simplifications and inspectable diagrams.
- There was no single roadmap spanning computer hardware, networking, operations, mobile, AI, and agents.

## Implemented Phase 1

- A separate, typed curriculum with **50 topics in six phases**, four syllabus outcomes per topic, and stable mappings to existing modules.
- Empty mappings mean **planned, not authored**. Topics with mappings say **starting lessons available**, not “complete course.” Progress counts actual published lessons only; planned topics display no fake progress bar.
- The Path tab opens the curriculum. Search, phase filters and an available-only filter help narrow it. The Library action retains courses, references, archives and website collections.
- Compact module cards and border-free explanation sections, using existing theme and RTL primitives. The phase strip reverses its order and starts at the right in Arabic.
- Five substantial Arabic lessons: computer execution/memory, the journey of an HTTPS request, a local Node.js server, model training/inference and LLMs, and authorized order-tool execution.
- Each new lesson has an objective, explanations, analogy, example, common mistake, inspectable diagram, terms, line annotations, practice, solution, explanatory quiz feedback, summary and next lesson. Source links are optional; core content is bundled offline.
- “Explain simpler,” “Give example,” “Explain visually,” and common mistakes are authored content, not API calls. Existing Why mode, clipboard code copying, stage persistence, bookmarks, quiz scores and notes apply to the new lessons.
- Search now includes paths, definitions, lessons/practice and project files, with matching title text highlighted without altering Arabic spelling. Definitions have their own route and related lessons.
- The home page links to the university and the full curriculum.

## Architecture

`data/university/curriculum.ts` owns the roadmap. `data/university/lessons.ts` owns the new authored lesson content and optional teaching support. `types/university.ts` defines the presentation-independent contracts. `services/content.ts` composes this additive catalogue with the existing generated offline library; the migration script does not overwrite the new authored files. No generated index counts or historical content were rewritten.

`services/curriculum.ts` resolves available modules and searches the roadmap. `LessonCompanion` presents deterministic learning aids. New routes `/learning-path/[id]` and `/definition/[term]` reuse shared components and local progress.

The source language of new lessons is Arabic. Titles and UI support Arabic, English and French; English/French UI explicitly labels the Arabic content fallback. Full lesson translations have not been claimed or fabricated. Stable lesson IDs preserve the existing storage schema. No dependency, account, hosted database or AI key was added.

## Teaching accuracy and verification sources

The request journey is an illustrative architecture, **not a claim that the live shop uses Nginx**. DNS resolution is a separate lookup; caches and existing connections can skip work. HTTP/3 is distinguished from the TCP/TLS example. The model lesson distinguishes inference from training and does not claim private details about any vendor model. The order example is a local authorization simulation, not a live agent.

- [MDN: How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work)
- [MDN: How the Internet works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work)
- [Node.js: Introduction](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [Hugging Face: LLM generation](https://huggingface.co/docs/transformers/llm_tutorial)

## Further phases — not represented as finished

1. Author the networking, Linux/VPS/Nginx/Docker lab sequence and expand the legal owned-media HLS course. Existing streaming lessons remain accessible.
2. Build out mobile/Expo/Android/iOS and advanced networking courses.
3. Author the full ML/neural network/Transformer/embeddings/vector database/RAG/MCP sequence and evaluated AI projects.
4. Add complete English/French lesson translations, an expanded technical glossary with inline terms throughout legacy lessons, sandboxed runnable labs, project-completion storage, recent-history tracking and a configurable daily goal.
5. Extend the remaining screens’ visual refinement and verify on phones/tablets with large fonts, screen readers, keyboard navigation and native offline restart.

The initial five lessons use the existing code notebook and provide exact external run instructions for suitable examples. The app does not execute arbitrary learner code or claim that its string checks are a sandbox/runtime. No APK build, installation, store submission or deployment is included in this phase.

## Validation

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: source checks passed; generated university exports are excluded from lint and Git, just like the other existing export directories.
- `npm.cmd test`: **40/40 passed**, including six new tests validating the 50-topic mapping, authored content and locale fallback, executable calculation examples, order authorization boundaries, real loopback HTTP responses, and normalized Arabic/English search highlighting.
- Web production export: passed (`artifacts/university-web`).
- Android production export with Hermes bytecode: passed (`artifacts/university-android`). The sandbox initially prevented executing the installed Hermes compiler; the authorized build completed with execution permission.
- Existing local server responds at `http://localhost:8083/path`. Browser automation reported **no available browser surfaces** in this session. Visual appearance, taps, navigation in a running browser and native-device behavior have not been verified interactively. Exports are not an APK or proof of a device smoke test.

Thirty curriculum topics link to starting lessons and twenty are explicitly planned. Availability is not a claim that the complete four-item syllabus is covered. Eight new quiz questions accompany the five new lessons.

The offline catalogue also includes the pre-existing source-code snapshots and all locales; the resulting export is approximately 66 MB of web JavaScript / 37 MB of Hermes bytecode. Content packaging and startup performance on lower-end devices need a dedicated follow-up; this phase does not claim those budgets are optimized.
