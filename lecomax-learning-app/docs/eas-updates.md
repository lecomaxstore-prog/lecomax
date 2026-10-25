# Android live updates

Expo project: https://expo.dev/accounts/lecomax/projects/lecomax-learn

The EAS release APK version 1.0.4 (versionCode 5) uses runtime 1.0.4 and the production channel. Compatible JavaScript and asset updates can be delivered without reinstalling. Older APKs without EAS Update need the 1.0.4 release APK installed once.

Production publication:

```text
eas update --channel production --platform android --environment production --message "Describe the release" --non-interactive
```

Use the production API https://lecomax.com. Do not publish a bundle containing a localhost API override. Run the source secret audit, typecheck, focused tests and history check before publishing. Append immutable preparation and verification reports using scripts/change-report.cjs.

Updates download at app launch. Leave the app online briefly, close it completely, then reopen it to apply a downloaded update; up to two launches may be needed. An installed app does not receive every local edit automatically: publish a new EAS Update for each release. Native dependency changes require a compatible new runtime and APK.

The checked-in local android folder has older update metadata and is excluded by .easignore. Cloud release builds regenerate the native project from app.json; do not use the stale local folder to create a live-update release.

Device notification delivery and actual update application must be checked on a phone; a successful upload alone does not verify either.
