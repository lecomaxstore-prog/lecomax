# Mobile admin audit

## Existing architecture (before changes)

The production admin is the existing Next.js App Router tree under `app/admin`.
`app/admin/layout.tsx` owns authentication-aware navigation, permission-filtered
links, badges, a focus-trapped drawer, command search and a scrolling main region.
Pages call the existing API routes; settings use `lib/use-settings.ts`. Stock
mutations already reconcile the server response. Product variants are represented
by existing inventory/pricing tags and color/size maps, not a separate SKU entity.
There is no admin dark-mode system. Tailwind uses its default breakpoints.

## Findings and decisions

| Area | Existing strengths | Mobile gap / treatment |
| --- | --- | --- |
| Shell | Drawer, focus restoration, permission gates, safe areas | Primary navigation should open product/customer lists; consolidate sizing and action offsets |
| Dashboard | Compact KPIs, quick actions, recent orders, optional touch-readable charts, retry/skeleton | Preserve; make shortcuts compact on phones and expose promotion/banner tools where allowed |
| Products | Mobile cards, confirmations, approval flow, sticky save, unsaved-link guard | Add filters/sorting, bound rendered rows, collapsible editor sections; retain every field |
| Variants | Color price and color/size inventory cards, numeric controls | Keep existing inventory model; larger controls and collapsible sections, no invented SKU/barcode schema |
| Stock | Server-reconciled adjustments, cards, search and low/out filters | Add explicit healthy-stock filter; preserve authoritative backend |
| Orders | Cards, detail sections, invoices, confirmations and retry | Filter sheet, bounded rows, payment/date context, reachable contact/status shortcuts |
| Customers | Search by name/phone/email/city, spending aggregation | 580px table, cramped three-column KPIs, unhandled network failures; responsive cards, retry and pagination |
| Coupons, newsletter, loyalty | Existing mutation handlers and desktop tables | Convert same rows to labelled mobile cards |
| Staff, client data, mobile campaigns, Ecomedia, assistant analytics | Existing authorization/data | Reuse mobile-card table presentation, keep desktop tables |
| Size guide / analytics | Tabular data and editing | Labelled mobile rows; retain all fields and existing chart logic |
| Categories, banners, promotions, ads, pages, reviews, returns | Existing forms/cards and confirmation patterns | Shared touch/input styles; reachable form actions and modal bounds |
| Shipping, checkout, settings, mobile configuration | Existing sections, settings persistence and sticky settings save | Shared input sizing, safe area/action spacing; preserve business rules |
| Messages, support, broadcasts, push, media, approvals, roles | Specialized workflows and overlays | Keep workflows; apply bounded scrolling dialogs and touch controls |
| Other routes | Activity, recordings, app releases, studio, chatbot knowledge | Shared shell/form improvements; do not redesign specialized editors blindly |

## Validation boundaries

Use local fixtures for browser verification, intercept writes, and do not change
production records. Check 320, 360, 375, 390, 412, 430, 768, 1024 and 1280px.
Verify navigation, horizontal overflow, filter closing/focus, pagination,
collapsed-field validation, sticky action clearance and desktop tables.
Existing APIs return full product/order collections: client pagination bounds DOM
work, not network payload. Server pagination is a separate API contract change.
Physical iOS/Android keyboard and safe-area behavior requires device verification.
