<?php

use App\Http\Controllers\Admin\SantriController;
use App\Http\Controllers\Admin\UserController;
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
});
