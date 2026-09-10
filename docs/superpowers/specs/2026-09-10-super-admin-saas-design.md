# Super Admin SaaS Platform — Design Spec

**Date:** 2026-09-10
**Status:** Approved
**Context:** SIMAHAL — multi-pondok tenancy (shared DB + `pondok_id` + global scope). Current roles: admin, muhafidz, santri, orang_tua. No subscription/billing system exists yet.

---

## 1. Goal & Scope

**Goal:** Turn SIMAHAL into a real SaaS product with a dedicated Super Admin portal that manages the platform above the pondok level: who registers, who subscribes, and which pondoks are active.

**In scope (Phase 1 + 2):**
1. Separate super admin portal with isolated login and routing.
2. `super_admin` role with no `pondok_id` (global access).
3. Pondok monitoring: directory, search/filter, drill-down with aggregated stats only.
4. Pondok lifecycle control: activate/suspend, view/edit profile, manage pondok admin users.
5. Tiered subscription plans (fixed features per tier) with `subscription_plans`, `subscriptions`, `payments` tables.
6. Payment gateway integration (Midtrans or Xendit) with webhook-driven status sync.
7. Super admin dashboard with SaaS metrics (pondok count, MRR, active subscriptions, new registrations).

**Out of scope:**
- Subdomain per pondok.
- Custom domain per pondok.
- Full access to santri/mutabaah raw data (super admin sees aggregated stats only).
- Usage-based pricing (per-santri/per-halaqah).
- Mobile native app.

---

## 2. Architecture

### 2.1 Super Admin Portal

- Separate login at `/super-admin/login` (guest middleware), separate route group with `role:super_admin`.
- Separate Inertia pages under `resources/js/pages/super-admin`.
- Super admins have NO `pondok_id`. They bypass tenant global scope entirely.
- `UserRole` enum gains `SuperAdmin` case. `UserStatus` remains `active`/`pending`.

### 2.2 Data Model

**New tables:**
- `subscription_plans`: `id, name, slug (unique), price (decimal), interval (monthly/yearly), features (json), is_active, timestamps`
- `subscriptions`: `id, pondok_id (FK → pondoks), plan_id (FK → subscription_plans), status (trialing/active/past_due/cancelled/suspended), current_period_start, current_period_end, cancelled_at, timestamps`
- `payments`: `id, pondok_id, subscription_id, gateway (midtrans|xendit), gateway_transaction_id (unique), amount, currency, status (pending/success/failed/refunded), paid_at, payload (json), timestamps`
- `pondok_status_history`: `id, pondok_id, from_status, to_status, actor_user_id, reason, timestamps` (audit trail for suspend/activate)

**Pondok fields extended:** `status` enum (`active`, `suspended`, `pending_verification`) + `subscription_id` nullable.

### 2.3 Backend Structure

- `app/Http/Controllers/SuperAdmin/*` — dashboard, pondoks, subscriptions, payments, settings.
- `app/Models/SubscriptionPlan`, `Subscription`, `Payment` — Eloquent models with relationships to `Pondok` and `User`.
- `app/Services/PaymentGateway/*` — Midtrans/Xendit client, webhook handler, idempotency.
- Middleware: `role:super_admin` on all `/super-admin/*` routes; tenant global scope does NOT apply to super admins (scope checks `auth()->user()->pondok_id === null`).

### 2.4 Frontend Pages (Super Admin)

- `SuperAdminDashboard`: KPI cards (total pondoks, active pondoks, MRR, active subscriptions, new registrations this month), recent registrations table, subscription health chart.
- `SuperAdminPondoks`: searchable/filterable pondok directory (name, slug, status, plan, registered date), drill-down to detail.
- `SuperAdminPondokDetail`: aggregated stats (santri count, muhafidz count, halaqah count, mutabaah count, last activity), admin user list, subscription summary, suspend/activate buttons.
- `SuperAdminSubscriptions`: plan management (CRUD plans), subscription list by pondok, payment history.
- `SuperAdminPayments`: payment transactions, gateway status, manual verification fallback.

