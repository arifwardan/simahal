<?php

use App\Http\Controllers\Santri\PrestasiController;
use App\Http\Controllers\Santri\TargetHafalanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:santri'])->prefix('santri')->name('santri.')->group(function () {
    Route::get('target-hafalan', [TargetHafalanController::class, 'index'])->name('targets.index');
    Route::post('target-hafalan', [TargetHafalanController::class, 'store'])->name('targets.store');
    Route::patch('target-hafalan/{targetHafalan}', [TargetHafalanController::class, 'update'])->name('targets.update');
    Route::delete('target-hafalan/{targetHafalan}', [TargetHafalanController::class, 'destroy'])->name('targets.destroy');

    Route::get('prestasi', [PrestasiController::class, 'index'])->name('prestasi.index');
});
