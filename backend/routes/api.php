<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\LabController;
use App\Http\Controllers\API\LicenseController;
// Public routes
// Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/refresh', [AuthController::class, 'refresh']); // Add this new route

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']); //shows current logged in user's profile
    
    // User management routes
    Route::apiResource('users', UserController::class); //for CRUD operations on users

// Labs Routes
Route::prefix('labs')->group(function () {
    Route::get('/', [LabController::class, 'index']);
    Route::post('/', [LabController::class, 'store']);
    Route::get('/{lab}', [LabController::class, 'show']);
    Route::put('/{lab}', [LabController::class, 'update']);
    Route::delete('/{lab}', [LabController::class, 'destroy']);
});

// Licenses Routes
Route::prefix('licenses')->group(function () {
    Route::get('/', [LicenseController::class, 'index']);
    Route::post('/', [LicenseController::class, 'store']);
    Route::get('/{license}', [LicenseController::class, 'show']);
    Route::put('/{license}', [LicenseController::class, 'update']);
    Route::delete('/{license}', [LicenseController::class, 'destroy']);
    
    // Additional license-specific routes
    Route::post('/{license}/activate', [LicenseController::class, 'activate']);
    Route::post('/{license}/deactivate', [LicenseController::class, 'deactivate']);
});

});

