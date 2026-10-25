# Academy Signature UI

## Audit and architecture

The app uses Expo 57, React Native 0.86, React 19 and Expo Router. `SchoolProvider` owns language, system/light/dark appearance and learning progress. The route inventory is saved in `artifacts/signature/screen-inventory.txt`.

The audit found repeated heavy green banners, generic card stacks, inconsistent header hierarchy, platform-dependent Arabic fonts, English-only Studio discovery and a dashboard whose next action was difficult to find. Existing features include authored courses, generated plans, quizzes, reviews, notes, contextual teacher chat, a richer media teaching workspace, isolated code runtimes, device labs and wellness. These integrations remain intact.

## Design system

- `constants/design.ts` owns semantic surfaces, text, borders, forest/emerald brand colors, gold decoration, spacing, radii and typography.
- IBM Plex Sans Arabic Regular and Semibold are bundled locally with their SIL Open Font License. Latin uses platform-native sans serif. Code remains monospace and LTR.
- `UI.tsx` provides the shared screen, card, text, field, button, progress, list and empty-state primitives. `AcademySignature.tsx` adds reusable icon, metric and tool cards and a native decorative emblem.
- Home uses actual profile, course, completed lesson, review and study-time data. An empty account shows a useful starting action. No synthetic activity or streaks.
- Bottom tabs: Home, Explore, AI Teacher, Practice, Profile. Existing Learning, More, Path and Project routes remain accessible. Profile links to settings, learning history and all tools.
- Studio discovery is localized in `features/interactive/presentation.ts`; runtime identifiers and execution behavior are unchanged.
- Lesson headers favor a light reading surface. Course lesson lists use milestone connectors and current/completed states without inventing prerequisite locks.
- Arabic rows reverse explicitly; code direction remains LTR. Touch controls retain at least 44–48 px targets. Large text can wrap. Safe areas and keyboard avoidance use existing native components.

## Motion and scope

Press feedback changes color/opacity without spatial animation. Existing progress animation and teacher thinking indicator respect reduced motion. Static skeletons avoid unnecessary perpetual motion. No new animation dependency, backend changes or deployment.

The teacher's existing Markdown/code renderer, streaming, retry and contextual actions remain. Image and voice features remain in the existing teaching workspace where supported; no decorative nonfunctional controls are added. Specialist device/3D/native runtime canvases retain their dedicated layouts while app navigation and shared surfaces adopt the theme.

## Validation

See append-only Change History reports and `artifacts/signature/` for actual check results. Browser emulation does not establish physical-device keyboard, performance, voice or native-runtime behavior.

## Full design brief refinement

The route/layout inventory is recorded in `artifacts/signature/brief-screen-audit.json` (47 files). Tab entries delegate to shared feature screens; device labs, remote desktops and the 3D canvas keep their specialized controls. Existing lesson, teacher, practice and progress behavior remains the foundation of the redesign.

- Home now pairs the welcome hero with Continue Learning on wide screens and puts Continue Learning immediately after the hero on phones. The layout returns to a single column with enlarged native text. Metrics, recommendations and weekly activity continue to use saved learner data; weekday labels follow the selected language.
- The notification shortcut opens notification preferences. Notes, saved lessons and mistake collections provide concrete next actions. Code bookmarks prevent a misleading empty-bookmarks message.
- Published learning-path completion earns a calm milestone panel with a next-topic action. The wording distinguishes completed published lessons from the wider planned syllabus. Missing paths offer recovery to the curriculum.
- Curriculum, speaking and coding challenges use the shared hero and code palette. Search-clear labels cover French as well as English and Arabic. Progress animation reacts when reduced motion changes while the app is open.
- The expanded browser check covers 24 routes in three languages and both themes, including small-phone widths, desktop home composition and actionable empty/completed states. Actual outcomes are recorded in the linked change reports after the run; this document describes coverage, not a claim of device certification.

Image and voice entry points remain in the functional teaching workspace. No fake microphone, synthetic streak, invented prerequisite lock or unsupported notification behavior is added. Physical Android/iOS keyboards, accessibility font scaling and frame rate still require device validation.
