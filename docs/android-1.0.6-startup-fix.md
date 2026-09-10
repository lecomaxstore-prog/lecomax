# Android 1.0.6 startup fix

The publicly downloaded 1.0.5 APK (build 21, SHA-256
`43a92a35083593af96d466aa06520d2e97f03e7956fad420f6eb3b3470a54429`)
reproduced the reported error after the intro in an Android 36 emulator.

Logcat identified `OpeningVideo` unmount cleanup:

```text
Call to function 'VideoPlayer.pause' has been rejected.
Cannot use shared object that was already released
```

`useVideoPlayer` registers native resource disposal before the component's
effects. The component subsequently called `player.pause()` during unmount,
after Expo had disposed of the player. This prevented the next screen from
opening when the intro ended or was skipped.

The cleanup now removes the AppState subscription and marks the component
unmounted, leaving native player disposal to Expo. Backgrounding still pauses
the player while it is mounted.

Validation:

- `node --test tests/mobile-launch-video.test.ts` simulates Expo releasing the
  player before the component's cleanup and checks background pause/resume.
- Mobile TypeScript and focused ESLint checks pass.
- Android back-controller and scroll-return tests pass.

Device testing of build 23 exposed a second error in `HomeHeader`:
`TypeError: undefined cannot be used as a constructor`. Translation of cart and
notification counts called `new Intl.PluralRules`, which this Android Hermes
runtime does not provide. Translation now falls back to cardinal plural rules
for the app's English and French languages when that constructor is absent.
`tests/mobile-plurals.test.ts` checks both languages with `Intl.PluralRules`
removed, including the exact home-header translation keys.

A local emulator-only APK with both changes successfully reaches the home
screen after the intro and onboarding. Relaunch also reaches the shop without
ReactNativeJS/AndroidRuntime errors. This APK uses a disposable test key and
must never be published.

Final release target: 1.0.6, Android version code 24. Build 22 was reserved by an
unsuccessful archive upload. Build 23 contained only the first fix and failed
the subsequent home-screen test; neither was published.

Final Expo build: `c875dd9a-6f6d-469c-9282-f695a5690ffa`.
Do not publish build `858fff52-4a7d-4f3c-8d55-3b244fc25e15` (code 23).
