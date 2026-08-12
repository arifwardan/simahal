<?php

namespace App\Services\ExcelImport;

use App\Models\Halaqah;
use App\Models\MutabaahSetting;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final class ImportPlanner
{
    public const DEFAULT_PASSWORD = 'password';

    public const EMAIL_DOMAIN = 'simahal.test';

    public function plan(ParsedWorkbook $wb): ImportPlan
    {
        $items = collect();

        // Indeks data existing (skala kecil, aman dimuat penuh).
        $existingUsers = User::query()->pluck('email');
        $usedEmails = $existingUsers->map(fn (string $e) => strtolower($e))->flip();
        $existingUstadzs = Ustadz::query()->get()->keyBy(fn (Ustadz $u) => (new ExcelReader)->normalizeName($u->nama));
        $existingHalaqahs = Halaqah::query()->get()->keyBy(fn (Halaqah $h) => (new ExcelReader)->normalizeName($h->nama));
        $existingSantris = Santri::query()->get()->keyBy(fn (Santri $s) => (new ExcelReader)->normalizeName($s->nama).'|'.($s->jenis?->value ?? ''));

        // NIS: nomor urut berikutnya untuk tahun aktif.
        $tahun = MutabaahSetting::setting()->tahun_aktif;
        $maxSeq = 0;
        foreach (Santri::query()->pluck('nis') as $nis) {
            if (is_string($nis) && preg_match('/^SIM-'.$tahun.'-(\d{4})$/', $nis, $m) === 1) {
                $maxSeq = max($maxSeq, (int) $m[1]);
            }
        }
        $nisSeq = $maxSeq;

        // 1) Ustadz unik per muhafidz asli.
        $ustadzForNama = [];
        foreach ($wb->groups as $group) {
            if (! $group->isRealMuhafidz) {
                continue;
            }
            $normalized = (new ExcelReader)->normalizeName($group->muhafidz);
            if (isset($ustadzForNama[$normalized])) {
                continue;
            }
            $ustadzForNama[$normalized] = $normalized;
            $existing = $existingUstadzs->get($normalized);
            $email = $this->uniqueEmail($normalized, $usedEmails);
            $items->push(new ImportPlanItem(
                type: 'ustadz',
                action: $existing ? ImportAction::Update : ImportAction::Create,
                groupKey: $group->jenis.'-'.$group->kelompok,
                nama: trim($group->muhafidz),
                email: $email,
                existingId: $existing?->id,
                extra: ['muhafidz_normalized' => $normalized],
            ));
        }

        // 2) Halaqah per grup (hanya grup dengan muhafidz asli).
        $halaqahForKey = [];
        foreach ($wb->groups as $group) {
            if (! $group->isRealMuhafidz) {
                continue;
            }
            $key = $group->jenis.'-'.$group->kelompok;
            $name = 'Kelompok '.str_replace('Kelompok ', '', $group->kelompok).' '.ucfirst(strtolower($group->jenis));
            $existing = $existingHalaqahs->get((new ExcelReader)->normalizeName($name));
            $halaqahForKey[$key] = $name;
            $items->push(new ImportPlanItem(
                type: 'halaqah',
                action: $existing ? ImportAction::Update : ImportAction::Create,
                groupKey: $key,
                nama: $name,
                existingId: $existing?->id,
                extra: ['muhafidz_normalized' => (new ExcelReader)->normalizeName($group->muhafidz)],
            ));
        }

        // 3) Santri.
        foreach ($wb->santris as $santri) {
            $key = $santri->jenis.'-'.$santri->kelompok;
            $group = collect($wb->groups)->first(fn ($g) => $g->jenis.'-'.$g->kelompok === $key);

            if (! $santri->isReal) {
                $items->push(new ImportPlanItem(
                    type: 'santri',
                    action: ImportAction::Placeholder,
                    groupKey: $key,
                    nama: $santri->nama === '' ? '(kosong)' : $santri->nama,
                    reason: 'Placeholder (nama N/kosong).',
                ));

                continue;
            }

            if (! in_array(strtolower($santri->jenis), ['ikhwan', 'akhwat'], true)) {
                $items->push(new ImportPlanItem(
                    type: 'santri',
                    action: ImportAction::Error,
                    groupKey: $key,
                    nama: $santri->nama,
                    reason: 'Jenis tidak dikenali: '.$santri->jenis.'.',
                ));

                continue;
            }

            if ($group === null || ! $group->isRealMuhafidz) {
                $items->push(new ImportPlanItem(
                    type: 'santri',
                    action: ImportAction::Error,
                    groupKey: $key,
                    nama: $santri->nama,
                    reason: 'Grup tidak memiliki muhafidz asli.',
                ));

                continue;
            }

            $existing = $existingSantris->get($santri->normalizedNama.'|'.strtolower($santri->jenis));
            $nis = null;
            if ($existing === null) {
                $nisSeq++;
                $nis = sprintf('SIM-%d-%04d', $tahun, $nisSeq);
            }

            $items->push(new ImportPlanItem(
                type: 'santri',
                action: $existing ? ImportAction::Update : ImportAction::Create,
                groupKey: $key,
                nama: trim($santri->nama),
                email: $existing ? null : $this->uniqueEmail($santri->normalizedNama, $usedEmails),
                nis: $nis,
                jenis: strtolower($santri->jenis),
                kelompok: $santri->kelompok,
                halamanAwal: $santri->halamanAwal,
                existingId: $existing?->id,
                reason: $existing ? 'Sudah ada — halaman awal diperbarui.' : null,
            ));
        }

        return new ImportPlan($items);
    }

    /** @param  Collection<string, int>  $usedEmails */
    private function uniqueEmail(string $normalizedNama, Collection &$usedEmails): string
    {
        $base = Str::slug($normalizedNama).'@'.self::EMAIL_DOMAIN;
        $candidate = $base;
        $i = 2;
        while ($usedEmails->has($candidate)) {
            $candidate = Str::slug($normalizedNama).'-'.$i.'@'.self::EMAIL_DOMAIN;
            $i++;
        }
        $usedEmails->put($candidate, 1);

        return $candidate;
    }
}
