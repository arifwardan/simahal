export const ROLES = ["admin_pondok", "ustadz", "santri", "orang_tua"] as const;
export type Role = (typeof ROLES)[number];
export const MUTABAAH_JENIS = ["setoran", "murajaah"] as const;
export type MutabaahJenis = (typeof MUTABAAH_JENIS)[number];
export const MUTABAAH_STATUS = ["lulus", "perlu_murajaah", "mengulang"] as const;
export type MutabaahStatus = (typeof MUTABAAH_STATUS)[number];
export * from "./tenant.js";
