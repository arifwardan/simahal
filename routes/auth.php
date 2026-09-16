<?php

use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

Route::get('register', [RegisterController::class, 'show'])->name('register');
Route::post('register', [RegisterController::class, 'store'])->name('register.store');
