/**
 * Helper: derive a storage object path (key) from a public URL for a given bucket
 * 
 * This function parses Supabase storage URLs and extracts the storage path.
 * Typical URL structure: /storage/v1/object/public/<bucket>/<key...>
 * 
 * @param url - The public URL from Supabase storage
 * @param bucketName - The name of the storage bucket
 * @returns The storage path/key or null if extraction fails
 */
export function toStoragePath(
  url: string | null | undefined,
  bucketName: string
): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // Typical path: /storage/v1/object/public/<bucket>/<key...>
    const objectIdx = parts.findIndex((p) => p === "object");
    if (objectIdx !== -1) {
      const bucketIdx = objectIdx + 2; // object / public|sign|authenticated / <bucket>
      const b = parts[bucketIdx];
      if (b === bucketName) {
        return decodeURIComponent(parts.slice(bucketIdx + 1).join("/"));
      }
    }
    // Fallback: locate bucket directly in path
    const bIdx = parts.findIndex((p) => p === bucketName);
    if (bIdx !== -1) {
      return decodeURIComponent(parts.slice(bIdx + 1).join("/"));
    }
  } catch {}
  return null;
}