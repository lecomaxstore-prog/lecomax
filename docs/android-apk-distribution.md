# Android APK distribution

## Architecture

L’ecomax keeps the existing repository layout to avoid destabilizing production:

- `app/`, `components/`, and `lib/`: Next.js website, admin dashboard, APIs, and shared server utilities.
- `mobile/`: Expo 57 React Native application using Continuous Native Generation.
- `supabase/migrations/`: database, RLS, storage, and server-function migrations.
- `scripts/`: web validation and security tools.
- `.github/workflows/android-release.yml`: reproducible signed Android CI release.

Supabase Storage bucket `app-releases` is private. Administrators receive a short-lived signed upload token; the browser uploads directly to storage. The server then streams the object, validates its APK/ZIP signature, confirms its size, calculates SHA-256, and creates an unpublished database record. Public downloads are proxied through the clean versioned route only when the release is published.

## Security model

- Upload/list/update/delete endpoints use the existing HMAC admin session, same-origin mutation checks, server-side validation, and rate limiting.
- APK uploads are limited to 150 MB, `.apk`, accepted APK MIME types, sanitized server-generated paths, and ZIP/APK magic bytes.
- Version name and version code are unique. One partial database index allows only one published Android release.
- Publishing/rollback is atomic through `publish_android_release`.
- Storage has no anonymous upload, update, list, or delete access.
- Private storage URLs never enter public release metadata.
- Download responses use the APK MIME type, attachment disposition, immutable caching, range requests, `nosniff`, and a checksum header.
- The in-app updater only opens a URL on the configured official API host over HTTPS. It never installs silently.
- Signing credentials and build output are ignored by Git.

## Database setup

Apply:

```text
supabase/migrations/20260726160000_android_app_releases.sql
```

This creates:

- `app_releases`
- `app_release_audit`
- private `app-releases` storage bucket
- atomic publish/rollback function
- atomic download counter function

Apply migrations through the reviewed production migration workflow. Never paste a service-role key into a browser or mobile environment.

## Generate and protect the signing keystore

Create the key once on a trusted offline workstation:

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore lecomax-release.keystore -alias lecomax -keyalg RSA -keysize 4096 -validity 10000
```

Back up the keystore and passwords in an encrypted password manager/offline vault. Losing this key prevents existing users from installing future updates over the current app. Never email it, place it in the repository, or store it in a shared unencrypted folder.

For EAS-managed manual builds:

```powershell
cd mobile
npx eas credentials --platform android
```

Choose the production profile and upload the existing keystore. EAS signs release output with that credential; debug signing is not used by the production profiles.

## GitHub Secrets

Configure these repository Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_CERT_SHA256`
- `EXPO_TOKEN`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

