# Crawled — currently not indexed: 15 September 2026

Source: Downloads/lecomax.com-Coverage-Drilldown-2026-09-15 (4).zip.
Metadata.csv confirms the issue; Table.csv contains six URLs, last crawled between 8 May and 23 August 2026.

## Live findings

| Exported entry | Current response | Assessment |
| --- | --- | --- |
| Lenovo GM2 Pro `4.avif` (www) | 200, image/avif | An image asset, not an HTML product page. |
| Sac bandoulière `4.avif` | 200, image/avif | An image asset, not an HTML product page. |
| BAASPLOA `Yellow.avif` | 200, image/avif | An image asset; see URL normalization below. |
| `/authentication.html` | 308 to `/connexion/`, then 200 | Login destination explicitly carries noindex in HTML and HTTP headers. Keep login excluded. |
| `/produit/h-doudoune-hiver` | 308 to `/homme/`, then 200 | Existing category redirect; destination has its own canonical and allows indexing. |
| `/produit/c-running-daily` | 308 to `/chaussures/`, then 200 | Existing category redirect; destination has its own canonical and allows indexing. |

None of the six original URLs is in the live page sitemap. Absence of HTML canonical tags or headings on an image response is not an HTML metadata defect. Image search indexing itself was not verified.

The BAASPLOA CSV field contains an embedded newline before `Sneakers`. The original value is preserved in the saved export; the HTTP client's standard URL parser removes that newline and percent-encodes spaces and non-ASCII characters. The actual requested URL is saved in the headers results.

The two product redirects predate this review. A broad category is not an established equivalent replacement for an individual product; these responses do not prove Google will accept the redirects or index the original URLs. No equivalent replacement product was established in this review.

## Outcome

This export does not reveal another currently served HTML product page with an indexing barrier requiring a code fix. No application code was changed and no Search Console indexing/validation request was submitted.

The Lenovo missing-product correction was subsequently deployed and verified on 15 September; see `search-console-discovered-review-20260915.md`. Do not request indexing for these old redirects or the login page merely to reduce the report count. Google's latest selected canonical/indexing state requires URL Inspection and was not accessed here.

Google explains the report's statuses and legitimate exclusions: https://support.google.com/webmasters/answer/7440203?hl=en

Evidence files:
- `search-console-crawled-export-20260915.json`: original URL and last-crawl fields.
- `search-console-crawled-results-20260915.json`: followed responses and HTML signals.
- `search-console-crawled-headers-20260915.json`: original response status, content type, and redirect location.
