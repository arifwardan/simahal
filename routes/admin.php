<?php

use App\Http\Controllers\Admin\OrangTuaController;
use App\Http\Controllers\Admin\SantriController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UstadzController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('santris', [SantriController::class, 'index'])->name('santris.index');
    Route::post('santris', [SantriController::class, 'store'])->name('santris.store');
    Route::patch('santris/{santri}', [SantriController::class, 'update'])->name('santris.update');
    Route::delete('santris/{santri}', [SantriController::class, 'destroy'])->name('santris.destroy');

    Route::get('ustadzs', [UstadzController::class, 'index'])->name('ustadzs.index');
    Route::post('ustadzs', [UstadzController::class, 'store'])->name('ustadzs.store');
    Route::patch('ustadzs/{ustadz}', [UstadzController::class, 'update'])->name('ustadzs.update');
    Route::delete('ustadzs/{ustadz}', [UstadzController::class, 'destroy'])->name('ustadzs.destroy');

    Route::get('orang-tuas', [OrangTuaController::class, 'index'])->name('orang-tuas.index');
    Route::post('orang-tuas', [OrangTuaController::class, 'store'])->name('orang-tuas.store');
    Route::patch('orang-tuas/{orangTua}', [OrangTuaController::class, 'update'])->name('orang-tuas.update');
    Route::delete('orang-tuas/{orangTua}', [OrangTuaController::class, 'destroy'])->name('orang-tuas.destroy');
});
