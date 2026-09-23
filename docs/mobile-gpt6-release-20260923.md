# Expo assistant release checkpoint — September 23, 2026

- GitHub main: `49f1722` (release checkout: `release/source-library-publish`).
- The Expo shopping assistant calls `/api/assistant` with `platform: mobile_app`; the deployed backend uses server-side `gpt-6-sol`. A direct provider test returned `model: gpt-6-sol`, `status: completed`. The live mobile endpoint returned HTTP 200 and a budget clarification.
- The mobile fix sends the last 29 messages, preserving recent product context and avoiding the backend's 30-message rejection on longer chats. The displayed conversation stays intact.
- Validation in the release checkout: 15 focused tests passed, mobile TypeScript passed, focused mobile ESLint passed, Android Hermes export succeeded at `mobile/dist-assistant-release`.
- Vercel deployment: `dpl_Eco3PU3dEsUpXL2Dz8ei9vqjY4bE` / `https://lecomax-6zqah2new-lecomaxstore-4321s-projects.vercel.app`; verified Ready and aliased to `lecomax.com`.

## Expo publication completed

After the user signed in as `lecomax`, both Android updates were published to the production channel of `lecomaxs-team/lecomax` (project `298c2ed9-078f-4c41-b46f-282c17e1e532`).

- Android 1.0.8: update group `23663364-f751-4656-bbac-47c5c1503b87`; update `01a0ce4b-3951-72f8-b601-ef4b218e584f`; source `49f1722` in `release/source-library-publish`.
- Android 1.0.7: update group `6cb96e77-52a8-47fc-9d4a-7ab586fd5dc1`; update `01a0ce4c-66b4-7a1a-a7b6-d3546aa6ad1c`; source `6189fe3` in `release/product-polish-publish`, based on its existing `b4e00fe` release plus the assistant-only backport. Saved to GitHub branch `release/expo-assistant-1.0.7-20260923`.
- Both exports and publications succeeded with the EAS production environment. Public Expo manifest requests for both runtimes returned HTTP 200 and the expected new update IDs.
- Backport tests and mobile TypeScript passed. Native versions and dependencies were preserved. No new APK/AAB or iOS release was created.
- Users on these production Android versions should reopen the app online and choose Restart when the downloaded-update prompt appears. Physical-device receipt remains unverified.

The root checkout contains older unrelated differences; the verified release checkout includes an existing assistant retrieval import correction and account-screen TypeScript fix absent in the root checkout. Avoid overwriting the release checkout wholesale with root files.
