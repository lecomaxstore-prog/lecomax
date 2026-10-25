# Phone recovery build 13

Recorded UTC: 2026-10-12T05:30:20.088Z

Completed local signed APK: artifacts/lecomax-learn-1.0.11-build13.apk
Version 1.0.11, versionCode 13, arm64-v8a.
SHA256: 5d78db289941c3f4e336a970bf7febe244070b723161364c76161666cb140bb0

11 viewer/history tests and 6 native tests passed. TypeScript, focused lint, signing/version/asset verification and 1369-entry artifact audit passed. Build retry log: artifacts/phone-recovery-build13-retry.log.

No phone connected over ADB; install this APK on BOTH viewer and sharing phone. Test approval, Home/app switching, returning within two minutes, temporary network recovery and explicit Stop. This does not promise survival after force-stop, Android capture revocation or process termination.

No public deployment or OTA update. APK includes 149 history reports through automated verification. Post-build artifact verification report is preserved in workspace history for a future build.
