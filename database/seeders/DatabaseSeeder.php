<?php

namespace Database\Seeders;

use App\Enums\HalaqahStatus;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->role(UserRole::Admin)->create([
            'name' => 'Admin SIMAHAL',
            'email' => 'admin@simahal.test',
            'password' => 'password',
        ]);

        $ustadzUser = User::factory()->role(UserRole::Ustadz)->create([
            'name' => 'Ustadz Ahmad',
            'email' => 'ustadz@simahal.test',
            'password' => 'password',
        ]);
        $ustadz = Ustadz::factory()->create([
            'user_id' => $ustadzUser->id,
            'nama' => 'Ustadz Ahmad',
            'kontak' => '081234567890',
        ]);

        $santriUser = User::factory()->role(UserRole::Santri)->create([
            'name' => 'Santri Budi',
            'email' => 'santri@simahal.test',
            'password' => 'password',
        ]);
        $santri = Santri::factory()->create([
            'user_id' => $santriUser->id,
            'nis' => '2024001',
            'nama' => 'Santri Budi',
            'tanggal_lahir' => '2012-05-14',
        ]);

        $orangTuaUser = User::factory()->role(UserRole::OrangTua)->create([
            'name' => 'Bapak Budi',
            'email' => 'ortu@simahal.test',
            'password' => 'password',
        ]);
        $orangTua = OrangTua::factory()->create([
            'user_id' => $orangTuaUser->id,
            'nama' => 'Bapak Budi',
            'kontak' => '089876543210',
        ]);

        $santri->update(['orang_tua_id' => $orangTua->id]);

        $halaqah = Halaqah::factory()->create([
            'nama' => 'Halaqah Fajar',
            'ustadz_id' => $ustadz->id,
            'jadwal' => 'Setiap pagi setelah Subuh, Masjid PondokIT',
            'status' => HalaqahStatus::Aktif,
        ]);

        $halaqah->santris()->attach($santri->id, ['joined_at' => now(), 'status' => 'aktif']);

        TargetHafalan::factory()->create([
            'santri_id' => $santri->id,
            'periode' => now()->year.'-'.(now()->year + 1),
            'target' => 1140,
            'progress' => 0,
            'status' => TargetHafalanStatus::Berlangsung,
        ]);

        Mutabaah::factory()->create([
            'santri_id' => $santri->id,
            'ustadz_id' => $ustadz->id,
            'tanggal' => now(),
            'jenis' => MutabaahJenis::Setoran,
            'surah' => 'Al-Fatihah',
            'ayat_mulai' => 1,
            'ayat_selesai' => 7,
            'nilai' => 95,
            'status' => MutabaahStatus::Lulus,
            'catatan' => 'Lancar, tajwid baik.',
        ]);
    }
}
