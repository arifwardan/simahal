import { Elysia } from "elysia";
import { resolveTenantSlug } from "@simahal/shared";
import { db, eq } from "@simahal/db";
import { tenants } from "@simahal/db";

export const tenantPlugin = new Elysia({ name: "tenant" })
  .derive({ as: "global" }, ({ request }) => {
    const url = new URL(request.url);
    const slug = resolveTenantSlug({
      host: request.headers.get("host") ?? undefined,
      path: url.pathname,
      headerSlug: request.headers.get("x-tenant-slug") ?? undefined
    });
    return { tenantSlug: slug };
  })
  .resolve({ as: "global" }, async ({ tenantSlug, request, path }) => {
    const pathname = typeof path === "string" ? path : new URL(request.url).pathname;
    if (pathname === "/health" || pathname === "/api/health") return {};
    if (!tenantSlug) return { tenant: null };
    try {
      const rows = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
      return { tenant: rows[0] ?? null };
    } catch {
      return { tenant: null };
    }
  });
