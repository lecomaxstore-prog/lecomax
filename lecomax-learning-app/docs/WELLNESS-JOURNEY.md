# Daily Health & Mind Journey

Open **More → My Health Journey** (`/wellness`). Existing learning tabs and course progress remain intact. Arabic, French, English, RTL, and existing light/dark palettes are supported.

## Delivered

- Today: local date, time-sensitive greeting, journey day, completion, streak, encouragement, animated progress and checkboxes.
- Expandable morning, movement, mind, learning, meals and evening sections. Ten persistent habits; seven completed habits qualify the day. Optional movement does not increase the denominator.
- Seven rotating brain exercises, seven mindfulness activities, seven movement suggestions, seven sleep tips, seven motivational messages, eight mini lessons with practice, and sixteen meal suggestions. Reading plus practice is designed for a short 2–5 minute session.
- Onboarding/editable preferences: ten goals, wake/sleep times, activity level, exercise time, dietary choices and eight learning interests. Reminder times have a separate screen linked from preferences.
- Daily mood, optional energy/focus/sleep/stress ratings and a note. Existing entries can be updated; history is visible in Progress.
- Calendar week/month/all-time summaries, completion chart, rating averages, habit counts, current/longest streak, and eight persistent achievements with reduced-motion-aware celebrations.

## Architecture and files

Added routes: `app/wellness.tsx`, `app/wellness/preferences.tsx`, `app/wellness/notifications.tsx`, `app/wellness/progress.tsx`.

Added under `features/wellness/`:

- `types.ts`: preferences, plans, tasks, check-ins, completion, lessons, exercises, notifications, statistics and streak interfaces.
- `data.ts`: structured, localized offline catalog, ready to replace with a versioned content provider later.
- `engine.ts`: deterministic daily selection, dietary filtering, local date arithmetic, validation, statistics, achievements.
- `storage.ts`: versioned AsyncStorage reads and serialized writes.
- `useJourney.tsx`: shared provider, durable mutations, midnight/foreground rollover, notification reconciliation, retry/error state.
- `notifications.ts`: permission handling, Android channels, serialized idempotent local scheduling and test notification.
- `components.tsx`, `CheckIn.tsx`: reusable feature UI.
- `TodayScreen.tsx`, `PreferencesScreen.tsx`, `NotificationsScreen.tsx`, `ProgressScreen.tsx`: screens.
- `lesson-guides.ts`, `GuidedLesson.tsx`: eight fully localized guided lessons with a learning outcome, plain-language explanation, optional simpler summary and detail, everyday example, common mistake, three practice actions, and an understanding question with answer-specific feedback. The reader has four navigable steps; practice ticks are temporary reading aids, while the existing daily lesson completion remains persistent.

Added `tests/wellness.test.cjs`, `scripts/wellness-smoke.cjs`, this document; visual test artifacts are in `artifacts/wellness/`.

Modified `app/_layout.tsx` (provider), `app/(tabs)/more.tsx` (entry card), `features/NotificationBridge.tsx` (wellness deep link and recurring-response identity), `services/notifications.ts` (scope lesson cancellation and respect sound), `tests/release.test.cjs` (realistic notification fixtures), `eslint.config.js` (exclude generated dist folders).

No dependencies installed. No Expo configuration changes required: AsyncStorage, expo-notifications and its config plugin were already installed. Android/iOS JavaScript and Hermes bundles can be exported with the existing configuration. Distribution to iOS still needs the normal Apple signing/build configuration; this change does not provision it.

## Daily selection and storage

Device-local calendar dates are keys. Plans are persisted on first use and remain stable across restart. Day rollover is checked every 30 seconds and on foregrounding; no background JavaScript service is required. Meal alternatives persist. Preferences regenerate today's plan while retaining its checked habits/check-in and all earlier plans.

Interests, or goals when no interests are chosen, determine the ordering of an eight-day lesson cycle. Each lesson appears once per cycle. Brain/mindfulness/movement/sleep content rotates over seven days. Dietary choices filter meal options; activity level and available time determine a gentle movement target. Wake/sleep times appear in the routine. Reminder times are independently editable.

