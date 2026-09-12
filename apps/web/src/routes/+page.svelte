<script lang="ts">
  import { api } from "$lib/api";
  let health: any = null;
  async function load() { health = await (await fetch("/api/health-proxy")).json().catch(() => null); }
</script>
<main class="min-h-screen bg-ivory text-charcoal">
  <h1 class="text-2xl font-bold text-emerald_deep">SIMAHAL</h1>
  <p>Sistem Manajemen Halaqah Al-Qur'an — skeleton multi-tenant.</p>
  <button on:click={load}>Cek API</button>
  <pre>{JSON.stringify(health, null, 2)}</pre>
</main>
