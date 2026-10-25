/** Read the key/value rows saved by the admin product editor, in their saved order. */
export function productDetailsFromTags(tags?: readonly string[] | null) {
  return (tags ?? []).flatMap(tag => {
    if (!tag.startsWith("__detail:")) return [];
    const content = tag.slice("__detail:".length);
    const separator = content.indexOf(":");
    if (separator < 0) return [];
    const key = content.slice(0, separator).trim();
    const value = content.slice(separator + 1).trim();
    return key && value ? [{ key, value }] : [];
  });
}
