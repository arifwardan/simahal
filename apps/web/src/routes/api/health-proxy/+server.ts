import { json } from "@sveltejs/kit";

const BASE = process.env.PUBLIC_API_URL ?? "http://localhost:3000";

export async function GET() {
  const res = await fetch(`${BASE}/api/health`);
  const data = await res.json().catch(() => null);
  return json(data, { status: res.status });
}
