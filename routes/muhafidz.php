<?php

use App\Http\Controllers\Muhafidz\HalaqahController;
use App\Http\Controllers\Muhafidz\MutabaahBulananController;
use App\Http\Controllers\Muhafidz\MutabaahController;
use App\Http\Controllers\Muhafidz\MutabaahHistoryController;
use App\Http\Controllers\Muhafidz\TargetHafalanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:muhafidz'])->prefix('muhafidz')->name('muhafidz.')->group(function () {
    Route::get('halaqah-saya', [HalaqahController::class, 'index'])->name('halaqahs.index');
    Route::get('halaqah-saya/{halaqah}/santri', [HalaqahController::class, 'santris'])->name('halaqahs.santris.show');
    Route::post('mutabaah', [MutabaahController::class, 'store'])->name('mutabaahs.store');
    Route::post('mutabaah-bulanan/{bulan}', [MutabaahBulananController::class, 'update'])
        ->whereNumber('bulan')
        ->name('mutabaah-bulanan.update');
    Route::get('mutabaah/riwayat', [MutabaahHistoryController::class, 'index'])->name('mutabaahs.history');
    Route::get('target-hafalan', [TargetHafalanController::class, 'index'])->name('targets.index');
    Route::post('target-hafalan', [TargetHafalanController::class, 'store'])->name('targets.store');
    Route::patch('target-hafalan/{targetHafalan}', [TargetHafalanController::class, 'update'])->name('targets.update');
    Route::delete('target-hafalan/{targetHafalan}', [TargetHafalanController::class, 'destroy'])->name('targets.destroy');
});
