# Desain: Sidebar Emerald + Background Beraksen (Pendekatan A)

Tanggal: 2026-08-12
Status: Disetujui user (implementasi)

## Latar Belakang

Setelah unifikasi UI ke palet shadcn, seluruh app terasa gersang (hanya hitam/putih). User memilih Pendekatan A: sidebar emerald gelap + background konten beraksen modern, tanpa mengubah palet global `primary/foreground` atau welcome page. Hanya menyentuh shell (sidebar/header/background) dan stat cards.

## Ruang Lingkup

1. Token sidebar di `app.css` → tema emerald gelap di mode light & dark.
2. Gradasi lembut di dalam sidebar (overlay, bukan ubah `ui/sidebar.tsx`).
3. Background konten: gradasi tipis + blob blur; header jadi glassy.
4. `StatCard` menerima `icon` + `tone` (warna soft per kartu) + ikon.
5. Progress bar di `santri-progress-view` → gradasi emerald.

Di luar scope: mengubah palet global `primary`/`button`/`form`, mengubah welcome page, mengubah `ui/sidebar.tsx` komponen shadcn.

## Detail

### 1. Token sidebar (resources/css/app.css)

Ganti nilai `--sidebar-*` di `:root` dan `.dark` (keduanya sama = emerald gelap, konsisten):

```css
--sidebar: oklch(0.21 0.05 165);          /* emerald pekat */
--sidebar-foreground: oklch(0.985 0 0);   /* putih */
--sidebar-primary: oklch(0.985 0 0);      /* aksen brand di sidebar (logo/aktif) */
--sidebar-primary-foreground: oklch(0.21 0.05 165);
--sidebar-accent: oklch(1 0 0 / 0.1);     /* hover/aktif translusen putih */
--sidebar-accent-foreground: oklch(0.985 0 0);
--sidebar-border: oklch(1 0 0 / 0.12);
--sidebar-ring: oklch(1 0 0 / 0.3);
```

Catatan: `--sidebar-primary` putih dipakai logo box `AppLogo` (warna putih di emerald), teks secondary di dalam sidebar turun-temurun dari `--sidebar-foreground`.

### 2. Gradasi sidebar (AppSidebar)

Di dalam `AppSidebar`, setelah `<Sidebar ...>` buka, tambah overlay dekoratif:

```tsx
<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
    <div className="absolute -top-24 -right-16 size-64 rounded-full bg-emerald-500/20 blur-3xl" />
    <div className="absolute bottom-0 left-0 size-40 rounded-full bg-emerald-400/10 blur-3xl" />
</div>
```

Parent `Sidebar` kontainer perlu `relative` — tidak mengubah `ui/sidebar.tsx`, cukup beri `className="relative overflow-hidden"` lewat prop pada `<Sidebar>` di AppSidebar (prop `className` sudah didukung). Overlay ditaruh sebelum konten/`SidebarHeader` agar konten tetap di atas (beri konten `relative z-10` bila perlu).

### 3. Background konten + header glassy (AppSidebarLayout)

- `AppContent` (variant sidebar) diberi `className` tambahan: `bg-gradient-to-br from-background via-background to-emerald-500/5 dark:to-emerald-500/10` — lewat prop `className` yang didukung.
- Tambah lapisan blob absolut `pointer-events-none` di dalam `AppContent`, di belakang `children`: dua blob blur (emerald/sky) sangat transparan (`/5`) di sudut. Karena `AppContent` punya `overflow-x-hidden` dan konten halaman memakai `PageContainer`, posisikan blob di area padding/sudut.
- Header `AppSidebarHeader`: tambah `bg-background/70 backdrop-blur-md` (+ pertahankan `border-b border-sidebar-border/50`). Glassy tanpa mengubah struktur.

### 4. StatCard (resources/js/components/dashboard/stat-card.tsx)

Props baru:

```ts
type Tone = 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
type StatCardProps = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    tone?: Tone;
};
```

Map tone → kelas ikon box (soft bg + text):

- emerald: `bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300`
- sky: `bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300`
- violet: `bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300`
- amber: `bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300`
- rose: `bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`

Rendering: CardHeader berisi `CardTitle` (label) + icon box; atau struktur: baris atas = icon box kiri + value kanan. Desain: header baris dengan label (muted) + box ikon di kanan; nilai `text-2xl font-semibold` di bawah. Default tone `emerald`, icon opsional (bila tidak ada, tampil tanpa box).

Update pemakaian di dashboard:
- `dashboard/admin.tsx`: Santri=GraduationCap/emerald, Ustadz=BookOpen/sky, Orang Tua=HeartHandshake/violet, Halaqah=FolderGit2/amber, Mutabaah=ClipboardCheck/rose.
- `dashboard/ustadz.tsx`: Halaqah=FolderGit2/emerald, Santri=GraduationCap/sky, Mutabaah=ClipboardCheck/violet.

Ikon diimpor dari `lucide-react`.

### 5. Progress bar (santri-progress-view.tsx)

Ubah `bg-primary` pada progress fill → `bg-gradient-to-r from-emerald-500 to-emerald-600` (+ `dark:` bila perlu). Minimum, cukup ganti fill jadi emerald solid/gradasi agar berwarna.

## Verifikasi

- `npx tsc --noEmit` bersih.
- `npm run build` (vite) sukses.
- `php artisan test --compact` → semua hijau (107 test).
- Cek visual browser light & dark: sidebar emerald, background beraksen, header glassy, stat cards berwarna; pastikan teks/ikon dan kontras terbaca; mode collapsed sidebar tetap rapi.
- Tidak ada perubahan pada `resources/js/components/ui/sidebar.tsx` (file shadcn tidak disentuh).

## Kriteria Sukses

- Sidebar berwarna emerald gelap di light & dark, item aktif terbaca (translusen putih).
- Background konten tidak lagi polos; blob/gradasi halus tidak mengganggu keterbacaan kartu/tabel/form.
- Stat cards punya ikon + warna soft per kartu.
- Welcome page & palet global (primary/button/form) tidak berubah.
- Semua test hijau, light & dark tampil konsisten.