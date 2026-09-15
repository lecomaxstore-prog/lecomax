/** Keep database implementation details out of API responses and application logs. */
export function publicDatabaseError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  console.error(JSON.stringify({ type: "database_error", code: /^[A-Z0-9_]{1,24}$/.test(code) ? code : "UNAVAILABLE" }));
  return "Service momentanément indisponible. Veuillez réessayer.";
}
