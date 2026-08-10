<?php

use App\Http\Controllers\Ustadz\HalaqahController;
use App\Http\Controllers\Ustadz\MutabaahController;
use App\Http\Controllers\Ustadz\MutabaahHistoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:ustadz'])->prefix('ustadz')->name('ustadz.')->group(function () {
    Route::get('halaqah-saya', [HalaqahController::class, 'index'])->name('halaqahs.index');
    Route::get('halaqah-saya/{halaqah}/santri', [HalaqahController::class, 'santris'])->name('halaqahs.santris.show');
    Route::get('mutabaah/{santri}/baru', [MutabaahController::class, 'create'])->name('mutabaahs.create');
    Route::post('mutabaah', [MutabaahController::class, 'store'])->name('mutabaahs.store');
    Route::get('mutabaah/riwayat', [MutabaahHistoryController::class, 'index'])->name('mutabaahs.history');
});
