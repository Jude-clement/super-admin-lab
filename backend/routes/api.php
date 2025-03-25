<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\LabController;
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

    Route::prefix('labs')->group(function () {
        Route::get('/', [LabController::class, 'index']); // List all labs
        Route::post('/', [LabController::class, 'store']); // Create new lab
        Route::get('/{lab}', [LabController::class, 'show']); // Show single lab
        Route::put('/{lab}', [LabController::class, 'update']); // Update lab
        Route::delete('/{lab}', [LabController::class, 'destroy']); // Delete lab
    });

});

