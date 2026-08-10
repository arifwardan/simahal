<?php

use App\Http\Controllers\Ustadz\HalaqahController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:ustadz'])->prefix('ustadz')->name('ustadz.')->group(function () {
    Route::get('halaqah-saya', [HalaqahController::class, 'index'])->name('halaqahs.index');
});
