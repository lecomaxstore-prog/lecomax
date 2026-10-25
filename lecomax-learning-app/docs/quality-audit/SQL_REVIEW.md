# SQL chapter review — 2026-10-08

Lesson: sql-transactions-indexes, module sql-data-modeling. Existing IDs retained in all three locales. Status: expanded; advanced practice still pending.

## Implemented

- Replaced unconditional insertion after a possibly zero-row UPDATE with an executable ROW_COUNT guard and exception.
- Added isolated temporary schema and fixtures, a price snapshot taken from the updated product, and an explicitly simplified one-item order model.
- Added 16 explanatory passages in each locale (over 1500 prose words), four annotated SQL examples, five practice tasks with worked reasoning, four troubleshooting cases and three revised quizzes with option feedback.
- Covered transaction states, autocommit, constraints, PL/pgSQL mechanics, concurrency limitations, ACID, external effects/idempotency boundaries, EXPLAIN, index costs, backfills and expand/contract.
- Saved authoritative chapters under course/authored. Generation honors those replacements. A selective synchronization command updates canonical web content, mobile content and search without changing saved lesson IDs.

## Evidence

11 SQL tests pass in locally installed PGlite, including successful reservation, insufficient and exactly sufficient stock, absent product, duplicate-order rollback, constraints, two query plans, migration enforcement and the complete downloadable lab. A deliberate mutation reproduces the original phantom-order defect using its hard-coded price. Removing only the new guard causes a NOT NULL error on its missing returned price; the exercise explicitly explains that distinction.

All 98 learning-app tests pass. TypeScript and course validation pass; web/mobile content parity has zero missing mapped lessons. Final web export succeeds. JavaScript syntax checks pass for the changed authoring/audit scripts. ESLint intentionally ignores the CJS scripts/tests under the existing configuration, so its ignored-file warnings are not counted as a successful lint review.

## Primary technical references

Checked 2026-10-08. PostgreSQL documentation currently resolves to version 18. Tests exercise the installed PGlite engine, not an independent production PostgreSQL service.

- [Transaction boundaries](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Transaction isolation and conditional update behavior](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PL/pgSQL statements and row-count diagnostics](https://www.postgresql.org/docs/current/plpgsql-statements.html)
- [Constraints and foreign-key indexing](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Reading query plans](https://www.postgresql.org/docs/current/using-explain.html)
- [Index creation and concurrent-build limitations](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PGlite execution environment](https://pglite.dev/docs/)

## Remaining work

Executable savepoint recovery, independent-connection concurrency and retry/deadlock tests, a complete multi-item idempotent checkout, and realistic large-table migration rehearsal remain. These gaps prevent marking the full subject complete. Do not turn this lab into production integration without teaching and verifying those boundaries.

No production database was contacted or modified. Browser/native visual verification remains unavailable in this environment. Android export previously failed because hermesc.exe could not execute (permission denied); no APK or device/offline-cold-start claim is made.
