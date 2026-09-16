# L’ecomax

Production e-commerce platform with a Next.js 15 website/admin/API, Supabase backend, and an Expo 57 React Native application.

## Development

```powershell
npm ci
npm run dev
```

The website runs at `http://localhost:3000`. For the mobile application:

```powershell
cd mobile
npm ci
npm start
```

Copy `.env.example` and `mobile/.env.example` to local environment files and provide your own values. Never commit environment files or signing credentials.

## Validation

```powershell
npm test
npx tsc --noEmit
npm run build
npm run audit:admin-api
npm run audit:mobile-interactions
cd mobile
npm run lint
npm run typecheck
npx expo export --platform web
```

## Android distribution

The official Android download page is `/download`. Published APKs are stored privately in Supabase Storage and served through versioned URLs such as:

```text
https://lecomax.com/downloads/lecomax-v1.0.0.apk
```

Release management is available at `/admin/app-releases`. Full signing, CI, upload, rollback, checksum, and troubleshooting instructions are in [docs/android-apk-distribution.md](docs/android-apk-distribution.md).

Common commands:

```powershell
cd mobile
npm run android:version -- 1.0.1 2
npm run android:apk
npm run android:aab
```

Android signing keys, passwords, `credentials.json`, generated native projects, APK/AAB files, and release output are excluded from Git.
