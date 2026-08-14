---
paths:
  - resources/js/pages/ustadz/halaqahs/santris.tsx
---

# Halaqahs

## Rekap dialog month dropdown must re-fetch via ?bulan= before trusting prefill
The rekap dialog's `bulanan` list, `existing`, and `prefill_kumulatif` are bound to the page's `?bulan=` query prop (default = current month). Changing the dropdown month must navigate with `router.get(santrisShow({ halaqah }, { query: { bulan: next } }), {}, { preserveState: true, replace: true })` so the server re-fetches `bulanan` for that month. Never submit the form for a month whose data wasn't fetched — a stale page-month prefill saved into another month's record is a data-integrity hazard. Use `mergeQuery` if the page URL already carries query params that must survive.
