# Conditional Preview approval: stopped before upload

The user conditionally authorized one protected Preview only if every mandatory preflight passed, including disabled automatic retries. No upload or deployment command was executed.

## Blocking finding

The installed CLI deployment client calls `uploadFiles`, whose async-retry options hard-code `retries: 5`, `factor: 6`, `minTimeout: 10`. Evidence: `C:/Users/Ziko/AppData/Roaming/npm/node_modules/vercel/dist/chunks/chunk-LBP7YFBV.js:47983`. The proposed deploy command provides no retry override to this path. A wrapper invoked once does not disable internal retries.

This establishes upload retries, not proof of duplicate deployment creation. It is sufficient to fail the user's broader no-automatic-retries requirement before any upload. The earlier procedure's no-retries claim is not implemented by that command and must not be relied on.

## Checks completed

- Revalidated actual candidate branch/commit, 137 tracked modifications, 15 untracked files and all 2601 hashes with zero mismatches.
- GET-only provider audit confirms expected staging project/team, all-deployment protection, zero configured protection exceptions, no Git connection or project cron schedules.
- Team webhook API returned an empty list. Integration inventory returned Upstash with selected-project access and no selected projects; no staging association is reported. No hook or integration was invoked or changed. These are control-plane findings, not proof about arbitrary dependency behavior.
- Staging deployment inventory contains the prior intentionally failed verifier plus the four older deployments; no new storefront submission was made.
- Saved verifier PASS remains authoritative. It was not rerun; its guard remains consumed.

## Unexecuted work and next action

Actual CLI upload inventory/secret exclusion certification, final environment refresh, full remote build-hook clearance, immutable Preview identity, HTTP/browser acceptance and real staging-backed catalogue validation were not completed after the blocking finding. Prior security test results are unchanged evidence, not new hosted results. The current app boundaries do not provide OS-level native process egress isolation or provider-wide email suppression.

Prepare and locally validate a transparent submission procedure that demonstrably disables automatic upload and deployment retries and fails closed after an ambiguous response. Any alternative to the approved CLI procedure must be reviewed before execution; do not patch the global CLI, monkey-patch its network stack or silently switch to a different API path. Complete remaining preflight checks against the replacement before seeking approval of a concrete operation.

No rollback or remote cleanup is required. Preserve all candidate files, reports, manifests, verifier receipts and guards. The one storefront deployment authorization has not been exercised. Preview execution NO-GO; production NO-GO; Release E on hold.
