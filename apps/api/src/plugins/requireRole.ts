export function requireRole(membershipRole: string | undefined, allowed: string[]) {
  if (!membershipRole || !allowed.includes(membershipRole)) {
    throw new Error("Forbidden: role tidak diizinkan");
  }
}
