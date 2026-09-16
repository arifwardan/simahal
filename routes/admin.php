<?php

use App\Http\Controllers\Admin\ExcelImportController;
use App\Http\Controllers\Admin\HalaqahController;
use App\Http\Controllers\Admin\MuhafidzController;
use App\Http\Controllers\Admin\MutabaahBulananDashboardController;
use App\Http\Controllers\Admin\MutabaahHistoryController;
use App\Http\Controllers\Admin\MutabaahSettingController;
use App\Http\Controllers\Admin\OrangTuaController;
use App\Http\Controllers\Admin\SantriController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('users/{user}/approve', [UserController::class, 'approve'])->name('users.approve');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::patch('santris/{santri}/orang-tua', [UserController::class, 'assignOrangTua'])->name('santris.assign-orang-tua');

    Route::get('santris', [SantriController::class, 'index'])->name('santris.index');
    Route::post('santris', [SantriController::class, 'store'])->name('santris.store');
    Route::patch('santris/{santri}', [SantriController::class, 'update'])->name('santris.update');
    Route::delete('santris/{santri}', [SantriController::class, 'destroy'])->name('santris.destroy');

    Route::get('muhafidzs', [MuhafidzController::class, 'index'])->name('muhafidzs.index');
    Route::post('muhafidzs', [MuhafidzController::class, 'store'])->name('muhafidzs.store');
    Route::patch('muhafidzs/{muhafidz}', [MuhafidzController::class, 'update'])->name('muhafidzs.update');
    Route::delete('muhafidzs/{muhafidz}', [MuhafidzController::class, 'destroy'])->name('muhafidzs.destroy');

    Route::get('orang-tuas', [OrangTuaController::class, 'index'])->name('orang-tuas.index');
    Route::post('orang-tuas', [OrangTuaController::class, 'store'])->name('orang-tuas.store');
    Route::patch('orang-tuas/{orangTua}', [OrangTuaController::class, 'update'])->name('orang-tuas.update');
    Route::delete('orang-tuas/{orangTua}', [OrangTuaController::class, 'destroy'])->name('orang-tuas.destroy');

    Route::get('halaqahs', [HalaqahController::class, 'index'])->name('halaqahs.index');
    Route::post('halaqahs', [HalaqahController::class, 'store'])->name('halaqahs.store');
    Route::patch('halaqahs/{halaqah}', [HalaqahController::class, 'update'])->name('halaqahs.update');
    Route::delete('halaqahs/{halaqah}', [HalaqahController::class, 'destroy'])->name('halaqahs.destroy');

    Route::get('mutabaah-bulanan', [MutabaahBulananDashboardController::class, 'index'])->name('mutabaah-bulanan.index');
    Route::get('mutabaah/riwayat', [MutabaahHistoryController::class, 'index'])->name('mutabaahs.history');
    Route::get('mutabaah-settings', [MutabaahSettingController::class, 'edit'])->name('mutabaah-settings.edit');
    Route::put('mutabaah-settings', [MutabaahSettingController::class, 'update'])->name('mutabaah-settings.update');

    Route::get('excel-import', [ExcelImportController::class, 'index'])->name('excel-import.index');
    Route::post('excel-import/preview', [ExcelImportController::class, 'preview'])->name('excel-import.preview');
    Route::post('excel-import/execute', [ExcelImportController::class, 'execute'])->name('excel-import.execute');
});
