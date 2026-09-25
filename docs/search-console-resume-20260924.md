# Indexing review resumed — 24 September 2026

Rechecked the saved 15 September exports against production. These are public HTTP checks, not fresh Search Console exports or proof of Google indexing.

- All 26 previously discovered URLs return HTTP 200, specify their own canonical, appear in the live sitemap, and permit indexing in the inspected HTML metadata and HTTP headers.
- The Lenovo GM2 Pro and LP40 Pro pages now have product-specific titles and canonicals and are in the sitemap. The previous missing-product findings no longer describe their live state.
- The three image URLs from the saved crawled export return HTTP 200 without an X-Robots-Tag exclusion. Current robots.txt allows their paths for Googlebot and Googlebot-Image. This does not prove these are the exact three blocked images referenced in the user's screenshot.
- The legacy authentication URL leads to /connexion/, which explicitly excludes indexing.
- The two legacy product URLs lead to /homme/ and /chaussures/. Both destinations return HTTP 200 with their own canonical and index directives. This does not establish that category redirects are equivalent product replacements.
- The live sitemap contains 57 URLs.
- The Ecomedia post ecoutez-sans-limites-mrfbvkoe still has no H1 in fetched HTML; this alone is not an established indexing blocker.

Evidence: search-console-discovered-recheck-20260924.json and search-console-crawled-recheck-20260924.json.

No application code, deployment, or Search Console submissions were changed. Browser inventory returned no connected browsers, and opening Chrome returned “Browser is not available: chrome”. Remaining work requires a connected signed-in Search Console session or fresh exclusion exports: inspect current issue categories, identify exact blocked image URLs, and verify Google's selected canonicals and recrawl state.
