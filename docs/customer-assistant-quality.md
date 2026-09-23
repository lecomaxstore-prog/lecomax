# Customer assistant guidance

Website customer chat and the Expo shopping assistant use GPT-6 Sol with shared instructions in `lib/customer-assistant-policy.ts`. This is an application instruction and knowledge improvement, not a fine-tuned model or a training upload of customer conversations.

Answers use current commerce settings, active shipping zones, available payment methods and active entries from the admin `chat_knowledge_base` table. Both channels now receive that knowledge. Live settings and published return conditions take precedence over conflicting knowledge-base entries. Database errors do not become invented facts.

The published `/retours` page supplies the 30-day request window, eligibility restrictions, exclusions, and processing within 5–7 business days after receipt and validation. Update `PUBLISHED_RETURN_POLICY` together with that page whenever the business policy changes. The assistant must not promise unconditional refunds or free return postage.

The shopping intent extractor only classifies requests. Its free-form answer cannot bypass factual retrieval. Shopping replies preserve recent conversational context, retrieve gift suggestions from the catalog, and ask for missing comparison products. The Expo assistant directs customers to real support contacts instead of pretending to transfer them; website chat retains its existing handoff workflow.

Validation on September 23, 2026:

- 29 focused tests passed, covering both chat lifecycle and assistant/provider behavior.
- TypeScript and focused ESLint checks passed.
- Ten synthetic GPT-6 scenarios passed and their responses were reviewed: French return eligibility, English refund timing, conflicting shipping knowledge, city-only follow-up, Darija order tracking, human assistance, discount requests, refund-action requests, missing warranties and unavailable gift products.
- The evaluation uses fictional store prices and no customer records. Run `node --env-file=.env.local scripts/evaluate-customer-assistant.mjs`; it makes paid API requests. Pass a scenario ID to rerun one scenario after a full report exists.

These checks reduce known errors but do not guarantee every future response. Review anonymized examples of incorrect answers and add regression scenarios as needed. This backend change applies to existing website and Expo clients without another native build or OTA publication.

## Resumed quality work ? September 23, 2026

Product searches mentioning delivery, payment or warranty now remain catalog searches. Shared website/Expo guidance covers multi-part questions, verified arithmetic, combined budgets and missing compatibility specifications.

Verification: 27 focused tests passed, TypeScript passed, and all 13 live synthetic answer scenarios passed using GPT-6 Sol. The new cases cover product searches with secondary delivery, warranty and payment questions. These checks use synthetic facts and do not establish universal answer accuracy.

Production deployment: `dpl_3ER1oTJj8V9Vn3U2shA1nVbdPC6L`, ready and aliased to https://lecomax.com. Published from `release/assistant-quality-publish`, an archive of verified base `49f1722` plus assistant-only changes; unrelated course edits were excluded. Live `/api/assistant` (platform mobile_app) and website `/api/chat/message` both returned the expected 5?7 business days after receipt and validation. The synthetic website conversation was closed. Physical Expo-device UI receipt was not tested; its existing backend endpoint was verified. Focused ESLint and production build also passed.
