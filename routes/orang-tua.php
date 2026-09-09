<?php

use App\Http\Controllers\OrangTua\PrestasiController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:orang_tua'])->prefix('orang-tua')->name('orang-tua.')->group(function () {
    Route::get('prestasi', [PrestasiController::class, 'index'])->name('prestasi.index');
});