Data stays on the device in AsyncStorage under `lecomax.wellness.v1`, separate from school progress. It is not sent to an API and is not cloud-backed or encrypted by this feature. Clearing app/browser data or uninstalling may remove it. Schema validation rejects malformed or unsupported data without replacing the saved value. Failed writes show a retry state; a habit is only visually completed after persistence succeeds. Writes serialize to prevent older state overwriting newer state.

Days qualify at 70%. Yesterday's streak remains current until today has a chance to be completed. Missing calendar days count as zero in completion averages starting from enrollment; missing ratings are excluded from rating averages. Achievements remain unlocked even if a habit is later unchecked. Healthy Week means seven accumulated days with fruit, vegetables and a balanced meal; the UI explains this non-punitive definition.

## Notifications

Six available times: 08:00 morning, 10:30 brain, 13:00 meal, 16:00 learning, 18:30 movement, 21:30 evening. New users start with only the morning category selected. See DAILY-ENCOURAGEMENT-20261007.md for the new presets, daily cards and gratitude journal. Settings include a global toggle, category toggles, validated 24-hour times, sound and a three-second test.

Permission is requested only after an explicit save/enable or test action. Android channels are created before requesting permission; separate audible/silent channels accommodate Android channel immutability. Stable identifiers and content signatures avoid duplicate schedules. Only requests tagged `feature: wellness` are reconciled. Lesson reminders cancel only their own lesson-tagged requests.

Preferences are saved before scheduling. Interrupted or failed scheduling is recoverable by saving again, restarting or foregrounding the app. Reconciliation does not repeatedly prompt for permissions. Tapping a wellness notification opens Today, including cold starts. The OS handles seven recurring weekly triggers per enabled category, with different text for each weekday; delivery can be delayed or suppressed by system notification/battery settings. Local notifications are unavailable on web; the browser can store reminder times.

Implementation follows the [Expo notifications reference](https://docs.expo.dev/versions/latest/sdk/notifications/). General food variety and wind-down content was checked against [WHO healthy diet guidance](https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet) and [NHS sleep guidance](https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/). Content avoids diagnosis, medical treatment claims, calorie restriction and strenuous targets.

## Running and testing

From `lecomax-learning-app`:

```sh
npm run web -- --port 8083
npm start
npm run android
npm run typecheck
npm run lint
node --test tests/wellness.test.cjs tests/release.test.cjs
npx expo export --platform android --platform ios --output-dir dist-wellness-native
```

Browser automation: run `node scripts/wellness-smoke.cjs` with a local server at port 8084, or set `WELLNESS_URL`. Set `PLAYWRIGHT_MODULE` to an existing Playwright installation if it is not on the module path. It uses a disposable browser context and synthetic progress, not personal data.

Guided-lesson regression: `node scripts/wellness-lessons-smoke.cjs` (defaults to port 8083). Exercises every lesson in all three languages, including simplification, examples, practice ticks, both answer-feedback paths and narrow/wide layouts.

Manual native acceptance:

1. Open More → My Health Journey. Edit goals, diet, time and interests; verify Today changes.
2. Complete seven habits and record mood/ratings/note. Force-close/reopen; verify persistence, streak, achievement and Progress history.
3. Replace a meal, restart, and verify the choice persists. Cross a local midnight or foreground on a later day to verify a fresh plan and preserved history.
4. On Android and iOS, deny notification permission, retry, then allow via system settings. Save twice and verify seven requests per enabled category (42 for all six) are pending; disable a category, change a time and test sound on/off.
5. Test notification receipt foreground/background and tapping from a terminated app. Toggle existing learning reminders and verify wellness reminders remain intact, and vice versa.
6. Check text sizing, screen-reader checkbox states, Arabic RTL and dark mode.

Validation performed: TypeScript and lint; nine wellness logic/storage/scheduler tests; existing release tests; browser interaction and 90 viewport/locale/theme layout checks; Android and iOS Hermes exports. Actual device delivery and iOS signing/install were not tested in this Windows session.

Full test suite has one unrelated existing failure: `source excerpts match actual files...` because the offline snapshot of `app/api/admin/learning-assistant/route.ts` differs from current source. The wellness change does not regenerate the entire educational content snapshot.
