<?php

use App\Http\Controllers\Auth\JoinPondokController;
use App\Http\Controllers\Auth\RegisterPondokController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('guest')->group(function () {
    Route::get('register-pondok', [RegisterPondokController::class, 'index'])->name('register-pondok');
    Route::post('register-pondok', [RegisterPondokController::class, 'store'])->name('register-pondok.store');
    Route::get('join-pondok', [JoinPondokController::class, 'index'])->name('join-pondok');
    Route::post('join-pondok', [JoinPondokController::class, 'store'])->name('join-pondok.store');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

require __DIR__.'/settings.php';

require __DIR__.'/admin.php';

require __DIR__.'/muhafidz.php';

require __DIR__.'/orang-tua.php';

require __DIR__.'/santri.php';
