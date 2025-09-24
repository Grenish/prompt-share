
/**
 * Derive a storage object path (key) from a public URL for a given bucket.
 * Example URL path: /storage/v1/object/public/<bucket>/<key...>
 */
export function toStoragePath(
  url: string | null | undefined,
  bucketName: string
): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const objectIdx = parts.findIndex((p) => p === "object");
    if (objectIdx !== -1) {
      const bucketIdx = objectIdx + 2;
      const b = parts[bucketIdx];
      if (b === bucketName) {
        return decodeURIComponent(parts.slice(bucketIdx + 1).join("/"));
      }
    }
    const bIdx = parts.findIndex((p) => p === bucketName);
    if (bIdx !== -1) {
      return decodeURIComponent(parts.slice(bIdx + 1).join("/"));
    }
  } catch {}
  return null;
}
