import { ElysiaCustomStatusResponse } from "elysia";

export function requireRole(membershipRole: string | undefined, allowed: string[]) {
  if (!membershipRole || !allowed.includes(membershipRole)) {
    throw new ElysiaCustomStatusResponse(403, "Forbidden: role tidak diizinkan");
  }
}
