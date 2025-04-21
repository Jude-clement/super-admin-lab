<?php

namespace App\Http\Controllers\API;

use App\Models\License;
use App\Models\Lab;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use App\Services\LicenseService;
use Illuminate\Support\Facades\Log;

class LicenseController extends Controller
{
    protected $licenseService;

    public function __construct()
    {
        $this->licenseService = new LicenseService();
    }

    public function index()
    {
        return response()->json([
            'result' => true,
            'data' => License::with('lab')
                        ->orderBy('expiry_date', 'desc')
                        ->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:labs,lab_id',
            'issued_date' => 'required|date_format:Y-m-d H:i:s',
            'expiry_date' => 'required|date_format:Y-m-d H:i:s|after:issued_date',
        ]);
    
        // Parse dates with proper timezone handling
        $timezone = 'Asia/Kolkata';
        $issuedDate = Carbon::createFromFormat('Y-m-d H:i:s', $validated['issued_date'], $timezone);
        $expiryDate = Carbon::createFromFormat('Y-m-d H:i:s', $validated['expiry_date'], $timezone);
        $now = Carbon::now($timezone);
    
        // Generate encrypted JWT token
        $token = $this->licenseService->generateTokenForLab(
            $validated['client_id'],
            $issuedDate,
            $expiryDate
        );
    
        // Determine status based on current time
        $isActive = $now->between($issuedDate, $expiryDate);
        $status = $isActive ? License::ACTIVE : License::DEACTIVATED;
    
        // Create license with proper status
        $license = License::create([
            'client_id' => $validated['client_id'],
            'license_key' => $token,
            'issued_date' => $issuedDate,
            'expiry_date' => $expiryDate,
            'status' => $status
        ]);
    
        // Update lab status - ensure all fields are synchronized
        Lab::where('lab_id', $validated['client_id'])
           ->update([
               'license_status' => $status ? 'active' : 'inactive',
               'numeric_status' => $status
           ]);
    
        return response()->json([
            'result' => true,
            'data' => $license->load('lab'),
            'token' => $token,
            'message' => 'License created successfully',
            'status_info' => [
                'license_status' => $status,
                'lab_license_status' => $status ? 'active' : 'inactive',
                'lab_numeric_status' => $status,
                'is_active' => $isActive,
                'current_time' => $now->format('Y-m-d H:i:s'),
                'timezone' => $timezone
            ]
        ], 201);
    }

    public function generateToken(Request $request)
    {
        $validated = $request->validate([
            'lab_id' => 'required|exists:labs,lab_id',
            'issued_at' => 'required|date_format:Y-m-d H:i:s',
            'expires_at' => 'required|date_format:Y-m-d H:i:s|after:issued_at'
        ]);

        $token = $this->licenseService->generateTokenForLab(
            $validated['lab_id'],
            Carbon::createFromFormat('Y-m-d H:i:s', $validated['issued_at']),
            Carbon::createFromFormat('Y-m-d H:i:s', $validated['expires_at'])
        );

        return response()->json([
            'result' => true,
            'token' => $token,
            'expires_at' => $validated['expires_at']
        ]);
    }

    public function show(License $license)
    {
        try {
            $isValid = $this->licenseService->validateToken($license->license_key);
            $tokenData = $this->licenseService->getTokenData($license->license_key);

            $now = Carbon::now();
            $isActive = $now->between(
                Carbon::parse($license->issued_date),
                Carbon::parse($license->expiry_date)
            );

            return response()->json([
                'result' => true,
                'data' => array_merge(
                    $license->load('lab')->toArray(),
                    [
                        'token_valid' => $isValid,
                        'token_data' => $tokenData,
                        'is_active' => $isActive,
                        'correct_status' => $license->status === ($isActive ? License::ACTIVE : License::DEACTIVATED)
                    ]
                )
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to show license: " . $e->getMessage());
            return response()->json([
                'result' => false,
                'message' => 'Failed to retrieve license information'
            ], 500);
        }
    }

    public function update(Request $request, License $license)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:labs,lab_id',
            'issued_date' => [
                'sometimes',
                'date',
                function ($attribute, $value, $fail) {
                    if (!Carbon::hasFormat($value, 'Y-m-d H:i:s') && !Carbon::hasFormat($value, 'Y-m-d')) {
                        $fail('The '.$attribute.' must be in Y-m-d H:i:s or Y-m-d format.');
                    }
                }
            ],
            'expiry_date' => [
                'sometimes',
                'date',
                'after:issued_date',
                function ($attribute, $value, $fail) {
                    if (!Carbon::hasFormat($value, 'Y-m-d H:i:s') && !Carbon::hasFormat($value, 'Y-m-d')) {
                        $fail('The '.$attribute.' must be in Y-m-d H:i:s or Y-m-d format.');
                    }
                }
            ],
            'status' => 'sometimes|integer|in:0,1'
        ]);
    
        // Format dates if they exist
        if (isset($validated['issued_date']) && !Carbon::hasFormat($validated['issued_date'], 'Y-m-d H:i:s')) {
            $validated['issued_date'] = Carbon::parse($validated['issued_date'])->format('Y-m-d H:i:s');
        }
    
