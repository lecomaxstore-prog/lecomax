# Daily encouragement and gratitude — 2026-10-07

## User experience

Health Journey now puts the daily overview ahead of onboarding. It includes seven localized themes with fourteen rotating small actions, a daily encouragement, an optional action checkmark, and a gratitude prompt. The action is separate from the ten-habit score: skipping it never reduces daily progress. Difficult days are explicitly welcome.

Gratitude notes are saved per local calendar day (maximum 2,000 characters), restored after restart, and shown in Progress using its selected date range. Save failures keep the draft visible and allow retry. Notes remain on the device; notification content never contains journal text. Existing v1 saves load without a destructive migration.

The greeting uses a moon in the evening. Brain-challenge reveal/hide state starts fresh when the local day changes.

## Daily delivery

In the updated mobile app, open **Health Journey → Reminders**, choose **One daily message**, **Morning and evening**, or **All six daily reminders**, adjust the times, and tap **Save reminders**. Grant the OS notification permission when prompted, then tap **Test in 3 seconds**. Existing saved reminder choices are preserved. New users start with only the morning category selected and notifications remain off until enabled.

Each selected category uses seven weekly recurring requests, one per weekday. Together they deliver every day without a finite scheduling horizon. Notification text varies by weekday and repeats weekly. In-app actions repeat over fourteen days; this is an offline curated catalog, not unlimited AI-generated content. Requests use local wall-clock times, stable identifiers, content signatures, and serialized reconciliation. Legacy wellness requests are replaced; unrelated learning requests are retained. Interrupted scheduling can recover on save, app startup or foregrounding.

One daily category uses seven pending requests; all six use 42. The existing lesson scheduler uses up to 14 additional requests. Notification previews reflect the current form and are not a delivery confirmation. Web can save preferences but cannot deliver these native local notifications. OS permissions, battery policy and focus settings may affect actual delivery.

Expo recurring trigger semantics: https://docs.expo.dev/versions/latest/sdk/notifications/#weeklytriggerinput

## Validation

- TypeScript and ESLint passed.
- 20 wellness/release tests passed, including all weekday coverage, legacy migration, deduplication, interrupted scheduling recovery, permission denial, date rollover, presets, and journal persistence/validation.
- Two rendered interaction tests passed: saving/restoring gratitude, failure recovery, action completion, preset selection, save-before-schedule ordering, and explicit test notification.
- Full suite: 58/59 passed. Existing source snapshot mismatch at `app/api/admin/learning-assistant/route.ts` remains unrelated to this work.
- Android and iOS Hermes exports succeeded in `dist-wellness-daily` after allowing the installed compiler to execute outside the restricted sandbox.
- Physical-device delivery and visual device QA remain unverified. No new APK was installed or published, and notifications were not enabled remotely on the user's phone.
