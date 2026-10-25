# Install L’ECOMAX Learn on Android

Project: `C:\Users\Ziko\Desktop\my projects\L'ecomax\lecomax-learning-app`

Android package: `com.lecomax.learning`. App version: **1.0.2** / version code **3**. Expo SDK: **57** (installed Expo package **57.0.27**).

## Development

In Windows **Command Prompt**, run:

```bat
cd /d "C:\Users\Ziko\Desktop\my projects\L'ecomax\lecomax-learning-app"
npm install
npx expo start
```

On this computer PowerShell blocks the npm `.ps1` wrappers. In PowerShell, use `npm.cmd install`, `npx.cmd expo start`, and `eas.cmd` instead. No execution-policy change is necessary.

`npm install` was run successfully. Metro started and returned `packager-status:running`. Lessons, sources, quizzes, notes and progress require no environment variables or backend. Expo Go is useful for development; notification delivery should be checked in the installed APK.

## Install the APK

Use the final `artifacts/lecomax-learn-1.0.2.apk` once the build verification recorded in `PHONE-RELEASE-CHECK.md` is complete. Transfer it to your phone, open it, and allow installation from the browser/file manager when Android asks. Existing installs with the same signing certificate can be updated without intentionally erasing their learning data. Do not uninstall an old copy unless you have exported any notes you need.

Minimum Android version is Android 7 / API 24. The APK supports ARM64 phones and x86_64 emulators. It does not include 32-bit ARM support.

## EAS cloud APK command

The official EAS CLI is installed globally. The `preview` profile uses `distribution: internal`, `android.buildType: apk` and the existing local signing identity, consistent with [Expo’s APK build documentation](https://docs.expo.dev/build-reference/apk/).

```bat
eas build --platform android --profile preview
```

The project is already linked to `lecomax/lecomax-learn`. Do not initialize another project. Sign in with `eas.cmd login --device` using an account with access to `lecomax`. On 8 October 2026, device login as `lecomax` was verified successfully.

The existing `credentials.json` and `.credentials/learning.jks` are present privately on this computer. Preserve them for future updates. They are excluded from the source archive and app bundle; EAS transports signing credentials through its separate credentials mechanism. See [Expo’s local credentials documentation](https://docs.expo.dev/app-signing/local-credentials/).

This app lives inside the website Git repository. The repository-root `.easignore` protects private environment/signing files, agent context and generated artifacts while retaining the learning app’s offline catalog/config plugin and existing storefront sources. EAS ignores were checked using the installed CLI’s own ignore implementation.

## First phone check

1. Open a lesson, complete its quiz, save a note and bookmark it.
2. Close and reopen the app; confirm the note and progress return.
3. Enable airplane mode and reopen the lesson, search and project explorer.
4. Switch Arabic/French/English and light/dark mode.
5. In Settings, enable a reminder and grant Android notification permission. Reminders are daytime-only, at most three/day, with fourteen future notifications. Tap a delivered notification to open its lesson. Re-enable reminders in Settings to renew the finite schedule.

Notification handler, permission denial, scheduling bounds and rollback behavior are covered by local checks; actual delivery on your phone remains dependent on its permission/battery settings. No remote push account or FCM server credential is needed for these local reminders. The foreground display behavior follows [Expo’s notification handler documentation](https://docs.expo.dev/push-notifications/receiving-notifications/).

AI Teacher requires internet and the deployed mobile backend. Both mobile API endpoints still return HTTP 404 in production. Connection/server failures show a recoverable message and retain your draft; ordinary learning remains available offline. The APK does not contain an OpenAI provider key.