---

## 3. Data Flow

### 3.1 Pondok Registration → Super Admin Visibility

```
register-pondok (guest)
  → create pondok + admin user (pondok_id set, role=admin)
  → pondok appears in super admin directory (status: pending_verification)
  → super admin approves → pondok.status = active → pondok fully operational
```

### 3.2 Subscription Purchase

```
pondok admin selects plan (future: pondok-side billing page)
  → create subscription (status: trialing) + payment intent via gateway
  → gateway webhook (success/failed)
  → PaymentGateway service validates signature, idempotent upsert
  → subscription status updated (active/past_due)
  → super admin dashboard reflects MRR + active subscriptions
```

### 3.3 Pondok Suspension

```
super admin clicks "Suspend" on pondok detail
  → validate actor is super_admin
  → pondok.status = suspended (record in pondok_status_history)
  → login for that pondok's users blocked (middleware check pondok.status === active)
  → dashboard shows suspended badge
  → "Activate" reverses with audit entry
```

---

## 4. Error Handling & Edge Cases

- **Webhook security:** Verify gateway signature (Midtrans SHA-512 / Xendit callback token) before processing. Reject invalid signatures with 400.
- **Idempotency:** `gateway_transaction_id` unique constraint; duplicate webhooks return 200 without side effects.
- **Gateway down:** Queue webhook processing; if gateway unreachable, mark payment `pending` and allow super admin manual verification fallback.
- **Suspend edge:** Cannot suspend the last active pondok? (No — allow, but log.) Cannot delete pondok with active subscriptions (RESTRICT).
- **Super admin isolation:** Super admins must never see `pondok_id`-scoped data leakage; all super admin queries explicitly skip tenant scope.
- **Pending pondok:** Newly registered pondoks start `pending_verification`; super admin approval moves to `active`.

---

## 5. Testing

**Feature (Pest):**
- Super admin login redirects to `/super-admin/dashboard`; pondok admin cannot access super admin routes (403).
- Pondok directory lists all pondoks with search/filter; drill-down shows aggregated counts only.
- Suspend/activate updates `pondok.status` + writes `pondok_status_history`; suspended pondok users are blocked from login.
- Subscription lifecycle: create plan, subscribe pondok, webhook success → status active, webhook duplicate → no double count.
- Payment gateway: invalid signature rejected, valid signature idempotent.
- Super admin sees MRR/counts on dashboard matching DB aggregates.

**Unit:**
- PaymentGateway signature verification.
- Subscription status transition rules (trialing → active → past_due → cancelled).

---

## 6. Rollout Plan

**Phase 1 (Core SaaS):** Super admin portal, `super_admin` role, pondok directory + drill-down, suspend/activate, dashboard KPIs.
**Phase 2 (Billing):** Tiered plans, subscriptions, payment gateway (Midtrans/Xendit), webhook sync, invoice history.
**Phase 3 (Analytics):** Reports, CSV/PDF export, cohort charts, churn metrics.

---

## 7. Files Impacted

- `app/Enums/UserRole.php` (add SuperAdmin)
- `app/Models/User.php`, `app/Models/Pondok.php` (status, relationships)
- New models: `SubscriptionPlan`, `Subscription`, `Payment`
- New controllers under `app/Http/Controllers/SuperAdmin/`
- New routes in `routes/super-admin.php` (required from `web.php`)
- New Inertia pages under `resources/js/pages/super-admin/`
- New migrations for subscription/payment/audit tables
- Middleware adjustments for pondok status blocking + super admin bypass

---

## 8. Alternatives Considered

- **Single login with role routing (rejected):** Violates the requirement for a separate super admin portal; pondok users would see a path to a privileged area.
- **Usage-based pricing (rejected):** User chose tiered plans; usage-based adds metering complexity not needed now.
- **Manual payment verification only (rejected):** User chose payment gateway integration for a real SaaS.
- **Full raw data visibility for super admin (rejected):** User chose aggregated stats only for privacy.
