# Account deletion page publication

Published on 2026-09-16 at https://lecomax.com/suppression-compte/.

The public page explains how to request account and associated-data deletion by emailing contact@lecomax.com. It requires no login or installed app, provides a prefilled mailto link and a plain email fallback, and describes transaction retention consistently with the existing privacy policy. Requests require manual review and fulfilment by the store team; this change does not automate deletion or send email.

The website profile deletion button now links to this page instead of doing nothing. The privacy page and sitemap also link to it. No native app binary was changed.

## Deployment

- Production baseline: c70b3b3306958a09b4fc242a3e88b04880299407.
- Isolated source: release/account-deletion-publish (baseline archive plus the four task files).
- Deployment: dpl_DUmQ588nij1fyJQ8JzaWKNHR47L9.
- Deployment URL: https://lecomax-p830jbc1c-lecomaxstore-4321s-projects.vercel.app.
- Previous production: dpl_38KstXSWtA6xz3s3YFtyT7Vkx57w.
- Published via Vercel CLI; these changes have not been pushed to GitHub. Include them in future source deployments to retain the page.

## Validation

Focused lint passed with an existing profile image warning. The Vercel production build, type checks, and course validation passed (existing lint warnings remain). Anonymous HTTP checks confirmed status 200, the deletion heading, mailto link, retention wording, privacy-page link, and sitemap entry. No deletion request was sent and mailbox delivery was not tested.
