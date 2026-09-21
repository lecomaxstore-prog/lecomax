# Search Console 404 review — 15 September 2026

Source: user-downloaded `lecomax.com-Coverage-Drilldown-2026-09-15.zip`, Table.csv (14 URLs).
All 14 exact exported URLs were checked against production and the live sitemap.

## Existing redirects

These return HTTP 308 and reach HTTP 200:

| Old path | Destination |
| --- | --- |
| /terms.html | /conditions-utilisation/ |
| /produit/c-running-elite/ | /chaussures/ |
| /produit/c-trail-sport/ | /chaussures/ |
| /produit/h-doudoune-hiver/ | /homme/ |
| /produit/h-softshell | /homme/ |
| /produit/h-veste-zip-tech/ | /homme/ |

These redirects predate this review. Category redirects do not establish an equivalent replacement for each old product or guarantee Google will accept them as such.

## URLs still returning HTTP 404

- https://lecomax.com/ecomedia/test-mrle5pys/
- https://lecomax.com/produit/asics-gel-nimbus-27--bleu--chaussures-de-running--occasion/
- https://www.lecomax.com/$
- https://www.lecomax.com/&
- https://lecomax.com/produit/a-casque-bluetooth
- https://lecomax.com/produit/f-doudoune-femme/
- https://lecomax.com/produit/c-basket-cuir/
- https://lecomax.com/produit/h-coupe-vent/

None of the 14 exported URLs appears in the current sitemap. No equivalent replacement was established for the remaining missing product pages. Do not invent replacements or redirect all missing URLs to the homepage merely to clear this report. A removed page without a replacement may correctly remain 404.

The exported historical report is not proof of a current defect. No application code was changed or Google validation requested during this review.

## Next evidence needed

## Duplicate canonical report reviewed

The subsequent export `lecomax.com-Coverage-Drilldown-2026-09-15 (2).zip` identifies one URL, last crawled 25 August:
`https://www.lecomax.com/ecomedia/ecoutez-sans-limites-mrfbvkoe/`.

Live verification on 15 September: both www and non-www variants return HTTP 200, allow indexing, and contain exactly one canonical link pointing to `https://lecomax.com/ecomedia/ecoutez-sans-limites-mrfbvkoe/`. The currently served HTML explicitly specifies the preferred URL. Google's current selected canonical and recrawl status remain unverified. No code change was necessary to supply the canonical tag.

Export the detail reports for `Duplicate without user-selected canonical`, `Discovered - currently not indexed`, and `Crawled - currently not indexed` to inspect current public URLs and prioritize actionable indexing issues.
