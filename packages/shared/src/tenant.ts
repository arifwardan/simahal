export function resolveTenantSlug(input: { host?: string; path?: string; headerSlug?: string }): string | null {
  if (input.headerSlug) return input.headerSlug;
  if (input.path) {
    const m = input.path.match(/^\/p\/([a-z0-9-]+)/i);
    if (m) return m[1].toLowerCase();
  }
  if (input.host) {
    const sub = input.host.split(".")[0];
    if (sub && sub !== "www" && sub !== "simahal" && sub !== "localhost") return sub.toLowerCase();
  }
  return null;
}
