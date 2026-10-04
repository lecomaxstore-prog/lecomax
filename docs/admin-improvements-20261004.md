# Admin workflow improvements — October 4, 2026

Reviewed the admin navigation, dashboard, knowledge base, activity history, login feedback, and shared connection state.

- Added a dashboard workspace directory with task groups and accent-insensitive search. It links to existing store tools and filters them by the current account's permissions. Unknown permission state shows no tools. Owner-only pages remain owner-only.
- Restored mobile support to the grouped SAV navigation and added the missing support/activity page titles.
- Corrected the New product shortcut to require both products.view and products.create, matching navigation and API requirements.
- Added a shared browser offline notice without reloading the page or attempting automatic writes.
- Added refresh/retry and a timeout to activity history, with response validation.
- Improved knowledge-base load errors, retries, refresh, filtered empty states, and accessible operation feedback. Failed mutations retain the displayed entry and failed saves retain the editor data. A synchronous operation guard blocks duplicate taps. Status and deletion update locally only after the server confirms success. Unconfirmed mutations advise checking the list before retrying.
- Corrected broken French accents in login error messages.

Validation: 19 focused tests across workspace permissions/search, UI recovery, admin access and dashboard requests. TypeScript and the release production build passed, including course validation. Browser visual checks were unavailable because no browsers are connected to the computer-use session. No production records were altered to test these workflows.
