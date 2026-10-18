# Learning app publication — 8 October 2026

User authorized publication to Expo account `lecomax`, a live learning-app update, and the admin app update.

## Published / submitted

- App version 1.0.4, Android version code 5; package remains `com.lecomax.learning`.
- Added the Expo SDK-compatible `expo-updates` dependency and configured Android appVersion runtime policy.
- Added an internal `release` APK profile using the production environment/channel and existing local signing credentials. API URL is `https://lecomax.com`.
- Published Android OTA group `102ee100-c8c0-4c9e-8c36-6d272e33d951`, runtime 1.0.4, production channel. Update ID `01a11c83-b878-7702-af2e-10dbd4309c0e`.
- Submitted signed APK build `c6bdf6f9-d93c-4fec-95ac-009d3f87cec7` to Expo. Last observed status: IN_QUEUE. No APK artifact has been verified yet.
- Existing 1.0.3 and earlier APKs lack this updater configuration. Install the new signed APK once without uninstalling to preserve local data; future compatible OTA updates target runtime 1.0.4.

Expo links:

- https://expo.dev/accounts/lecomax/projects/lecomax-learn/updates/102ee100-c8c0-4c9e-8c36-6d272e33d951
- https://expo.dev/accounts/lecomax/projects/lecomax-learn/builds/c6bdf6f9-d93c-4fec-95ac-009d3f87cec7

## Prepared backend/admin release

Isolated checkout `release/owner-login-20261008`, branch `publish/owner-login-20261008`, commit `244b1ab`, based on current origin/main `e443248`. Commit is local, not pushed. Root working tree remains separate.

Contains private owner authentication routes and teacher guard, certificate tracing, app source, setup scripts/tests, and the updated admin learning-app page. Admin shows `LEARNING_ANDROID_VERSION` and uses `LEARNING_ANDROID_APK_URL` for the verified artifact. Instructions describe private login, preserving data during installation and future Expo updates.

Validation:

- Learning app typecheck/lint and 120 tests passed before upload.
- All 23 owner authentication tests passed from the release checkout.
- Full release regression run: 550 passed, 1 skipped; Android back and scroll-return scenarios passed. Used a local ignored junction to existing `mobile/node_modules` for dependency-dependent tests.
- Configured production Next.js build passed. Initial build without storefront variables failed homepage prerendering; rerun with existing storefront configuration succeeded.
- Admin page rendering verified version, Expo download link, preservation instructions and rejection of untrusted download hosts.
- Published bundle audit: 1,129 files passed. Source audit: 1,131 files passed. Staged source audit: 1,233 paths passed.
- No new production deployment or production variable update was performed.

## Approval blocker

Automatic approval review rejected sending local `OWNER_EMAIL`, `OWNER_PASSWORD_HASH`, `SESSION_SECRET`, and `OWNER_DATABASE_URL` to Vercel production because it requires explicit approval of that payload and destination. An asynchronous question requested that approval. No answer had arrived when this checkpoint was written. Do not retry the transfer until approval arrives.

Destination verified by authenticated CLI: team `team_yFLUcpSvgQi8EQuvuorOZW7w` (`lecomaxstore-4321s-projects`), project `prj_g5xbDC0WX1RSXf6znHsAS7XvhLBb` (`lecomax`). Vercel MCP lacks access to this scope; CLI works. None of the four owner variables exist in production yet. Set them as sensitive production variables through stdin only; also set `OWNER_TRUST_PROXY=1` for the trusted Vercel proxy.

## Next steps

1. Wait for APK completion; download the artifact, verify package/version, compare signer SHA256 with existing release (`69a0f7fa4609c172acd3d683da50144ffe9810bc2d764c607439dc5081fa6a64`), inspect updater/backup manifest and run decompressed APK secret audit.
2. After explicit approval, securely configure the four private owner variables in production. Existing production storefront variables must be preserved.
3. Set verified `LEARNING_ANDROID_APK_URL` and `LEARNING_ANDROID_VERSION=1.0.4`.
4. Deploy the exact release with `vercel deploy --prod --skip-domain`, verify staged routes via authenticated Vercel access, then promote and verify `https://lecomax.com/api/learning-mobile/auth/sessions` returns application 401 rather than 404/503. Verify invalid login handling without exposing credentials.
5. Verify the admin download link and update the release record. Consider pushing the release commit to current main after checking for new remote changes.

Current connected device: emulator-5580, existing learning app 1.0.0/code 1. No physical phone was connected. No app data was cleared or app uninstalled.

Local evidence: `.owner-auth-qa/publish-*` (ignored). Expo archive Git-clone operation failed on the Windows workspace path. Successful upload used `EAS_NO_VCS=1` with `EAS_PROJECT_ROOT` set to the absolute learning-app directory; archive was 5.8 MB. The production update used the same source.

## Resumed publication

