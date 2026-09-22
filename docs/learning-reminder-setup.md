# Owner evening course reminder

The admin web push system sends the owner a reminder at 21:00 Europe/Paris if no academy lesson was marked complete that calendar day. Completing a lesson at any time before the reminder cancels it for that day. Simply opening a lesson does not count. Unmarking a lesson does not erase the daily study record.

## Activation

1. Apply `supabase/migrations/20260922210000_learning_reminders.sql` before deploying. It adds server-only daily study records and identifies each admin push subscription by the authenticated account email.
2. Deploy the changed application and `vercel.json`. Existing server configuration must include `CRON_SECRET`, the Supabase service-role credentials, `ADMIN_EMAIL`, and the existing VAPID push keys.
3. On the owner's phone, sign in to the admin panel and enable its notification bell. Existing enabled subscriptions acquire the owner identity automatically when the panel is reopened.
4. Mark an academy lesson complete to record today's study. A save failure is displayed and does not mark the lesson complete.

Two daily UTC triggers cover Paris summer and winter time. The handler accepts only the 21:00 Paris hour. Actual arrival depends on the scheduler and device notification delivery; Vercel Hobby can invoke daily jobs later within that hour.

Daily claims are atomic, so repeated or concurrent invocations cannot send a second reminder. Claims are retained if delivery fails or becomes uncertain, avoiding duplicate notifications; inspect cron logs before any manual retry. Devices without a known owner identity do not receive this personal reminder. Customer and staff devices are excluded.

This change does not create a new 9 AM push reminder; the existing morning calendar reminder remains separate.

## Academy experience

The academy opens in guided mode, with a learning journey, short lesson cards, exercises, quizzes, and a personal recap before completion. The next mission follows the journey order. Full lessons remain available through the reading-mode switch. The first-shop lab provides an isolated HTML preview and saves the draft in the current browser.

Guided steps and lesson progress are stored in the current browser; only the daily completion record is saved on the server for reminders. They do not currently sync between devices.

Local validation on September 22: the 192 lessons in three languages pass course validation, and all 16 focused reminder, private-access, and admin-push tests pass. These checks do not establish production activation or physical-device delivery.

TypeScript and focused lint also pass. The browser suite now passes guided-step persistence, full lesson mode, quizzes, search, Arabic layout, mobile/tablet/desktop sizing, and Code Game validation. Mobile fixes align the sticky header with the actual 20px container padding and keep the code editor at least 320px tall.

## Beginner workshop

The academy now starts with five short, localized mini-shop missions: page routing, links, component props, cart state, and private server code. Learners choose a code fragment, inspect a teaching simulation, get feedback for their specific answer, and explain the idea in their own words. The reflection is not graded or retained. Explored missions persist in this browser and are counted once; replay hides the explanation and example for recall practice.

Each mission links to its complete course module and offers a transfer challenge to rebuild in a practice project. The “Build my site from zero” button opens the tools/setup module. Workshop completion is separate from lesson completion and does not suppress the evening reminder.

Longer guided lessons now show five learning phases and an optional help panel with the lesson's analogy and vocabulary. The full journey map and topic shortcuts are collapsed initially to reduce the number of choices shown at once.

`node --test tests/shop-missions.test.ts` validates saved progress and example syntax. `node scripts/smoke-course-ui.mjs` also checks wrong-answer feedback, the difference between fixed and incremental cart state, reflection before completion, and progress restoration.
