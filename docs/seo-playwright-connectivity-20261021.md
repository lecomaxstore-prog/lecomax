# Playwright MCP connectivity and staging acceptance

Staging **NO-GO**. Production **NO-GO**. This is a connectivity repair, not browser acceptance.

## Observed and repaired

- The current conversation exposes no Playwright MCP browser tools: no navigate, resize, console or network tools. A generic Node REPL mentioning Playwright is not an MCP connection.
- User configuration `C:/Users/Ziko/.codex/config.toml` had an enabled Playwright entry with `command = "npx.cdm"`. That executable did not resolve; `npx.cmd` resolves to the installed Node.js launcher.
- Corrected only that command typo to `npx.cmd`. Arguments remain `-y @playwright/mcp@latest`; other configuration is preserved.
- Outside the restricted sandbox, `codex.cmd mcp get playwright` confirms enabled STDIO configuration with the corrected command, and `npx.cmd -y @playwright/mcp@latest --version` exits 0 with version **0.0.83**. This validates configuration and executable startup, not an MCP handshake or browser connection.
- Restricted attempts were inconclusive: the CLI reported no matching server; npm registry access failed EACCES. The PowerShell CLI shim was blocked by execution policy, so the existing `.cmd` launcher was used without changing execution policy.
- The tool catalog still contained zero Playwright browser tools after repair. No staging navigation, screenshots, responsive, hydration, console, network or rendered SEO checks ran in this continuation.

## Recovery action

Restart/reload the Codex host and start a new session so it can initialize the corrected MCP server. Verify Playwright browser tools are actually listed before acceptance begins. If startup still fails, inspect its MCP startup error; do not equate `enabled` or a successful version command with connectivity.

The official configuration reference describes the STDIO `command` and the active-server `/mcp` view in the CLI TUI: https://developers.openai.com/codex/mcp . Restart is the next diagnostic action; successful reconnection has not yet been observed.

## Resume browser acceptance

Read `docs/seo-owner-continuation-20261021.md`, `docs/seo-final-staging-acceptance-20261021.md` and `operations/seo/final-staging-acceptance-20261021.json`. Existing successful local/HTTP/build/database evidence remains historical; no reason was found to repeat it during this tooling repair.

1. Navigate to https://lecomax-seo-staging.vercel.app through Playwright. If Vercel Authentication appears, use its normal authorized sign-in flow with owner participation as necessary. Never inject bypass headers, mint automation credentials, copy browser cookies, or disable protection.
2. Record desktop 1440x900 and mobile 375x812 / 390x844 screenshots and horizontal-overflow checks. Exercise menus and product/category links using observed page URLs; preserve real hosted data.
3. Capture console errors, page exceptions, failed requests and relevant HTTP failures from before navigation. Separate Vercel login failures from application failures. Check hydration after client navigation, not just SSR HTML.
4. Verify homepage, product/category views, French/Arabic fixture rendering, document title/description, production canonical URLs and parseable JSON-LD. Inspect robots, sitemap index and linked shards. Do not infer Arabic route/hreflang coverage from bilingual stored text.
5. Check read-only admin navigation and existing session behavior. Hosted editorial synchronization, saves, publish/rollback and other writes remain unapproved. Do not claim their gate closed by browser reads.
6. Record exact deployment, UTC time, viewport, route and outcome; append a linked Change History report. Stop on authentication or tool failures rather than treating unexecuted checks as passed.

No application logic, production data, hosting settings, databases, deployment protection or Git history changed. No deployment, push, migration or hosted editorial write occurred. No current preview is certified.
