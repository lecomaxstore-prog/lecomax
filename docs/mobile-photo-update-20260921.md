# Android photo upload live update

Published September 21, 2026 to Expo production, Android runtime `1.0.7`.

- Update group: `eee1375c-6fc2-4823-9457-13a4e7ef4ba0`
- Android update: `01a0c575-f7c4-7b44-8f11-2592bf83ae56`
- Dashboard: https://expo.dev/accounts/lecomaxs-team/projects/lecomax/updates/eee1375c-6fc2-4823-9457-13a4e7ef4ba0
- Release source: `release/google-signup-publish`, baseline `c135cf9`, plus profile/support upload corrections and upload helpers.
- Previous production group: `daa711f6-15df-472a-82ea-aa20dbd2931c`.

Native uploads now supply an Expo File with readable bytes instead of the legacy URI-only multipart object rejected by Expo fetch. Browser uploads retain their selected File. The existing Google callback fix is preserved.

Validation: four upload tests passed in the release directory, including the installed Expo FormData patch and multipart encoder through the authenticated API client; mobile TypeScript passed; Android export and EAS publication succeeded. The existing 1.0.7 Android bundle contains FileSystemFile and the release lockfile already includes expo-file-system 57.0.1.

Reopen the installed 1.0.7 production app online, wait for the downloaded-update prompt, and tap Restart. Then retry the profile photo. Physical-device upload remains to be confirmed. This publication does not add Firebase native configuration or apply notification database migrations.
