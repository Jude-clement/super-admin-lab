<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\LabController;
use App\Http\Controllers\API\LicenseController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/refresh', [AuthController::class, 'refresh']);
Route::post('/licenses/validate', [LicenseController::class, 'validateToken']); // Public token validation

// Protected routes (require authentication)
Route::middleware(['auth:sanctum'])->group(function () {
    // Authentication routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    
    // User management
    Route::apiResource('users', UserController::class)->except(['create', 'edit']);

    // Labs management
    Route::prefix('labs')->group(function () {
        Route::get('/', [LabController::class, 'index']);
        Route::post('/', [LabController::class, 'store']);
        Route::get('/{lab}', [LabController::class, 'show']);
        Route::put('/{lab}', [LabController::class, 'update']);
        Route::delete('/{lab}', [LabController::class, 'destroy']);
        
        // Lab-specific license routes
        Route::get('/{lab}/licenses', [LicenseController::class, 'labLicenses']);
    });

    // Licenses management
    Route::prefix('licenses')->group(function () {
        Route::get('/', [LicenseController::class, 'index']);
        Route::post('/', [LicenseController::class, 'store']);
        Route::post('/generate-token', [LicenseController::class, 'generateToken']); // Token generation endpoint
        Route::get('/{license}', [LicenseController::class, 'show']);
        Route::put('/{license}', [LicenseController::class, 'update']);
        Route::delete('/{license}', [LicenseController::class, 'destroy']);
        
        // License status management
        Route::post('/{license}/activate', [LicenseController::class, 'activate']);
        Route::post('/{license}/deactivate', [LicenseController::class, 'deactivate']);
        
        // License utilities
        Route::post('/check-expiry', [LicenseController::class, 'checkExpiry']);
        Route::get('/{license}/validate', [LicenseController::class, 'validateLicense']);
    });

    // System maintenance
    Route::prefix('system')->group(function () {
        Route::post('/licenses/expire-old', [LicenseController::class, 'expireOldLicenses']);
    });
});

// Fallback route
Route::fallback(function () {
    return response()->json([
        'message' => 'Endpoint not found'
    ], 404);
});