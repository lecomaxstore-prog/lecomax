# OpenAI for L'ecomax

Website customer chat (`/api/chat/message`) and the Expo shopping assistant (`/api/assistant`) use the same server-only OpenAI connection. The existing Expo app already calls this API at its configured L'ecomax server URL; no API key or new native binary is needed for the provider change.

The owner has a private **AI tutor / Tuteur IA** in **How it was built**, including on mobile browsers, at `/admin/how-it-was-built#tutor`. It explains coding and daily lessons in French, English or Arabic. Both the owner session and learning-section unlock are required. The public customer assistant does not grant access to this tutor.

Set `OPENAI_API_KEY` in `.env.local` and Vercel Production. The default model is `gpt-6-sol`, using `reasoning.effort: "none"` to preserve responsive customer chat; `OPENAI_MODEL` can override it with a Responses-compatible text model. Never use `NEXT_PUBLIC_` or `EXPO_PUBLIC_` for a provider key. Model access does not imply an available credit balance: an actual generation must succeed.

Customer assistance tries OpenAI first. If it fails and `GROQ_API_KEY` is configured, it uses the existing Groq service so shoppers can still get help. The tutor uses OpenAI only and reports configuration, billing or temporary availability failures. No billing changes or automatic top-ups are performed by the application.

Requests have timeouts and bounded output. Tutor requests require authentication, same-origin mutation checks and rate limits. OpenAI Responses use `store: false`; this disables response storage, not all provider retention. Questions, recent chat messages, and the chosen lesson context are sent to OpenAI. With the owner-approved source connection, the tutor sends a bounded excerpt (up to 120 lines and 12,000 characters) of the selected library file or selected lesson file to OpenAI. It uses the filtered deployment source snapshot, excludes private paths and detected credentials, and returns file/line references. It cannot read customer records, edit files or execute code. Conversations remain in the tutor component's memory until leaving or clearing it.

Existing human-agent handoff in website chat is preserved. Store facts and product recommendations still come from the server catalog and store configuration. Admin email drafts, WhatsApp, broadcasts and product translation retain their existing provider configuration; this integration does not automatically change those channels.

Verification: `node --test tests/openai-integration.test.ts tests/chat-api.test.ts`, the full `npm test`, and a production build. With funded API access, open the tutor as the unlocked owner and ask one test question. Check the website chat and Expo assistant independently. API billing is managed at https://platform.openai.com/settings/organization/billing/overview.

API reference: https://developers.openai.com/api/docs/quickstart.
