# Playwright MCP pinned launcher recovery

Recorded: 2026-10-21T11:28:04.184Z

MCP startup: **GO in fresh Codex hosts**. Protected staging acceptance: **NO-GO pending authorized Vercel login**. Production: **NO-GO; unchanged**.

## Diagnosis and evidence

The original host logs prove approximately 30-second initialization timeouts on 2026-10-21 at 11:17:19Z and 11:17:40Z, followed by omission of the unready client. The precise underlying cause cannot be established retrospectively: both original and repaired launchers now pass in fresh hosts. Do not label the original failure a proven npm download, package resolution, browser dependency or transport defect.

- Node 26.7.0 and npm 11.17.0 are installed. The package requires Node >=18 and its Playwright dependency >=20.
- Original npm logs show registry HTTP 200 in 172/257 ms. Cached MCP 0.0.83 exists. Isolated exact installation completed in two seconds, with registry integrity hashes in its package-lock.json. No browser download was needed.
- Direct cached entrypoint: initialize and tools/list completed in 5,094 ms. Newly installed entrypoint: initialization 348 ms, tools/list 353 ms, 25 tools, no stderr.
- Direct npm JavaScript entrypoint: tools/list 1,916 ms. Correct Windows shell invocation of npx.cmd: 1,534 ms. Package resolution succeeds.
- IMPORTANT correction to the preparation report: the first diagnostic cmd.exe wrapper emitted a syntax error and timed out. A correctly constructed shell wrapper passes. That diagnostic harness failure does NOT establish the cause of the original Codex timeout. All evidence is preserved.
- Fresh standalone Codex 0.163.0 ephemeral thread: repaired launcher ready in 259 ms (MCP starting-to-ready); 25 tools, toolsError null. Original launcher also passes in a separate fresh thread.
- Fresh actual VS Code extension executable (openai.chatgpt-26.1007.21434-win32-x64): original launcher ready in 1,485 ms; repaired launcher ready in 217 ms. Both expose 25 tools. No model turns were started.
- Browser launch and normal staging navigation via repaired MCP passed. Installed Chrome reached Login - Vercel. This proves usable browser binaries, not protected storefront acceptance. Login-page console messages are not application failures. The bounded probe closed its browser afterward.

Evidence: artifacts/seo-mcp-probe-{cached,local,npx,npxdelay,npxjs,npxshell,staging}.json and artifacts/seo-codex-mcp-{fresh,legacy,ide-fresh,ide-legacy}-result.json. Exact host startup events and tool schemas are retained.

## Changes

Installed @playwright/mcp exactly 0.0.83 under C:/Users/Ziko/.codex/tools/playwright-mcp-0.0.83, using --ignore-scripts, --no-audit and --no-fund. Its two Playwright dependencies are locked to 1.64.0-alpha-1790635538000. No project dependency files were changed.

Changed only the Playwright command and args in C:/Users/Ziko/.codex/config.toml:

    [mcp_servers.playwright]
    enabled = true
    command = "C:/Program Files/nodejs/node.exe"
    args = ["C:/Users/Ziko/.codex/tools/playwright-mcp-0.0.83/node_modules/@playwright/mcp/cli.js"]

No timeout increase. Full private configuration backup: C:/Users/Ziko/.codex/config.toml.playwright-before-direct-node-1792581838708.bak. Restore only the previous Playwright block if rollback is needed; preserve unrelated later settings. The direct launcher removes runtime npm registry/cache resolution and the .cmd layer, without claiming either was conclusively the original cause.

## Exact restart and login steps

The existing conversation still has no Playwright tools; fresh Codex sessions were verified separately. Save open work, press Ctrl+Shift+P in VS Code, run Developer: Reload Window, reopen the LECOMAX folder and start a NEW Codex conversation. Ask it to verify browser_navigate/browser_resize/browser_snapshot are exposed and resume from this handoff. If the host remains stale, fully exit all VS Code windows and reopen VS Code and the project. Do not reinstall packages or change protection. In a Codex CLI session, exit and relaunch codex.cmd, then use /mcp to confirm Playwright is active.

Navigate normally to https://lecomax-seo-staging.vercel.app. Owner participation is required to sign in through Vercel in the MCP-controlled Chrome window. Do not paste credentials in chat, copy cookies, inject bypass headers or disable authentication. Resume desktop 1440x900 and mobile 375x812 / 390x844 acceptance only after successful authorized login.

Official configuration documentation: https://developers.openai.com/codex/mcp . Fresh-host protocol: https://learn.chatgpt.com/docs/app-server .

Responsive rendering, hydration, navigation, application console/network, rendered metadata, product/category pages, robots and sitemaps remain pending behind login. No prior audit was repeated. No deployment, push, hosted write, database migration, production modification or live preview certification occurred. History entries are local until a separately authorized distribution.
