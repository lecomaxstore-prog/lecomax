# Lecomax store readiness — 25 September 2026

Release source: `c77a2be1817f515fa7fe943d0343cb09de7812df`, checkout `release/all-updates-publish-20260925`. This supersedes the old 1.0.3 status in this folder. Store submission is not complete.

## Published live update

Android production runtime 1.0.8: group `facdd096-7607-472a-bb5f-c3494e06ea48`, update `01a0d91c-5cbd-7ca1-8f17-ff0203561134`. Public Expo manifest returned HTTP 200 with this exact update ID. Customers reopen online and accept Restart. Receipt on a physical device has not been verified. Older native runtimes must install a compatible new APK; do not relabel the 1.0.8 bundle for older runtimes.

## Release identity

- Expo team/project: `lecomaxs-team/lecomax`.
- Android/iOS identifier: `com.lecomax.app`.
- New binary version: 1.0.9. APK requested with remote Android code 30; Google Play AAB uses its own incremented code. Verify final build metadata before publication.
- Android signing certificate SHA-256 verified from published 1.0.8: `51f233faeb765420c14d8b74d168ba42ff7406bb3d484372c34ec005af35308b`.
- Website: https://lecomax.com/download
- Privacy: https://lecomax.com/politique-confidentialite/
- Support: https://lecomax.com/nous-contacter/
- Account deletion information: https://lecomax.com/suppression-compte/

## Validation this session

- Mobile TypeScript passed.
- Mobile ESLint: zero errors, one existing React effect dependency warning in auth.tsx.
- 22 focused mobile and release tests passed.
- Android production Hermes export and Expo publication succeeded.
- iOS Hermes export passed; this is not a signed IPA.
- Source and Android export secrets scan passed (286 files).
- Interaction audit: 241 controls, zero errors, 17 accessibility-label warnings to review on devices.
- Public privacy, support and deletion pages returned HTTP 200.
- No real purchase, customer deletion, or fabricated review was performed.

## Remaining submission requirements

1. **Apple signing:** EAS production iOS build stopped with “Credentials are not set up.” The owner must connect an enrolled Apple Developer team and configure a distribution certificate and provisioning profile. No IPA was generated. The attempt incremented the remote iOS build number from 12 to 13.
2. **iOS login:** the app offers Google login without an equivalent privacy-preserving login option. Implement and configure Sign in with Apple, or decide on an email-only iOS login experience before submission. See Apple guideline 4.8: https://developer.apple.com/app-store/review/guidelines/#login-services
3. **Public reviews:** verify content filtering, reporting, handling of abusive users, and response operations. No report/block controls were found in the mobile product review component. See Apple guideline 1.2: https://developer.apple.com/app-store/review/guidelines/#user-generated-content
4. **AI privacy:** assistant conversations go to the server, which uses OpenAI. No explicit AI data-sharing consent was found on the mobile assistant screen. Review disclosure and consent before sharing personal data with third-party AI; include this processing in both stores' privacy declarations. See Apple guideline 5.1.2: https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing
5. **Deletion operations:** the app submits a pending deletion request; it does not immediately delete the account. Verify end-to-end processing, retention rules, and a communicated completion timeframe using a designated test account.
6. **Owner declarations:** complete Data safety, App Privacy, age rating, export compliance, developer identity, review contact, and review access using actual business facts. Existing questionnaires are drafts, not completed attestations.
7. **Store media:** real phone/tablet and iPhone/iPad screenshots are still missing from the store asset directories. Do not use design previews as evidence of native device testing.
8. **Domain association:** both /.well-known/assetlinks.json and /.well-known/apple-app-site-association returned HTTP 404. Publish the Android signing fingerprint and the verified Apple Team ID association before claiming verified HTTPS app links.
9. **Device testing:** install the signed release, verify login, checkout, notifications, deep links, photo uploads, deletion, accessibility, and update installation. Upload the AAB to internal testing and the IPA to TestFlight before requesting public review.

Current platform references: https://docs.expo.dev/versions/v57.0.0/ ; https://support.google.com/googleplay/android-developer/answer/11926878 ; https://developer.apple.com/news/upcoming-requirements/

## Store release notes

Amélioration du catalogue, de la recherche et des fiches produits. Galerie photo et navigation améliorées. Assistant shopping et saisie des messages améliorés. Corrections de fiabilité du compte et du parcours de commande.

## Build tracking

- APK 1.0.9 (30): https://expo.dev/accounts/lecomaxs-team/projects/lecomax/builds/4511f371-153b-4d47-85de-8efdbdfe678a
- Google Play AAB 1.0.9 (31): https://expo.dev/accounts/lecomaxs-team/projects/lecomax/builds/d33e47a9-035b-4b57-9063-3fda743a3de3
