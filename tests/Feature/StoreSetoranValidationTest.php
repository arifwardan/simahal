<?php

use App\Http\Requests\Muhafidz\StoreSetoranRequest;
use App\Models\Halaqah;
use App\Models\HalaqahMember;
use App\Models\Muhafidz;
use App\Models\Santri;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    Route::post('/_test-setoran', function (StoreSetoranRequest $request) {
        return response()->json(['ok' => true]);
    })->middleware(['auth', 'verified', 'role:muhafidz']);
});

function validSetoranPayload(Halaqah $halaqah, Santri $santri, array $overrides = []): array
{
    return array_merge([
        'halaqah_id' => $halaqah->id,
        'santri_id' => $santri->id,
        'minggu' => now()->subWeek()->toDateString(),
        'harian' => [
            'senin' => 5,
            'selasa' => 5,
            'rabu' => 5,
            'kamis' => 5,
            'jumat' => 5,
            'sabtu' => 0,
            'ahad' => 0,
        ],
        'tasmi_pekan' => 80,
        'ujian_bulanan' => 85,
        'catatan_tasmi' => 'catatan tasmi',
        'catatan_ujian' => 'catatan ujian',
    ], $overrides);
}

it('rejects future minggu with 422', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $payload = validSetoranPayload($halaqah, $santri, ['minggu' => now()->addWeek()->toDateString()]);

    $this->actingAs($user)->postJson('/_test-setoran', $payload)->assertStatus(422)->assertJsonValidationErrors(['minggu']);
});

it('rejects halaman 31 with 422', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $payload = validSetoranPayload($halaqah, $santri, ['harian' => ['senin' => 31]]);

    $this->actingAs($user)->postJson('/_test-setoran', $payload)->assertStatus(422)->assertJsonValidationErrors(['harian.senin']);
});

it('rejects tasmi 200 with 422', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $payload = validSetoranPayload($halaqah, $santri, ['tasmi_pekan' => 200]);

    $this->actingAs($user)->postJson('/_test-setoran', $payload)->assertStatus(422)->assertJsonValidationErrors(['tasmi_pekan']);
});

it('rejects ujian_bulanan 200 with 422', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $payload = validSetoranPayload($halaqah, $santri, ['ujian_bulanan' => 200]);

    $this->actingAs($user)->postJson('/_test-setoran', $payload)->assertStatus(422)->assertJsonValidationErrors(['ujian_bulanan']);
});

it('rejects santri not in halaqah with 422', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    // no membership

    $payload = validSetoranPayload($halaqah, $santri);

    $this->actingAs($user)->postJson('/_test-setoran', $payload)->assertStatus(422)->assertJsonValidationErrors(['santri_id']);
});

it('forbids when muhafidz does not own halaqah with 403', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $other = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $other->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $payload = validSetoranPayload($halaqah, $santri);

    $this->actingAs($user)->postJson('/_test-setoran', $payload)->assertStatus(403);
});

it('accepts valid payload', function (): void {
    $muhafidz = Muhafidz::factory()->create();
    $user = $muhafidz->user;
    $halaqah = Halaqah::factory()->create(['muhafidz_id' => $muhafidz->id]);
    $santri = Santri::factory()->create();
    HalaqahMember::factory()->create(['halaqah_id' => $halaqah->id, 'santri_id' => $santri->id]);

    $payload = validSetoranPayload($halaqah, $santri);

    $this->actingAs($user)->postJson('/_test-setoran', $payload)->assertOk();
});
