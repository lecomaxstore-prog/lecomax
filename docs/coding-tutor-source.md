# Source-aware private coding tutor

Open /admin/how-it-was-built#tutor, or choose a file in My files and select Explain with my AI tutor. Choose explanation, debugging or practice mode; Darija, Arabic, French and English remain available. Pick a line to focus the excerpt. A selected lesson supplies its file when no explicit file is selected.

The owner explicitly approved sending selected code excerpts to OpenAI on September 23, 2026. Only filtered library entries are read, after owner authentication and learning unlock. Excerpts are bounded to 120 lines and 12,000 characters, and secrets are checked again. Replies return source metadata and links. The snapshot describes deployment code, not live database contents or unsaved IDE edits.

Validation: 14 focused tests, TypeScript, focused lint, mobile browser file-to-tutor navigation, and a real GPT-6 Sol answer accurately citing app/page.tsx lines and product-loading imports. Production bundling includes the source catalog for the tutor endpoint.

Published successfully to https://lecomax.com: deployment dpl_4Bedpb8qRg2aVifvbQuspVixCTW4. Production build passed. The unauthenticated production tutor request returned HTTP 401 from middleware without source disclosure. Authenticated source-backed generation was verified locally with the real provider; production owner-session UI was not exercised.
