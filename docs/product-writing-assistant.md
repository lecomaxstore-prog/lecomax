# Product writing assistant

## Paste with GPT-6.1 Sol

The **Coller les informations de ChatGPT** section also accepts free-form notes. Click **Analyser avec GPT-6.1 Sol**, review the detected fields, then apply the selected ones. **Détecter sans IA** remains available for structured text and JSON without an API request.

This extraction feature pins `gpt-6.1-sol` through the Responses API with low reasoning and strict structured output, as supported by the [official model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol). It uses the server's existing `OPENAI_API_KEY`; it does not change the model used by other assistants. Model access and API billing are required. The server checks extracted values against the pasted source and validates field formats. This does not guarantee semantic correctness: review the associations before applying them. Photos and variants still use their existing form sections.

The endpoint `/api/admin/products/parse` uses existing admin authorization, same-origin checks, a 10-per-minute rate limit and bounded inputs. It does not save a product. Editing the pasted text cancels the pending UI request and prevents a stale result from being applied. Provider work may already have started, so cancellation does not guarantee avoiding API usage.

Run `node --test tests/product-paste.test.ts tests/product-paste-interaction.test.ts tests/product-paste-ai.test.ts` for local checks. The optional `TEST_PRODUCT_PASTE_AI_LIVE=1` test makes a real request with synthetic facts. Live name/price/stock extraction was verified; authenticated browser end-to-end verification remains outstanding.

## Generate product copy

In **Admin → Products → Create/edit → General information**, open **Assistant de rédaction** above the description field.

1. Fill in the product name, brand and known characteristics, or enter facts in the assistant.
2. Choose a writing style and click **Générer ma fiche**.
3. Review the French name, description and tags. Apply each desired field separately.
4. Edit the applied text if needed, then save the product normally. Existing product URLs are preserved; applying a name to a new product also fills its slug.

Only supplied facts should be used, but generated copy still needs human review. No automatic stock, price, image, product creation or publication changes occur. Applying a suggestion replaces the indicated form field.

## Server configuration

The assistant uses the existing `OPENAI_API_KEY` and optional `OPENAI_MODEL` server environment variables through `lib/openai-server.ts`. Never put the key in a `NEXT_PUBLIC_` variable or in the product form. Restart the server after environment changes. Local key presence and a synthetic live generation were verified during implementation; deployment environments need their own configuration.

The protected POST endpoint `/api/admin/products/write` uses existing admin authorization, same-origin checks and a rate limit of 10 requests per minute per rate-limit identity. Product facts are sent to OpenAI only when Generate is clicked. Responses are requested with `store: false`; generation uses the API account's billing.

The integration follows the [official OpenAI JSON output documentation](https://developers.openai.com/api/docs/guides/structured-outputs). The existing helper uses JSON mode, so the route explicitly requests JSON in the input message and validates all returned fields before showing a draft. UI output is rendered as text, never injected HTML.

## Checks

`node --test tests/product-writing.test.ts` runs local route and interaction tests without external API calls. Setting `TEST_PRODUCT_WRITING_LIVE=1` additionally runs a real OpenAI request using synthetic product facts and the locally configured key. That optional check incurs API usage. Browser layout and authenticated end-to-end behavior still need verification in a connected browser.
