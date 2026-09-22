# Enable the private learning section

The owner must already be signed in. This section additionally requires a private access code configured on the server.

1. Choose a unique private code of at least 4 characters. Letters, numbers and symbols are accepted. Save it in your password manager.
2. For local development, set `HOW_BUILT_PIN` in `.env.local`, then restart the development server. Do not commit this file.
3. For the live site, set `HOW_BUILT_PIN` in the hosting project's server environment for the appropriate deployment environment. Deploy the code fix and ensure the new deployment uses the variable.
4. Sign in with the configured owner account, open `/admin/how-it-was-built`, and enter your private code.

Do not use a `NEXT_PUBLIC_` prefix and do not put the actual code in this document or chat. The signed access cookie lasts 8 hours. A missing or short configuration now shows a readable setup message immediately, without consuming failed-code attempts.

The form and server both accept codes of at least four characters, including letters, numbers and symbols. Owner authorization and failed-attempt limits remain in place.
