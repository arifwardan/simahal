<script lang="ts">
  import { page } from "$app/stores";
  import { api } from "$lib/api";
  let tenant: any = null;
  async function load() {
    const slug = $page.params.slug;
    tenant = await (await fetch(`/api/tenant-proxy?slug=${slug}`)).json().catch(() => null);
  }
</script>
<main class="min-h-screen bg-ivory text-charcoal">
  <h1 class="text-2xl font-bold text-emerald_deep">SIMAHAL — {$page.params.slug}</h1>
  <button on:click={load}>Cek Tenant</button>
  <pre>{JSON.stringify(tenant, null, 2)}</pre>
</main>
