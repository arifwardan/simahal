import { Elysia } from "elysia";
import { tenantPlugin } from "./plugins/tenant.js";

export const app = new Elysia()
  .use(tenantPlugin)
  .get("/health", () => ({ ok: true }))
  .get("/api/health", () => ({ ok: true, service: "simahal-api" }))
  .get("/api/tenant", ({ tenant, tenantSlug }: any) => ({ slug: tenantSlug ?? null, tenant }))
  .listen(process.env.API_PORT ?? 3000);

export type App = typeof app;
