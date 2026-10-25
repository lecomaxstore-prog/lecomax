# Offline editorial quality refinement

This continues the two completed paid comparison calls. No further paid requests or token-count/model-access calls were made. The saved responses, usage ledger and previous candidates remain intact. Evaluation uses the complete saved Sol/Astra outputs and source evidence plus explicitly hand-authored local shoe, bottle and charger examples. These fixtures are not model outputs from the revised prompt.

## Prompt and validation changes

Editorial revision 3 selects `gpt-6.1-sol` provisionally for ordinary editorial work and retains `gpt-6-astra` as optional premium review. Luna remains available. Existing revision 2 jobs retain their original prompts, model IDs and approval records; legacy routine Luna/advanced Sol phrase-selection is unchanged. The prepared v3 enqueue RPC uses a new source/version fingerprint and therefore never replaces or silently reinterprets an existing saved draft.

French guidance now leads with product category, identity and useful supported distinctions. It discourages generic openings, redundant conclusions, isolated feature keywords, keyword stuffing and forced city/Maroc repetition. Morocco is the readership, not evidence of local manufacture, availability or delivery.

Arabic guidance translates descriptive catalogue headings instead of inserting an entire French heading. Explicit brand/model identities remain verbatim; known technical standards such as USB-C may remain when present in the source. Arabic prose is checked per field and keyword so a short French field cannot hide inside a larger Arabic paragraph. The original source name is displayed separately for Admin review. Unusual proper names must be explicitly represented as brand/model identity; ambiguous unstructured catalogue names can require source cleanup and human review.

Hard title and meta limits remain 20–65 and 110–160 Unicode code points, with NFC normalization, whitespace/padding checks and rejection of invisible direction controls. Preferred 30–60 and 110–155 ranges produce review warnings rather than promises about Google display. Product copy remains 180–900 characters for storage compatibility. Sparse source material is flagged: do not invent or pad facts to satisfy the minimum; enrich the source before a later generation.

Factual checks cover known bilingual material/feature concepts, unsupported numbers, normalized Arabic/Persian digits, known numeric-unit pairs and evidence mismatches. These checks do not prove semantic entailment or detect every negation/attribute swap. Negated source language and numerical claims always merit review. Descriptions are checked against the supplied cross-product corpus using normalized exact and token-overlap comparisons; repeated sentences, consecutive repeated phrases and reordered duplicate keywords are rejected. This is not web-wide plagiarism detection. Missing corpus coverage is explicit.

The longer v3 prompt has not been counted by OpenAI. The existing strict schema, 2,000 output-token cap, exact pre-request input count plus 256-token margin, reservation and no-retry/no-escalation safeguards remain. V3 budget checks reject non-finite allowances. Current worker generation timeout remains nine seconds; the historical comparison took approximately 20/17 seconds with a longer isolated timeout. Worker latency suitability remains unresolved and must be tested deliberately before activation.

## Admin review preparation

The UI shows the saved source, bilingual draft, source evidence, title/meta lengths and quality review notices. Reviewers acknowledge factual accuracy, French, Arabic and cross-product duplicates and supply notes. Actions are **approve review without publishing** or **request corrections**. An approval with hard quality failures is refused. Source, job ownership within the selected product and document version are checked; the storage RPC compares the result snapshot again before appending a decision. Reviewer identity comes from the authenticated server session.

Prepared migration `202610190003_seo_editorial_review.sql` adds immutable review snapshots, notes, actor, source, result and document version. It revokes the old editorial claim entry point so old workers cannot consume v3 jobs; the new worker dispatches old v2 jobs to their old implementation. This file was not executed, including against a local database, in accordance with the task restriction. Apply nothing from this document without separate approval. SQL runtime/concurrency and privilege behavior therefore remain unverified.

Both the API and existing database approval function block editorial publication, including after review approval. No editorial review writes product content or published metadata. Legacy non-editorial approval behavior remains available. The new dashboard/review RPCs require the prepared migration; an environment without it fails closed with a storage-unavailable message. A future reviewed publication implementation must consume the latest matching approval, recheck source/version and quality, and separately authorize publication. A review decision alone must never activate it.

## Evaluation and boundaries

`node scripts/evaluate-seo-quality-offline.mjs` writes timestamped evaluations and a prompt snapshot without loading credentials or a provider. Both historical outputs now fail only the new Arabic French-heading rule; their earlier passing assessments remain unchanged. Their generic phrasing/register and broad feature keywords appear as review warnings. Three hand-authored representative fixtures pass the hard checks. No improvement in actual generated v3 content, search rankings or native-speaker acceptance is claimed.

Validation evidence is in `artifacts/seo-quality/` and the linked append-only Change History reports. Focused tests deliberately exclude SQL suites because those execute migrations. The production build uses a new isolated copy of the preserved premium candidate, overlays the changed Admin/API and pure validation modules, strips environment files and passes placeholder credentials with all SEO activation flags disabled. It is a local production-mode build, not a deployment. Existing Google Fonts downloads may require public network access; no AI key is available to the build.

Before any future activation, reconcile the known comparison spend with the deployment budget ledger: comparison usage estimate USD 0.058788 (conservative retained estimate USD 0.060495), plus prior Luna usage USD 0.0002453. The old prepared budget migration includes only the earlier Luna allowance. Do not infer a current shared-account balance from these local records.

Next approval: permission to test the prepared migration and review persistence in an isolated disposable database, without production access. A later v3 model trial requires fresh, explicitly bounded paid authorization; the completed Sol/Astra comparison authorization must not be reused. Production migration, deployment, publication and scheduled-worker activation each remain outside this task.

Reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Schema conformance is separate from factual and language correctness.
