import { json } from "@sveltejs/kit";

const BASE = process.env.PUBLIC_API_URL ?? "http://localhost:3000";

export async function GET({ request, url }) {
  const headers: Record<string, string> = {};
  const slug =
    request.headers.get("x-tenant-slug") ?? url.searchParams.get("slug");
  if (slug) headers["x-tenant-slug"] = slug;
  const res = await fetch(`${BASE}/api/tenant`, { headers });
  const data = await res.json().catch(() => null);
  return json(data, { status: res.status });
}
