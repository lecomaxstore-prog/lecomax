# JavaScript values chapter — 2026-10-08

Lesson: `lesson-06-01-values`, module `module-06-javascript-foundations`. Existing lesson, order and quiz IDs are retained. Status: expanded and tested within its stated teaching contract; the JavaScript track is not complete.

## Implemented

- Replaced repeated generic explanations with 16 sequenced passages: 1,564 Darija words, 1,781 English words and 1,758 French words, excluding exercises, metadata and code.
- Explained declaration/reassignment, scope introduction, primitive types, coercion, text validation, functions/guards, regular expressions, integer money, intermediate precision, explicit rounding, object identity, shallow copying, `toFixed`, template literals and diagnosis versus correction.
- Added three small executable examples and a complete annotated calculator. Added the previously missing local file `academy-labs/06-javascript/values.js`.
- Supplied five exercise stages, hints, worked reasoning, four troubleshooting cases and three scenario questions with specific feedback for every option.
- Preserved learner IDs. Canonical web content, bundled mobile content and both search indexes are synchronized through the existing selective authoring mechanism.
- Editorial source: `scripts/author-javascript-values.mjs`; durable runtime overrides: `course/authored/{ar,en,fr}/lesson-06-01-values.json`. Run the editorial script only when intentionally rebuilding this chapter, then `node scripts/apply-authored-lessons.mjs`.

## Contract and executed evidence

The text parser accepts trimmed ASCII decimal digits, including leading zeros, and quantities 1–99. It rejects blank, signed, fractional, exponent, hexadecimal, malformed and non-string inputs. The numeric calculator does not coerce strings. Price and discount are nonnegative safe integers; discount is 0–10000 basis points. Both intermediate products must remain safe integers. This conservative limit deliberately rejects some huge amounts that would have a representable final result.

The discount rounds once to the nearest centime, with nonnegative halves rounded upward. This is one stated exercise policy, not a universal checkout or tax policy. No production prices, inventory, orders or payments are read or changed.

Eight focused tests execute the actual authored code, compare every introductory output, verify normalization and rejection cases, check source/web/mobile/search parity, verify non-mutation, reject unsafe products, and compare a matrix of discounts against an independent BigInt oracle. The formatter is tested at zero, fractional-dirham boundaries and MAX_SAFE_INTEGER.

Course schema validation passes for 48 modules / 192 lessons / three locales. TypeScript, full web-to-mobile lesson parity and the existing seven-lesson academy integrity checks pass. Full regression and web-export results are recorded in the implementation checkpoint after completion.

## Remaining work

- Expand `lesson-06-02-control-flow` next: decisions before compact syntax, branch ordering, trace tables, loop initialization/condition/update, break/continue, short-circuit evaluation and mutation during iteration.
- Continue the existing strings, functions, collections, DOM, async, TypeScript and framework sequence. This chapter introduces function syntax only as needed for its calculator.
- The separate `academy-js-values` lesson remains a beginner entry; this preserves its existing ID and avoids adding another competing lesson ID.
- BigInt/decimal arithmetic implementation, multi-item/tax/refund rounding and authoritative server checkout belong to later dedicated lessons.
- Browser visual verification, native device/offline checks and the existing large bundle remain unresolved; automated content parity and a web export do not establish those results.
