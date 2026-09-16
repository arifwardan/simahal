<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

Route::middleware('guest')->group(function () {
    require __DIR__.'/auth.php';
});

require __DIR__.'/settings.php';

require __DIR__.'/admin.php';

require __DIR__.'/muhafidz.php';

require __DIR__.'/orang-tua.php';

require __DIR__.'/santri.php';
