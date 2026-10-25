# Healthy Life & Daily Routine

The existing `/wellness` route hosts My Day, Habits, Planner, Focus, Learn, Move & learn, Insights and Privacy. The prior guided module remains at `/wellness/guided`; reminders remain at `/wellness/notifications`.

## Working behavior

- Activities and habits support create, read, edit and confirmed deletion, weekday schedules, date-specific check-ins and restart persistence. Activity times can be moved for one date without changing their recurring schedule. Habit rest/skip/undo carries no penalty.
- Planner saves the user's wake/sleep times, protected busy interval, available minutes per study session, weekdays, goal, energy and movement preference. Short/full plans require explicit preview and application. Generated blocks avoid the protected interval and each other. Applying adds to the existing routine; existing overlaps remain user-editable.
- Lighter-day preview shortens unfinished study blocks and marks unfinished movement as rest for the selected date only. Completed work stays intact. Moving a missed session checks conflicts and clears its missed status after a successful save.
- Focus can start from a study activity, with its title and duration. Existing unfinished timers are retained. Pause/resume uses elapsed wall time across navigation/restarts; completion requires explicit saving and cannot double-count. Focus notes and reflections stay local.
- Learning includes sourced sleep, nutrition, hydration, exercise, stress and memory material, daily rotating knowledge and optional quizzes. Four persisted exercise-literacy paths provide learning-only, gentle exploration and independent review modes. These are educational steps, not prescribed exercise doses or automatic intensity progression.
- Insights use recorded habit targets and active check-ins only. Rest/skip and missing data are not failures. Calendar counts, text equivalents and progress bars accompany weekly and per-habit summaries.
- Quiet hours apply to native weekly schedules and browser delivery, including late catch-up and bedtime. They use local time, allow overnight intervals, and equal start/end means silence all day. Explicit notification tests are immediate and are labeled as exceptions.

## Data and privacy

`JourneyProvider` serializes updates and commits UI state after storage succeeds. Optional fields on `LifeState` preserve legacy records. Validation rejects invalid dates, durations, identifiers, goals and malformed learning data. A failed save preserves editor drafts. The existing app sign-in gate remains in place.

The store is the existing AsyncStorage/browser-local `lecomax.wellness.v1` record. This is local storage, **not a separately encrypted health vault**. Browser-profile and device access protection matter. No biometric integration, sensor collection, cloud wellness sync or automatic sharing with AI was added. Privacy explains the storage limitations. Confirmed deletion resets wellness preferences, history, habits, notes and learning paths, and disables wellness reminders without clearing Academy lessons or Change History.

## Limits and verification

- New workspace content is English; existing guided routines retain their translations. The language notice is shown for other interface languages.
- Browser scheduled reminders require a supported browser, permission and an open tab. The focus break prompt is on-screen, not a background alarm. Native OS delivery can be delayed by power-saving or notification settings.
- Reminder schedules are explicitly configured; editing a custom activity does not silently create a system notification.
- Rules generate plans transparently; there is no AI health prediction. Saved times represent preferences, not measured sleep. Timer minutes do not prove attention or mastery.
- Focused tests: `node --test tests/healthy-life*.test.cjs tests/wellness*.test.cjs tests/change-history*.test.cjs`.
- Build and browser smoke: `npx expo export --platform web --output-dir dist-healthy-life-check`, then `node scripts/healthy-life-smoke.cjs`. The smoke uses a disposable browser profile, synthetic authentication and local data; external services are blocked. Screenshots in `artifacts/healthy-life-*.png` are historical test captures, not a deployed preview.
- Physical-device QA, full translation and deployment are separate; no deployment was performed.

## Educational references

Each lesson links to its source. New material was checked against [NHS Eatwell](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/), [NHS warm-up guidance](https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/) and [NHS seated exercises](https://www.nhs.uk/live-well/exercise/sitting-exercises/). Existing lessons link to CDC, WHO, NHS and NIH material.