- User explicitly approved transferring the four owner variables to the verified Vercel production project, then separately approved `OWNER_TRUST_PROXY=1`.
- All five variables are now configured as sensitive production variables. No secret values were printed. The previous approval blocker is resolved.
- Rechecked remote main: remains `e4432483d68582144547ca34385e94548da2b274`; isolated release remains clean at `244b1ab`.
- Re-ran all 23 owner authentication tests: passed. Owner configuration/database check passed; client-source audit passed (1,126 files).
- Expo build advanced to IN_PROGRESS; native compilation underway. Artifact verification and deployment remain pending.

- Expo APK finished: `https://expo.dev/artifacts/eas/Q43CLTtph1tETM4xnWmgHEaKVoZUwYv_fBH1_uFwFck.apk`. SHA256 `a4a148c9e1fc8cb2c6d7204d173487fd5ec092398b4836c5540f3dac5c6a8b20`.
- Verified package `com.lecomax.learning`, version 1.0.4/code 5, matching signer SHA256. Backup disabled; Expo updater enabled, launch check ALWAYS, production channel and expected project update URL.
- Complete decompressed archive audit: 1,319 entries checked against 11 configured secrets; no findings. Windows extraction encountered case-colliding resources, so the complete audit reads ZIP entries directly.
- APK installed with `adb install -r` on emulator-5580 and launched; installed version confirmed. No uninstall/data clear. Physical device and full signed-in native lifecycle remain unverified.
- Production APK URL and version variables configured. Exact admin-page rendering passed with release version/download and preservation/OTA instructions; invalid/untrusted URLs are rejected.
- Staged production deployment started at `https://lecomax-c0zrcsav5-lecomaxstore-4321s-projects.vercel.app`, deployment `8bpxyEWe6Kv18y1LnQatwnnb28ov`, with `--skip-domain`. Awaiting completed build and staged checks before promotion.

- First staged API check returned 503; domain was not promoted. Diagnosed transfer parsing: Node `parseEnv` retained escaped dollar signs in the Argon2 hash whereas Next dotenv expansion removes them. Updated only `OWNER_PASSWORD_HASH` using the application parser and secure stdin. Other three approved variables matched the app parser. Re-ran complete APK audit against application-parsed secrets: no findings.
- Corrected staged deployment: `https://lecomax-6v1z2suye-lecomaxstore-4321s-projects.vercel.app`, ID `dpl_A3aCZ8RbtZGuHeRR33JW32Cv4wVB`; awaiting build/checks.

- Diagnosed a separate compiled-runtime failure: `new URL(..., import.meta.url)` was transformed by Next/Webpack into a static asset URL, causing certificate filesystem loading to fail. Replaced it with `path.join(process.cwd(), "supabase", "prod-ca-2021.crt")` in both source and isolated release, retaining explicit output tracing and TLS verification.
- Fix committed as `6a3495a`. All 23 owner tests passed, production build passed, and actual compiled-server sessions/invalid-login checks now both return 401 `INVALID_CREDENTIALS` (previously 503).
- Final candidate: `https://lecomax-mhvkf23mp-lecomaxstore-4321s-projects.vercel.app`, deployment `dpl_9wGYYJM3yr4HgyxsN23ydviYRq8P`. Awaiting Vercel completion and final smoke/promotion.

- Final Vercel candidate built successfully. Authenticated staging requests to sessions and invalid login both returned 401 `INVALID_CREDENTIALS`.
- Promotion was rejected by automatic approval review pending explicit user authorization to promote to live `lecomax.com`. Asked for that final approval; no promotion occurred.

## Publication completed - 8 October 2026

- User approved the live password update/redeployment and asked to resume the pending release publication.
- Verified lecomax.com was serving the prepared owner-login release; redeployed that same production source with the newly approved OWNER_PASSWORD_HASH. No unrelated workspace changes were uploaded.
- Current ready deployment: dpl_GQB1udyBSsr9cxcVMCsxW7eFbL6Q, https://lecomax-9qfkd00iy-lecomaxstore-4321s-projects.vercel.app. Vercel confirmed lecomax.com and www.lecomax.com point to it. The earlier promotion blocker is resolved.
- Live homepage returned 200; unauthenticated sessions returned 401. Real login, confirmation and authenticated sessions checks passed. The temporary verification session was logged out, and subsequent access correctly returned 401. No credentials or tokens were printed.
- Verified the documented signed 1.0.4 APK remains downloadable (HTTP 200, 115060031 bytes).
- The live /admin/learning-app route redirects unauthenticated requests to the admin sign-in page. Its authenticated rendering was verified before deployment as recorded above; no authenticated admin browser session was available in this continuation.
- Publication is complete. Physical-phone remembered-session/restart/update lifecycle acceptance remains user-device testing; it was not claimed by these API checks. The isolated release commits remain local; this continuation did not push or merge Git branches.
