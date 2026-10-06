# Learning notifications and publication check — 6 October 2026

Compared the local source against GitHub `main` at `5aa8835`. The local Academy, AI Tutor, micro-learning, admin, storefront and mobile feature work is already included in main. Remaining source differences are older implementations of fixes already on main (checkout storage and submission protection, shipping settings, collection selection, stock metadata, accessibility and mobile typing), plus whitespace and an obsolete deployment note. Publish from current main to preserve those fixes. Generated build backups, local credentials and release worktrees are not publication inputs.

At the owner's request, the existing production learning settings were enabled with a 10-minute interval, no pause and quiet hours disabled. Two admin devices were registered. The existing Supabase `lecomax-micro-learning` job is active every minute; the database deadline controls the actual lesson interval. The first deadline is 2026-10-06 21:05:44 Europe/Paris, eligible for the following scheduler tick. No catch-up burst or lesson-history reset was performed.

Run `scripts/check-learning-delivery.ps1` from the configured local checkout for read-only settings, scheduler runs and recent per-lesson delivery counts. It uses the existing Supabase CLI login and linked-project check, and omits addresses, device endpoints and secrets. A successful cron run alone does not prove delivery: inspect `recent_lessons` and `accepted_devices`. Push acceptance does not prove a notification was displayed by the operating system.

Validation on the release source: 527 tests passed, one skipped, plus the Android back-controller and scroll-return scenarios. The original local source also passed its 516 runnable tests.

The course contains 102 distinct Arabic lessons and stops after the last one. Manage the interval, quiet hours, pause, or register another device at `/admin/how-it-was-built/learn/`.

The first automated lesson was accepted at 21:06:02 Europe/Paris by one owner device, with zero failed or unknown attempts. The cadence migration fixes the observed extra-minute drift by preserving interval phase and aligning existing future deadlines to scheduler minute boundaries. All 33 focused learning and notification tests pass, including late-tick and missed-slot behavior.