        if (isset($validated['expiry_date']) && !Carbon::hasFormat($validated['expiry_date'], 'Y-m-d H:i:s')) {
            $validated['expiry_date'] = Carbon::parse($validated['expiry_date'])->format('Y-m-d H:i:s');
        }
    
        // Regenerate encrypted token if expiry date changed
        if (isset($validated['expiry_date'])) {
            $validated['license_key'] = $this->licenseService->generateTokenForLab(
                $license->client_id,
                isset($validated['issued_date']) 
                    ? Carbon::parse($validated['issued_date'])
                    : Carbon::parse($license->issued_date),
                Carbon::parse($validated['expiry_date'])
            );
        }
    
        $license->update($validated);
    
        // Update lab status if changed (convert to string)
        if (isset($validated['status'])) {
            Lab::where('lab_id', $license->client_id)
               ->update([
                   'license_status' => $validated['status'] ? 'active' : 'inactive',
                   'numeric_status' => $validated['status']
               ]);
        }
    
        return response()->json([
            'result' => true,
            'data' => $license->load('lab'),
            'message' => 'License updated successfully'
        ]);
    }

    public function destroy(License $license)
    {
        try {
            $labId = $license->client_id;
            $license->delete();

            // Update lab status if no licenses left
            if (License::where('client_id', $labId)->count() === 0) {
                Lab::where('lab_id', $labId)
                   ->update([
                       'license_status' => 'inactive',
                       'numeric_status' => License::DEACTIVATED
                   ]);
            }

            return response()->json([
                'result' => true,
                'message' => 'License deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to delete license: " . $e->getMessage());
            return response()->json([
                'result' => false,
                'message' => 'Failed to delete license'
            ], 500);
        }
    }

    public function activate(License $license)
    {
        try {
            $license->update(['status' => License::ACTIVE]);
            Lab::where('lab_id', $license->client_id)
               ->update([
                   'license_status' => 'active',
                   'numeric_status' => License::ACTIVE
               ]);

            return response()->json([
                'result' => true,
                'message' => 'License activated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to activate license: " . $e->getMessage());
            return response()->json([
                'result' => false,
                'message' => 'Failed to activate license'
            ], 500);
        }
    }

    public function deactivate(License $license)
    {
        try {
            $license->update(['status' => License::DEACTIVATED]);
            
            if (License::where('client_id', $license->client_id)
                     ->where('status', License::ACTIVE)
                     ->count() === 0) {
                Lab::where('lab_id', $license->client_id)
                   ->update([
                       'license_status' => 'inactive',
                       'numeric_status' => License::DEACTIVATED
                   ]);
            }

            return response()->json([
                'result' => true,
                'message' => 'License deactivated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to deactivate license: " . $e->getMessage());
            return response()->json([
                'result' => false,
                'message' => 'Failed to deactivate license'
            ], 500);
        }
    }

    public function checkExpiry()
    {
        try {
            $expiredLicenses = License::where('expiry_date', '<', Carbon::now())
                                     ->where('status', '!=', License::DEACTIVATED)
                                     ->get();

            foreach ($expiredLicenses as $license) {
                $license->update(['status' => License::DEACTIVATED]);
                Lab::where('lab_id', $license->client_id)
                   ->update([
                       'license_status' => 'inactive',
                       'numeric_status' => License::DEACTIVATED
                   ]);
            }

            return response()->json([
                'result' => true,
                'message' => 'Expired licenses processed',
                'count' => $expiredLicenses->count()
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to check license expiry: " . $e->getMessage());
            return response()->json([
                'result' => false,
                'message' => 'Failed to process expired licenses'
            ], 500);
        }
    }

    public function validateToken(Request $request)
    {
        try {
            $validated = $request->validate([
                'token' => 'required|string'
            ]);

            $validation = $this->licenseService->validateTokenWithDates($validated['token']);

            return response()->json([
                'valid' => $validation['valid'] ?? false,
                'data' => [
                    'issued_at' => $validation['issued_at'] ?? null,
                    'expires_at' => $validation['expires_at'] ?? null
                ],
                'message' => $validation['valid'] ? 'License is valid' : 'License is invalid or expired'
            ]);
        } catch (\Exception $e) {
            Log::error("Token validation failed: " . $e->getMessage());
            return response()->json([
                'valid' => false,
                'message' => 'Token validation failed'
            ], 500);
        }
    }

    public function checkLicenseStatus(License $license)
    {
        try {
            $now = Carbon::now();
            $shouldBeActive = $now->between(
                Carbon::parse($license->issued_date),
                Carbon::parse($license->expiry_date)
            );

            return response()->json([
                'result' => true,
                'data' => [
                    'license_id' => $license->license_id,
                    'current_status' => $license->status,
                    'should_be_active' => $shouldBeActive,
                    'is_correct_status' => $license->status === ($shouldBeActive ? License::ACTIVE : License::DEACTIVATED),
                    'issued_date' => $license->issued_date,
                    'expiry_date' => $license->expiry_date,
                    'current_time' => $now->toDateTimeString()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to check license status: " . $e->getMessage());
            return response()->json([
                'result' => false,
                'message' => 'Failed to check license status'
            ], 500);
        }
    }
}