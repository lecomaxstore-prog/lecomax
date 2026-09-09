type DatabaseError = { code?: string; message: string };

const PREORDER_DEFAULTS: Record<string, unknown> = {
  preorder_enabled: false,
  preorder_estimated_at: null,
  preorder_message: null,
};

export function missingPreorderColumn(error: DatabaseError | null): string | null {
  if (!error || !["42703", "PGRST204"].includes(error.code ?? "")) return null;
  return Object.keys(PREORDER_DEFAULTS).find(field =>
    new RegExp(`\\b${field}\\b`).test(error.message),
  ) ?? null;
}

// Retry only schema failures, which cannot have committed a write. Remove only
// a missing column's disabled/default value; never discard requested features.
export async function writeProductWithSchemaCompatibility<T extends { error: DatabaseError | null }>(
  payload: Record<string, unknown>,
  write: (payload: Record<string, unknown>) => PromiseLike<T>,
): Promise<T> {
  const compatible = { ...payload };
  let result = await write({ ...compatible });
  for (let attempt = 0; attempt < 3; attempt++) {
    const field = missingPreorderColumn(result.error);
    if (!field || !(field in compatible)) break;
    const requestedPreorder = Object.keys(PREORDER_DEFAULTS).some(key =>
      key in compatible && compatible[key] !== PREORDER_DEFAULTS[key],
    );
    if (requestedPreorder) break;
    delete compatible[field];
    result = await write({ ...compatible });
  }
  return result;
}

export function productWriteError(error: DatabaseError, fallback: string) {
  if (error.code === "23505") return { error: "Un produit utilise déjà ce slug.", status: 409 };
  if (missingPreorderColumn(error)) return {
    error: "Les précommandes nécessitent la mise à jour de la base de données. Désactivez les précommandes et videz leur date et message pour enregistrer ce produit.",
    status: 409,
  };
  return { error: fallback, status: 500 };
}
