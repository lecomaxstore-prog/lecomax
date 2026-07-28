# Mobile professional audit — 2026-07-27

## Architecture

- Expo SDK 57, React Native 0.86, React 19.2, Hermes, and Expo Router typed routes.
- Zustand persists cart, wishlist, preferences, and customer profile state.
- React Query owns server state and persists the offline public catalogue.
- Supabase Auth sessions use Expo SecureStore on Android/iOS; the Next.js API at `https://lecomax.com` remains the commerce authority.
- Zod validates catalogue/release payloads and React Hook Form validates authentication and checkout input.
- EAS Build produces APK/AAB artifacts; EAS Update uses the `production` channel and app-version runtime policy.

## Prioritized findings

### Critical — resolved

1. The query persister previously wrote every successful query to AsyncStorage. This included `customer-orders`, which can contain personal order data. Persistence now uses an explicit public-data allowlist, rejects authenticated/private query keys, and uses a new cache buster to discard the legacy cache.
2. Saved names, emails, phone numbers, and addresses were stored in plain AsyncStorage. Native profile persistence now uses SecureStore and migrates/removes the legacy value on first read. Push tokens use the same encrypted storage boundary.

### High priority — resolved

1. All tablet layouts were capped to a 480 px phone shell. The viewport now uses safe tablet gutters up to 960 px, exposes a tablet breakpoint, switches primary tabs to a side rail, and renders product grids at two, three, or four columns.
2. Products/promotions were polled every minute while Supabase Realtime and foreground invalidation independently refreshed the same data. Polling and unconditional five-query foreground invalidation were removed. React Query focus handling now refreshes only active stale queries; Realtime remains the immediate catalogue invalidation source.
3. The product screen mounted both `useProduct` and `useProducts`; `useProduct` fetched the complete catalogue again. It now derives the selected product from the shared products query.
4. Importing the root Inter and vector-icon entry points caused production exports to include unused font families/weights. Imports now reference five exact Inter weights and Ionicons directly.

### Medium priority — addressed or monitored

- Catalog FlatList rendering now adapts its batch/window size to the number of columns and clips off-screen Android rows.
- Existing global route error boundary, API timeouts/retries/cancellation, offline snapshot, SecureStore session handling, persisted cart/wishlist, Android back policy, update gates, form schemas, minification, and resource shrinking were retained and revalidated.
- Large checkout, cart, account, wishlist, and product modules remain candidates for future internal extraction. They are type-safe and working; splitting them without feature-level device automation would add regression risk without an immediate customer benefit.

### Optional/external work

- Add an authenticated crash-reporting/analytics provider only after its organization/project secrets and privacy consent policy are available.
- Add Maestro/Detox device automation for real login, password reset, camera scanning, PayPal return, notification delivery, and OS-level deep links. These flows require test accounts, payment sandbox credentials, emulators/physical devices, and push credentials.
- Verify VoiceOver/TalkBack and very large dynamic type on physical iPhone/iPad/Android devices; static interaction auditing cannot replace assistive-technology QA.
- The public APK currently redirects to an Expo artifact that expires on 2026-08-26 because the Supabase project rejected the 135 MB upload. Increase the storage plan/limit or configure durable object/GitHub Release hosting before that date.
- Apply and verify the repository's pending production Supabase migrations through the reviewed migration workflow.

## Verification baseline

- TypeScript: passed.
- Expo ESLint: passed with zero warnings.
- Node tests: 34 passed before changes.
- Admin API contract audit: 178 client calls / 137 routes, zero failures.
- Mobile secret audit: zero findings.
- Mobile interaction audit: 19 screens / 181 controls, zero errors or warnings.
- npm production dependency audit: zero known vulnerabilities.
- Android and iOS Hermes production exports: passed.
- Expo Doctor: 18/20. Its two Git-ignore findings are false positives caused by the untracked `mobile/` tree; `git check-ignore` confirms both `mobile/.expo/` and `mobile/.env.local` are ignored.

## Release commands

```powershell
cd mobile
npm ci
npm run typecheck
npm run lint
npx expo-doctor --verbose
npx expo export --platform android
npx expo export --platform ios
npm run android:apk
npm run android:aab
```

iOS/App Store builds require an Apple Developer team and EAS iOS credentials:

```powershell
cd mobile
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production
```

The EAS production environment now contains `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `app.config.ts` fails production builds when HTTPS API or Supabase public client configuration is absent. The EAS project ID remains part of public app configuration. Service-role keys, payment secrets, signing credentials, and admin tokens must never be placed in the mobile environment.