Encode the binary keystore without line breaks.

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("lecomax-release.keystore")) | Set-Clipboard
```

Linux:

```bash
base64 -w 0 lecomax-release.keystore
```

The workflow reconstructs the key under `mobile/.credentials/`, writes a temporary ignored `credentials.json`, runs validation, builds both formats, calculates checksums, and uploads only artifacts.

## Versioning

Use semantic versions and a strictly increasing positive Android version code:

```powershell
cd mobile
npm run android:version -- 1.0.1 2
```

This updates:

- Expo `version` / Android `versionCode`
- iOS build number for cross-platform consistency
- mobile package version
- `mobile/release.config.json`
- expected APK filename

The command refuses duplicate or decreasing local version codes. Manual EAS production profiles also use remote version management with automatic increments. Before tagging, confirm the committed local code is the intended release code:

```powershell
node scripts/verify-release-version.mjs v1.0.1
```

## Manual release build

Install and authenticate EAS, then:

```powershell
cd mobile
npm ci
npm run lint
npm run typecheck
npm run android:apk
npm run android:aab
```

`android:apk` creates a signed installable universal APK through the `production-apk` profile. `android:aab` creates a signed AAB through `production`.

After downloading an EAS artifact, normalize its name and calculate metadata:

```powershell
npm run android:verify-signature -- C:\path\to\downloaded-build.apk
npm run android:artifact -- C:\path\to\downloaded-build.apk
```

Output:

```text
release/android/lecomax-v1.0.1.apk
release/android/lecomax-v1.0.1.apk.sha256
release/android/lecomax-v1.0.1.apk.json
```

The same command accepts AAB files.

## GitHub Actions release

Run “Android signed release” manually, or push a matching tag:

```powershell
git tag v1.0.1
git push origin v1.0.1
```

CI:

1. installs locked web/mobile dependencies;
2. runs tests, TypeScript, builds, mobile lint, and interaction audit;
3. checks version consistency;
4. reconstructs temporary signing credentials;
5. builds signed APK and AAB;
6. validates the archive and generates SHA-256;
7. uploads Actions artifacts;
8. creates a GitHub Release only for a matching version tag.

A failed validation/build never publishes a release.

## Publish through the admin dashboard

1. Install the generated APK on a clean Android device.
2. Verify the signing certificate, then test login, catalogue, cart, checkout, PayPal/COD, deep links, notifications, and updater.
3. Open `/admin/app-releases`.
4. Enter the same version name/code, minimum Android version, release notes, and required/optional policy.
5. Select the signed `.apk`.
6. Wait for upload, server size verification, APK signature check, and SHA-256 calculation.
7. Review checksum and file size.
8. Click **Publier** only after device verification.

The public API becomes:

```text
GET https://lecomax.com/api/app-releases/android/latest
```

The download URL is:

```text
https://lecomax.com/downloads/lecomax-v1.0.1.apk
```

## Website download behavior

`/download` dynamically loads the published release. It displays version, exact file size, release date, Android minimum, checksum, changelog, installation instructions, iPhone guidance, security information, and FAQ.

The button performs a HEAD availability check and then starts the attachment download. Desktop browsers may download the APK; device detection only changes guidance.

Technical checksum verification:

PowerShell:

```powershell
Get-FileHash .\lecomax-v1.0.1.apk -Algorithm SHA256
```

Linux/macOS:

```bash
shasum -a 256 lecomax-v1.0.1.apk
```

## In-app update checking

On Android startup, the app:

1. reads `Application.nativeBuildVersion`;
2. fetches the official latest-release API;
3. compares integer version codes;
4. validates all returned metadata with Zod;
5. verifies the download hostname/protocol;
6. displays release notes and size;
7. permits “Later” only for optional updates.

Optional dismissal is stored locally for 24 hours and suppressed for the active session. Required updates ignore dismissal. Network/API failures never block an otherwise current application.

## Rollback and removal

- **Restore** publishes an older verified release atomically and unpublishes the current release.
- **Unpublish** removes the public metadata/download immediately without deleting the file.
- Only unpublished releases can be deleted.
- Publish, rollback, unpublish, update, create, and delete actions are audited.

Before rolling back, confirm that the older API contract remains compatible with the current backend.

## Release checklist

- Version name/code updated and internally consistent.
- Release notes reviewed.
- Production API URL is `https://lecomax.com`.
- Release APK is signed with the long-lived production key.
- R8/minification and resource shrinking build succeeds.
- APK installs over the previous production APK without signature errors.
- Core shopping and payment flows pass on a physical Android device.
- SHA-256 matches CI/local artifact metadata.
- Admin upload verification succeeds.
- Public download HEAD/GET succeeds over HTTPS.
- Update modal is tested for optional and required releases.
- No environment, credentials, native build directories, APK/AAB, or keystore is staged in Git.

## Troubleshooting

### “App not installed” during update

The new APK was probably signed with a different keystore, has a lower/equal version code, or is incompatible with the device. Verify the signing certificate and increment version code.

### Admin upload succeeds but finalization fails

Confirm the file is a real signed APK, its browser-reported size is unchanged, it is under 150 MB, and the server can read the private storage object. A failed signature/size check is never published.

### No update modal

Confirm the release is published, its version code exceeds `nativeBuildVersion`, the device is Android, and optional dismissal is older than 24 hours.

### Download returns 404

Only the currently published release filename is downloadable. Check `/api/app-releases/android/latest` and publish/restore the intended version.

### CI signing failure

Recheck all six GitHub Secrets. Ensure the Base64 value contains only the binary keystore encoding and that alias/passwords match the key. Do not print secret values in logs.
