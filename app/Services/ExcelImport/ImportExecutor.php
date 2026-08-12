<?php

namespace App\Services\ExcelImport;

use App\Enums\HalaqahMemberStatus;
use App\Enums\HalaqahStatus;
use App\Enums\SantriStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Santri;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Support\Facades\DB;

class ImportExecutor
{
    public function execute(ImportPlan $plan): ImportResult
    {
        $result = new ImportResult;
        /** @var array<string, Ustadz> $ustadzByNama */
        $ustadzByNama = [];
        /** @var array<string, Halaqah> $halaqahByKey */
        $halaqahByKey = [];

        DB::transaction(function () use ($plan, $result, &$ustadzByNama, &$halaqahByKey): void {
            foreach ($plan->items as $item) {
                $this->executeItem($item, $result, $ustadzByNama, $halaqahByKey);
            }
        });

        return $result;
    }

    /** @param  array<string, Ustadz>  $ustadzByNama */
    /** @param  array<string, Halaqah>  $halaqahByKey */
    private function executeItem(ImportPlanItem $item, ImportResult $result, array &$ustadzByNama, array &$halaqahByKey): void
    {
        if ($item->action === ImportAction::Placeholder || $item->action === ImportAction::Error) {
            return;
        }

        if ($item->type === 'ustadz') {
            $normalized = $item->extra['muhafidz_normalized'];
            if ($item->action === ImportAction::Create) {
                $user = $this->createUser($item->nama, $item->email, UserRole::Ustadz);
                $ustadz = Ustadz::create(['user_id' => $user->id, 'nama' => $item->nama]);
                $ustadzByNama[$normalized] = $ustadz;
                $result->ustadzCreated++;
                $result->emailsCreated[] = $item->email;
            } else {
                $ustadz = Ustadz::findOrFail($item->existingId);
                $ustadz->update(['nama' => $item->nama]);
                $ustadzByNama[$normalized] = $ustadz;
                $result->ustadzUpdated++;
            }

            return;
        }

        if ($item->type === 'halaqah') {
            $ustadz = $ustadzByNama[$item->extra['muhafidz_normalized']] ?? null;
            if ($ustadz === null) {
                throw new \RuntimeException('Ustadz untuk halaqah belum tersedia.');
            }
            if ($item->action === ImportAction::Create) {
                $halaqah = Halaqah::create([
                    'nama' => $item->nama,
                    'ustadz_id' => $ustadz->id,
                    'status' => HalaqahStatus::Aktif->value,
                ]);
                $result->halaqahCreated++;
            } else {
                $halaqah = Halaqah::findOrFail($item->existingId);
                $halaqah->update(['nama' => $item->nama, 'ustadz_id' => $ustadz->id]);
                $result->halaqahUpdated++;
            }
            $halaqahByKey[$item->groupKey] = $halaqah;

            return;
        }

        // santri
        if ($item->action === ImportAction::Create) {
            $user = $this->createUser($item->nama, $item->email, UserRole::Santri);
            $santri = Santri::create([
                'user_id' => $user->id,
                'nis' => $item->nis,
                'nama' => $item->nama,
                'status' => SantriStatus::Aktif,
                'halaman_awal' => $item->halamanAwal,
                'jenis' => $item->jenis,
            ]);
            $this->attachToHalaqah($santri, $item->groupKey, $halaqahByKey);
            $result->santriCreated++;
            $result->emailsCreated[] = $item->email;
        } else {
            $santri = Santri::findOrFail($item->existingId);
            $santri->update([
                'halaman_awal' => $item->halamanAwal,
                'jenis' => $item->jenis,
            ]);
            $this->attachToHalaqah($santri, $item->groupKey, $halaqahByKey);
            $result->santriUpdated++;
        }
    }

    private function createUser(string $name, string $email, UserRole $role): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => ImportPlanner::DEFAULT_PASSWORD,
            'role' => $role,
        ]);
    }

    /** @param  array<string, Halaqah>  $halaqahByKey */
    private function attachToHalaqah(Santri $santri, string $groupKey, array $halaqahByKey): void
    {
        $halaqah = $halaqahByKey[$groupKey] ?? null;
        if ($halaqah === null) {
            throw new \RuntimeException('Halaqah untuk santri belum tersedia.');
        }
        $santri->halaqahs()->syncWithoutDetaching([$halaqah->id => [
            'joined_at' => now(),
            'status' => HalaqahMemberStatus::Aktif->value,
        ]]);
    }
}
