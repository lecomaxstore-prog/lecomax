# Learning release — 9 October 2026

Recorded at 2026-10-09T12:32:20.917Z. User authorized the Expo publication, updated admin APK, and build/upload prompts.

- Production Android update: https://expo.dev/accounts/lecomax/projects/lecomax-learn/updates/3901531e-426d-4253-a80e-dade948612e7 (runtime 1.0.4). Includes the final verified report.
- Signed APK build: https://expo.dev/accounts/lecomax/projects/lecomax-learn/builds/900ab341-2229-4f8e-9bb6-bc96a669d01b . Version 1.0.4, code 6, package com.lecomax.learning.
- APK: https://expo.dev/artifacts/eas/bVLiI4opM0sF9rg_Lz2x1CZdtl11ko1TwVrwD_g7jFU.apk
- SHA256: da487100453b6e793a43fe67ddfffc0b81bdde89419acf71bbe50d0488c221d3; size 115236623 bytes.
- Signer SHA256 retained: 69a0f7fa4609c172acd3d683da50144ffe9810bc2d764c607439dc5081fa6a64.
- Updated production LEARNING_ANDROID_APK_URL and LEARNING_ANDROID_VERSION (1.0.4 (build 6)). Redeployed prior live deployment dpl_GQB1udyBSsr9cxcVMCsxW7eFbL6Q without uploading unrelated workspace changes.
- New ready production deployment: dpl_GgP5J53zyaZQ2xyiHfFHt3ZW1pra, https://lecomax-g8tk5z7c2-lecomaxstore-4321s-projects.vercel.app . Vercel confirmed lecomax.com and www.lecomax.com aliases.
- Admin download page: https://lecomax.com/admin/learning-app (requires admin login).

Validation: TypeScript, ESLint, all 157 existing tests passed; five release tests passed after code increment; six history tests passed after final report. History check passed with all 35 reports preserved. Source and exported bundle secret scans passed. All 1320 APK ZIP entries checked against 11 configured secrets without findings. Package/version, signing identity, disabled backup, enabled Expo updater, ALWAYS launch check and production channel verified. Release report confirmed in APK.

Admin component rendering passed for new artifact URL/version and invalid-link handling. Live homepage returned 200, unauthenticated admin page redirected 307, and unauthenticated sessions/invalid login returned expected 401 INVALID_CREDENTIALS. No connected phone, emulator or browser was available, so physical installation, actual device OTA adoption and authenticated live admin rendering remain untested.

Reports: learning-production-apk-code6-20261009 and linked learning-production-apk-code6-20261009-verified. The APK bundles the preparation report; the final Expo update also delivers the completion report. No historical reports were modified or removed.
