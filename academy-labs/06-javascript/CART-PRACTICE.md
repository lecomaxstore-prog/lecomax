# Independent cart function

Prerequisites: finish the values lesson and understand functions, integer centimes and basis points. Use the existing Node installation; no packages or network are required.

Edit `cart-practice.cjs`, not the verifier. Export `calculateCart(unitPriceCents, quantity, discountBps)`. Return a fresh object with `subtotalCents`, `discountCents`, `totalCents`.

- Price: nonnegative safe integer centimes.
- Quantity: numeric safe integer, 1–99 inclusive; this function does not parse text.
- Discount: numeric integer basis points, 0–10000 inclusive.
- Reject invalid inputs by throwing an error. Message wording and error subclass are your choice.
- Both subtotal and subtotal × discountBps must be safe integers; reject overflow before using it.
- Round the nonnegative discount once to the nearest centime, with halves upward. Subtract it from subtotal.
- Do not format strings inside the calculation. Do not retain shared mutable output between calls.

From the repository root:

```powershell
node academy-labs/06-javascript/verify-cart.cjs
```

This executes your trusted local JavaScript on your computer. It is not a sandbox for untrusted downloaded code and is never run by the mobile app. The intentional starter throws until you implement it. Passing means all 11 checks pass; assertions compare behavior, not your source text. Multiple implementations can pass. The verifier is a learning tool, not proof against every possible bug or deliberately hard-coded answers.

Work in stages: validate parameters; compute and validate intermediate products; round and subtract; return results. Run the checks after each stage. If only a rounding case fails, trace the discount before changing the final total. If valid calculations pass but invalid inputs fail, revisit the contract instead of hiding errors with zero.

After attempting independently, inspect `cart-reference.cjs` or check the reference:

```powershell
node academy-labs/06-javascript/verify-cart.cjs --reference
```

Explain why checking only the three input values does not guarantee that their products remain safe. Add one new boundary case to your own separate test file. Local results are not automatically imported as app mastery or course completion.
