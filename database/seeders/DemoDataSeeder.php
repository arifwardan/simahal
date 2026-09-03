<?php

namespace Database\Seeders;

use App\Enums\HalaqahStatus;
use App\Enums\MutabaahJenis;
use App\Enums\MutabaahStatus;
use App\Enums\SantriJenis;
use App\Enums\SantriStatus;
use App\Enums\TargetHafalanStatus;
use App\Enums\UserRole;
use App\Models\Halaqah;
use App\Models\Muhafidz;
use App\Models\Mutabaah;
use App\Models\OrangTua;
use App\Models\Santri;
use App\Models\TargetHafalan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // 4 muhafidz tambahan (total jadi 5 incl Ahmad dari DatabaseSeeder)
        $muhafidzData = [
            ['name' => 'Muhafidzah Fatimah', 'email' => 'fatimah@simahal.test', 'nama' => 'Muhafidzah Fatimah'],
            ['name' => 'Muhafidz Umar', 'email' => 'umar@simahal.test', 'nama' => 'Muhafidz Umar'],
            ['name' => 'Muhafidzah Khadijah', 'email' => 'khadijah@simahal.test', 'nama' => 'Muhafidzah Khadijah'],
            ['name' => 'Muhafidz Ali', 'email' => 'ali@simahal.test', 'nama' => 'Muhafidz Ali'],
        ];

        $muhafidzs = collect([$this->getMuhafidzByEmail('muhafidz@simahal.test')]);

        foreach ($muhafidzData as $d) {
            $user = User::firstOrCreate(
                ['email' => $d['email']],
                ['name' => $d['name'], 'password' => 'password', 'role' => UserRole::Muhafidz]
            );
            // ensure role
            if ($user->role !== UserRole::Muhafidz) {
                $user->update(['role' => UserRole::Muhafidz]);
            }
            $m = Muhafidz::firstOrCreate(
                ['user_id' => $user->id],
                ['nama' => $d['nama'], 'kontak' => '08'.fake()->numerify('##########')]
            );
            $muhafidzs->push($m);
        }

        // 6 halaqah dengan jam bervariasi
        $halaqahDefs = [
            ['nama' => 'Halaqah Fajar', 'jam_mulai' => '05:00', 'jam_selesai' => '06:00', 'midx' => 0],
            ['nama' => 'Halaqah Dhuha', 'jam_mulai' => '07:00', 'jam_selesai' => '08:30', 'midx' => 1],
            ['nama' => 'Halaqah Siang', 'jam_mulai' => '13:00', 'jam_selesai' => '14:00', 'midx' => 2],
            ['nama' => 'Halaqah Ashar', 'jam_mulai' => '15:30', 'jam_selesai' => '16:30', 'midx' => 3],
            ['nama' => 'Halaqah Maghrib', 'jam_mulai' => '18:30', 'jam_selesai' => '19:30', 'midx' => 4],
            ['nama' => 'Halaqah Isya', 'jam_mulai' => '20:00', 'jam_selesai' => '21:00', 'midx' => 0],
        ];

        $halaqahs = collect();
        foreach ($halaqahDefs as $def) {
            $muhafidz = $muhafidzs[$def['midx']] ?? $muhafidzs->first();
            $h = Halaqah::updateOrCreate(
                ['nama' => $def['nama']],
                [
                    'muhafidz_id' => $muhafidz->id,
                    'jadwal' => $def['nama'].' '.$def['jam_mulai'].'-'.$def['jam_selesai'],
                    'jam_mulai' => $def['jam_mulai'],
                    'jam_selesai' => $def['jam_selesai'],
                    'status' => HalaqahStatus::Aktif,
                ]
            );
            $halaqahs->push($h);
        }

        // Santri: buat 18 santri + ortu
        $santriNames = [
            'Ahmad Fauzi', 'Fatimah Zahra', 'Umar Abdullah', 'Khadijah Putri',
            'Ali Hasan', 'Aisyah Nur', 'Bilal Syah', 'Zainab Humaira',
            'Yusuf Karim', 'Maryam Qonita', 'Ibrahim Khalid', 'Hafsa Laila',
            'Utsman Farid', 'Ruqayyah Safa', 'Khalid Naufal', 'Siti Aminah',
            'Anas Malik', 'Huda Salma',
        ];

        $santris = collect();
        foreach ($santriNames as $i => $nama) {
            $nis = '2024'.str_pad((string) (102 + $i), 3, '0', STR_PAD_LEFT);
            $email = 'santri'.($i + 2).'@simahal.test';
            $user = User::firstOrCreate(
                ['email' => $email],
                ['name' => $nama, 'password' => 'password', 'role' => UserRole::Santri]
            );
            $jenis = $i % 2 === 0 ? SantriJenis::Ikhwan : SantriJenis::Akhwat;
            $santri = Santri::firstOrCreate(
                ['nis' => $nis],
                [
                    'user_id' => $user->id,
                    'nama' => $nama,
                    'tanggal_lahir' => Carbon::now()->subYears(fake()->numberBetween(10, 15))->subDays(rand(0, 300)),
                    'status' => SantriStatus::Aktif,
                    'jenis' => $jenis,
                    'halaman_awal' => fake()->numberBetween(0, 30),
                ]
            );
            // orang tua
            if (! $santri->orang_tua_id) {
                $ortuUser = User::firstOrCreate(
                    ['email' => 'ortu'.($i + 2).'@simahal.test'],
                    ['name' => 'Ortu '.$nama, 'password' => 'password', 'role' => UserRole::OrangTua]
                );
                $ortu = OrangTua::firstOrCreate(
                    ['user_id' => $ortuUser->id],
                    ['nama' => 'Ortu '.$nama, 'kontak' => '08'.fake()->numerify('##########')]
                );
                $santri->update(['orang_tua_id' => $ortu->id]);
            }
            $santris->push($santri);
        }

        // include santri awal Budi
        $budi = Santri::where('nis', '2024001')->first();
        if ($budi) {
            $santris->push($budi);
        }

        // attach santri ke halaqah (3-4 per halaqah)
        $allSantris = $santris->shuffle();
        $idx = 0;
        foreach ($halaqahs as $halaqah) {
            $count = fake()->numberBetween(3, 4);
            for ($c = 0; $c < $count; $c++) {
                $s = $allSantris[$idx % $allSantris->count()];
                $idx++;
                if (! $halaqah->santris()->where('santris.id', $s->id)->exists()) {
                    $halaqah->santris()->attach($s->id, ['joined_at' => now()->subDays(rand(10, 90)), 'status' => 'aktif']);
                }
            }
        }

        // Target hafalan: TOP 3 tinggi, 3 rendah, sisa menengah
        $topProgress = [520, 480, 450, 30, 45, 60];
        foreach ($santris->take(6) as $i => $s) {
            TargetHafalan::firstOrCreate(
                ['santri_id' => $s->id],
                [
                    'periode' => now()->year.'-'.(now()->year + 1),
                    'target' => 600,
                    'progress' => $topProgress[$i],
                    'status' => $topProgress[$i] >= 600 ? TargetHafalanStatus::Selesai : TargetHafalanStatus::Berlangsung,
                ]
            );
        }
        // sisa santri random 120-350
        foreach ($santris->slice(6) as $s) {
            if (! TargetHafalan::where('santri_id', $s->id)->exists()) {
                TargetHafalan::create([
                    'santri_id' => $s->id,
                    'periode' => now()->year.'-'.(now()->year + 1),
                    'target' => 600,
                    'progress' => fake()->numberBetween(120, 350),
                    'status' => TargetHafalanStatus::Berlangsung,
                ]);
            }
        }

        // Mutabaah: 55 records sebar 35 bulan ini, 15 bulan lalu, 5 lebih lama
        $surahs = ['Al-Baqarah', 'Ali Imran', 'An-Naba', 'An-Naziat', 'Al-Mulk', 'Yasin', 'Al-Fatihah', 'Al-Ikhlas'];
        $allMuhafidzIds = $muhafidzs->pluck('id')->all();
        $allSantriIds = $santris->pluck('id')->all();

        $createMutabaah = function (Carbon $date) use ($surahs, $allSantriIds, $allMuhafidzIds): void {
            $mulai = rand(1, 200);
            $attempts = 0;
            $tanggal = $date->toDateString();
            $santriId = fake()->randomElement($allSantriIds);
            do {
                $santriId = fake()->randomElement($allSantriIds);
                $tanggal = $date->copy()->addDays(rand(0, 2))->toDateString();
                $exists = Mutabaah::where('santri_id', $santriId)->whereDate('tanggal', $tanggal)->exists();
                $attempts++;
            } while ($exists && $attempts < 10);
            $existing = Mutabaah::where('santri_id', $santriId)->whereDate('tanggal', $tanggal)->first();
            $payload = [
                'muhafidz_id' => fake()->randomElement($allMuhafidzIds),
                'jenis' => fake()->randomElement([MutabaahJenis::Setoran, MutabaahJenis::Murajaah]),
                'surah' => fake()->randomElement($surahs),
                'ayat_mulai' => $mulai,
                'ayat_selesai' => $mulai + rand(3, 15),
                'nilai' => fake()->numberBetween(70, 100),
                'status' => fake()->randomElement([MutabaahStatus::Lulus, MutabaahStatus::Lulus, MutabaahStatus::Lulus, MutabaahStatus::Mengulang, MutabaahStatus::PerluMurajaah]),
                'catatan' => fake()->optional()->sentence(),
                'halaman' => fake()->numberBetween(1, 12),
            ];
            if ($existing) {
                $existing->update($payload);
            } else {
                Mutabaah::create(array_merge(['santri_id' => $santriId, 'tanggal' => $tanggal], $payload));
            }
        };

        // bulan ini 35
        for ($i = 0; $i < 35; $i++) {
            $createMutabaah(Carbon::now()->subDays(rand(0, 20)));
        }
        // bulan lalu 15
        for ($i = 0; $i < 15; $i++) {
            $createMutabaah(Carbon::now()->subMonth()->addDays(rand(0, 25)));
        }
        // lebih lama 5
        for ($i = 0; $i < 5; $i++) {
            $createMutabaah(Carbon::now()->subMonths(2)->addDays(rand(0, 20)));
        }

        // Pastikan TOP santri (3 pertama) punya mutabaah terbanyak tambahan
        $topSantris = $santris->take(3);
        foreach ($topSantris as $s) {
            for ($i = 0; $i < 4; $i++) {
                $tanggal = Carbon::now()->subDays($i)->toDateString();
                $existing = Mutabaah::where('santri_id', $s->id)->whereDate('tanggal', $tanggal)->first();
                $payload = [
                    'muhafidz_id' => $muhafidzs->random()->id,
                    'jenis' => MutabaahJenis::Setoran,
                    'surah' => fake()->randomElement($surahs),
                    'ayat_mulai' => rand(1, 100),
                    'ayat_selesai' => rand(101, 120),
                    'nilai' => fake()->numberBetween(85, 100),
                    'status' => MutabaahStatus::Lulus,
                    'halaman' => fake()->numberBetween(8, 15),
                ];
                if ($existing) {
                    $existing->update($payload);
                } else {
                    Mutabaah::create(array_merge(['santri_id' => $s->id, 'tanggal' => $tanggal], $payload));
                }
            }
        }
    }

    private function getMuhafidzByEmail(string $email): ?Muhafidz
    {
        $user = User::where('email', $email)->first();
        if (! $user) {
            return null;
        }

        return Muhafidz::where('user_id', $user->id)->first();
    }
}
