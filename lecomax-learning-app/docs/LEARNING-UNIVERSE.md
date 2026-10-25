# Connected learning universe

## Product structure

The existing Expo Router, React Native, emerald design tokens, School progress store, owner authentication and lesson architecture remain in place. New activities use the existing validated progress snapshot and its export/manual cloud-backup path. No dependencies or database migrations were added.

Home connects a real next-lesson mission, saved lesson, tutor recommendation based on recorded difficulties, daily challenge, journeys, reviews, galaxy and growth. Explore retains real published courses and the existing AI plan workflow for other goals; a requested subject is not presented as an authored course.

The seven journey choices persist in `drafts['universe:journey']`. They change the lesson-step sequence and, where appropriate, add mechanism/counterexample, deliverable or curiosity prompts. Exam preparation starts with the checkpoint; project work starts with practice; microlearning narrows the suggested session to one concept and one checkpoint. Existing full lesson completion gates remain intact. Lesson summaries offer optional browser speech synthesis with stop/error handling; native users retain accessible text and an explicit capability notice.

## Playable practice

The Arcade includes Memory Match, Concept Detective, Find the Error, Build the Sequence, Knowledge Quest, Code Debugging Challenge, Logic Puzzles, Speed Recall and Explain to Win.

Content scope is deliberately explicit: generated arithmetic/logic and introductory JavaScript number/string reasoning. Generators use bounded integer rules, unique answer options and exact keys; they do not ask an AI to invent an answer key. The daily quest uses the local calendar date as its seed. Other runs vary their seeds. This is not a game bank for every subject in Explore.

- Most rounds award 100 points for the first correct answer and zero for an incorrect answer. Feedback and the correct answer remain available.
- Memory Match awards 100 per pair minus 10 per mismatch, floored at zero overall. Pairs can be found in any order.
- Sequence checks the complete ordering and supports undo. Partial ordering survives reload.
- Speed Recall adds up to 50 points for speed, with a 30-second wall-clock deadline per round that survives interruption. A no-time-pressure mode is available before starting.
- Explain to Win saves a learner explanation and checks a separate reasoning-choice question. Its score does **not** claim to grade the prose.

Active runs, matched pairs, mistakes, explanations, partial sequences and the latest completed result per activity/subject save in namespaced drafts. Opening tools, playing games and self-rating cards never award lesson mastery. Completed scores remain available after restarting the application.

## Galaxy and growth

The galaxy uses the already-installed `react-native-svg`, a bounded ten-node map and accessible corresponding lesson controls. Solid edges represent declared prerequisites; dotted edges represent suggested course order. Off-page prerequisites have direct links in the selected concept. No physics simulation or large graph dependency runs in the background. Arabic mirrors the visual pathway.

States distinguish prerequisites needed, available, in progress, spaced-recall mastery and review needed. Mastery here means a completed lesson with at least two successful spaced recalls for every assessed question. It is not a universal certification. Completion alone, game points, self-ratings and AI judgments are insufficient.

Growth presents actual lesson completion, spaced-recall evidence, recorded review days, areas with errors/due reviews, saved game results and project evaluation outcomes. Archived project test results are explicitly historical; users must rerun after code edits. Empty metrics are honest zero/empty states.

## Studio, review and motion

The existing executable code editors, math/science experiments, diagrams, quiz, project and flashcard tools remain available. The studio now links directly to tutor, Memory Studio and games and includes a persistent experiment notebook. Tutor goal links now expose the requested topic without silently replacing an active conversation.

Memory Studio retains its existing four-grade scheduler and adds schedule estimates from that same scheduler, a difficult-card collection based on recorded Again/Hard events, session review progress and gentle card reveals. The difficult collection is historical, not a claim that a card is still difficult.

Existing loading skeletons, save-error retry, responsive controls and theme tokens remain. New card reveals and stack transitions honor system reduced motion; a failure to read that preference does not block rendering. No animation blocks answer buttons.

## Quality and limits

`scripts/audit-universe-controls.cjs` inventories every static Button/IconButton/ToolCard/ListItem/Pressable/TouchableOpacity and router destination in app/components/features. It reports missing handlers and nonexistent literal targets. Dynamic labels/routes and actual runtime outcomes require interaction checks; this inventory is not a claim of manually clicking every conditional control.

`tests/universe.test.cjs` checks 100 seeds per supported mode/subject, unique localized choices, sequencing, scoring, repeat-award prevention, interrupted deadlines, untimed accessibility, corruption handling, backup-schema round trips and evidence-based states. Existing interaction assertions remain; isolated test harnesses stub the added neighboring UI, which is exercised in the actual browser script.

`scripts/universe-browser.cjs` uses a local web export, disposable browser profiles and synthetic authentication. It checks English/Arabic/French, widths 320/390/768/1280, reduced motion, light/dark themes, real game playthroughs, incorrect answers, matching penalties, partial-sequence reload, lesson notes, review persistence and galaxy navigation. It never contacts a real learner account or paid AI provider. Screenshot capture waits for rendered content; early fixture failures were corrected before accepted results.

See the linked append-only Change History report for actual final counts and results. No deployment is authorized or performed. Native hardware, live AI accuracy, real cloud storage, browser voice quality across installed languages, exhaustive screen-reader behavior and measured learning improvement remain outside these automated checks. Existing studio activities include some English authored content; translated navigation does not imply that every legacy activity has been reauthored in Arabic.
