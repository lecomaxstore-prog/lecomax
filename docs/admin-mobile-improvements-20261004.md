# Admin mobile improvements — 4 October 2026

The admin uses shared mobile rules for readable content, full-width narrow-screen forms and filters, wrapping action rows, touch controls, and labelled table cards. Page-specific hooks let desktop layouts keep their existing structure.

## Changes

- Added mobile layout hooks across administrative pages, covering headings, input grids, search and filter bars, card actions, tabs, and editors.
- Replaced small clickable switches with a labelled keyboard-accessible switch that has a 48 × 48 px tap area. The internal track stays compact, even with the admin's general minimum button size. Existing callbacks and saving states are preserved.
- Improved tables on narrow phones: each field label appears above its value, and action rows wrap.
- Fit modal overlays, filter sheets, and confirmation dialogs to the visible viewport. Resize and scroll events update the available space when the keyboard opens; unmount removes listeners and CSS variables.
- Gave support conversations a separate mobile layout: the conversation status spans the header, attachment and reply share a row, and Send has its own full-width row. Opening a conversation hides the large mobile page banner to keep the composer above the bottom navigation.
- Made wide tab strips scroll within their container rather than expanding the page.

## Verification

Focused tests cover switch actions and accessibility state, disabled and saving states, viewport updates and cleanup, browsers without VisualViewport, existing error recovery, and permission boundaries.

The 18 focused tests passed. Layout checks passed for 40 administrative routes at the nine widths below, with additional checks for every settings tab at 320 and 390 px, the role editor, and the support conversation. The checks identified and verified fixes for an overflowing approvals tab strip and the roles page's fixed side-by-side layout.

The local headless Chrome smoke test uses read fixtures and intercepts every write request. It checks widths of 320, 360, 375, 390, 412, 430, 768, 1024, and 1280 px. The existing workflow checks cover filters, pagination, focus restoration, and the product editor. Additional routes can be selected with `ADMIN_MOBILE_ROUTES`; support fixtures exercise the conversation composer. Filter dialogs are also checked at a reduced height of 360 px.

Browser fixture tests do not validate production data or real-device keyboard behavior. Course screens retain their existing dedicated responsive layouts; printable invoices retain their print layouts.
