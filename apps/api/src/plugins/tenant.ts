import { Elysia } from "elysia";
import { resolveTenantSlug } from "@simahal/shared";
import { db } from "@simahal/db";
import { tenants } from "@simahal/db";

export const tenantPlugin = new Elysia({ name: "tenant" })
  .derive(({ request }) => {
    const url = new URL(request.url);
    const slug = resolveTenantSlug({
      host: request.headers.get("host") ?? undefined,
      path: url.pathname,
      headerSlug: request.headers.get("x-tenant-slug") ?? undefined
    });
    return { tenantSlug: slug };
  })
  .resolve(async ({ tenantSlug, request, path }) => {
    const pathname = typeof path === "string" ? path : new URL(request.url).pathname;
    if (pathname === "/health" || pathname === "/api/health") return {};
    if (!tenantSlug) return { tenant: null };
    const rows = await db.select().from(tenants).limit(1);
    const tenant = rows.find((t) => t.slug === tenantSlug) ?? null;
    return { tenant };
  });
