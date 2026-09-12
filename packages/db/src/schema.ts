import { pgTable, text, uuid, timestamp, date, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  nama: text("nama").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  status: text("status").notNull().default("active"),
  settings: jsonb("settings")
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  isSuperAdmin: text("is_super_admin").notNull().default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const tenantMemberships = pgTable("tenant_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").defaultNow()
});

export const santri = pgTable("santri", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  nis: text("nis").notNull(),
  nama: text("nama").notNull(),
  tanggalLahir: date("tanggal_lahir"),
  status: text("status").notNull().default("active")
}, (t) => [uniqueIndex("santri_tenant_nis").on(t.tenantId, t.nis)]);

export const ustadz = pgTable("ustadz", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  nama: text("nama").notNull(),
  kontak: text("kontak")
});

export const orangTua = pgTable("orang_tua", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  nama: text("nama").notNull(),
  kontak: text("kontak")
});

export const orangTuaSantri = pgTable("orang_tua_santri", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  orangTuaId: uuid("orang_tua_id").notNull().references(() => orangTua.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  hubungan: text("hubungan")
});

export const halaqah = pgTable("halaqah", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  nama: text("nama").notNull(),
  ustadzId: uuid("ustadz_id").references(() => ustadz.id),
  jadwal: text("jadwal"),
  status: text("status").notNull().default("active")
});

export const halaqahMembers = pgTable("halaqah_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  halaqahId: uuid("halaqah_id").notNull().references(() => halaqah.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: text("status").notNull().default("active")
});

export const targetHafalan = pgTable("target_hafalan", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  periode: text("periode").notNull(),
  target: text("target").notNull(),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("active")
});

export const mutabaah = pgTable("mutabaah", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  santriId: uuid("santri_id").notNull().references(() => santri.id),
  ustadzId: uuid("ustadz_id").references(() => ustadz.id),
  tanggal: date("tanggal").notNull(),
  jenis: text("jenis").notNull(),
  surah: text("surah").notNull(),
  ayatMulai: integer("ayat_mulai"),
  ayatSelesai: integer("ayat_selesai"),
  nilai: text("nilai"),
  status: text("status").notNull(),
  catatan: text("catatan")
});
