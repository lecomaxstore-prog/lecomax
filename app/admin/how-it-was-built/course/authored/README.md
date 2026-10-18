# Reviewed chapter overrides

Hand-authored chapters live in ar/, en/ and fr/ under their existing lesson IDs. scripts/generate-course.mjs loads these after creating blueprint defaults and includes them in search. This prevents future generation from restoring the superseded teaching or SQL defect.

After editing, run node scripts/apply-authored-lessons.mjs from the repository root. It updates only mapped authored lessons in canonical web modules, mobile modules and both search indexes; saved learner IDs and unrelated content are preserved. A full mobile migration also reads the revised canonical content.

Run node scripts/validate-course.mjs and node --test lecomax-learning-app/tests/sql-chapter.test.cjs. The former checks structure; the latter executes SQL. Neither establishes complete educational coverage. The quality audit ledger records remaining advanced practice.
