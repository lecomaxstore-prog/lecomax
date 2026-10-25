# Learning app release — 8 October 2026

Expo device authorization completed successfully as `lecomax`.

The previous 1.0.2 / Android code 3 build finished successfully:
https://expo.dev/accounts/lecomax/projects/lecomax-learn/builds/532dbf41-b3b8-432e-ad8f-d559e4d52952

The current source, including the Teacher redesign, was uploaded as 1.0.3 / Android code 4:
https://expo.dev/accounts/lecomax/projects/lecomax-learn/builds/047dbccc-6e6d-4282-a7a8-4199acea579d

Upload and fingerprint completed. Final build success and installation remain to be checked.
The upload used EAS_NO_VCS=1 with EAS_PROJECT_ROOT pointing to this app, the preview profile, and existing local signing credentials.

Validation: app TypeScript passed; all 70 app tests passed after refreshing the offline source snapshot (597 files). Website TypeScript also passed.

Prepared locally: `/admin/learning-app` and a link from `/admin/app-releases`. The page accepts a verified Expo APK URL through the server-only `LEARNING_ANDROID_APK_URL` environment variable. Without it, the page displays a pending-build message. The shopping-app release records are untouched.

Still outstanding:
- Verify the 1.0.3 cloud build and obtain its APK URL.
- Publish the mobile auth/teacher routes and the admin download page in an isolated website deployment. Both live mobile endpoints returned HTTP 404 during this resume.
- Configure LEARNING_ANDROID_APK_URL after verifying the new artifact, and verify owner login and Teacher behavior in the installed app.

The root workspace contains many unrelated changes; do not deploy it wholesale. The website release must include the mobile routes, their dependencies, middleware CORS behavior, and source-catalog tracing.

## Completed publication

The 1.0.3 / code 4 cloud build finished successfully. Download:
https://expo.dev/artifacts/eas/da63ehebNsX2S2WHrROHTvM_58SOeUUpUHAfr_IRVrw.apk

Downloaded APK: 110438867 bytes; package com.lecomax.learning; Android API 24 minimum; ARM64 and x86_64. SHA256: CFBFEA0380D7E08A6295980706B703C0A00C6D929B28BDE772CF9990F82233EB.

Isolated website release e443248 was pushed to main with explicit approval. The admin page and mobile API routes are live; unauthenticated checks returned admin login redirect, auth INVALID_INPUT (400), and teacher OWNER_LOGIN_REQUIRED (401). Production LEARNING_ANDROID_APK_URL now points to the 1.0.3 APK. A production redeployment was started to activate that variable. Real owner login and a full Teacher conversation in the installed app remain untested.
