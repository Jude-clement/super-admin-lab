<?php

namespace App\Http\Controllers\API;

use App\Models\License;
use App\Models\Lab;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use App\Services\LicenseService;

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
            'status' => 'sometimes|in:active,inactive,expired'
        ]);
    
        // Parse dates with time components
        $issuedDate = Carbon::createFromFormat('Y-m-d H:i:s', $validated['issued_date']);
        $expiryDate = Carbon::createFromFormat('Y-m-d H:i:s', $validated['expiry_date']);
    
        // Generate JWT token
        $token = $this->licenseService->generateTokenForLab(
            $validated['client_id'],
            $issuedDate,
            $expiryDate
        );
    
        $license = License::create([
            'client_id' => $validated['client_id'],
            'license_key' => $token,
            'issued_date' => $issuedDate->format('Y-m-d H:i:s'),
            'expiry_date' => $expiryDate->format('Y-m-d H:i:s'),
            'status' => $validated['status'] ?? 'active'
        ]);
    
        // Update lab status
        Lab::where('lab_id', $validated['client_id'])
           ->update(['license_status' => $license->status]);
    
        return response()->json([
            'result' => true,
            'data' => $license->load('lab'),
            'token' => $token,
            'message' => 'License created successfully'
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
        $isValid = $this->licenseService->validateToken($license->license_key);
        $tokenData = $this->licenseService->getTokenData($license->license_key);

        return response()->json([
            'result' => true,
            'data' => array_merge(
                $license->load('lab')->toArray(),
                [
                    'token_valid' => $isValid,
                    'token_data' => $tokenData
                ]
            )
        ]);
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
            'status' => 'sometimes|in:active,inactive,expired'
        ]);
    
        // Format dates if they exist
        if (isset($validated['issued_date']) && !Carbon::hasFormat($validated['issued_date'], 'Y-m-d H:i:s')) {
            $validated['issued_date'] = Carbon::parse($validated['issued_date'])->format('Y-m-d H:i:s');
        }
    
        if (isset($validated['expiry_date']) && !Carbon::hasFormat($validated['expiry_date'], 'Y-m-d H:i:s')) {
            $validated['expiry_date'] = Carbon::parse($validated['expiry_date'])->format('Y-m-d H:i:s');
        }
    
        // Regenerate token if expiry date changed
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
    
        // Update lab status if changed
        if (isset($validated['status'])) {
            Lab::where('lab_id', $license->client_id)
               ->update(['license_status' => $validated['status']]);
        }
    
        return response()->json([
            'result' => true,
            'data' => $license->load('lab'),
            'message' => 'License updated successfully'
        ]);
    }

    public function destroy(License $license)
    {
        $labId = $license->client_id;
        $license->delete();

        // Update lab status if no licenses left
        if (License::where('client_id', $labId)->count() === 0) {
            Lab::where('lab_id', $labId)
               ->update(['license_status' => 'inactive']);
        }

        return response()->json([
            'result' => true,
            'message' => 'License deleted successfully'
        ]);
    }

    public function activate(License $license)
    {
        $license->update(['status' => 'active']);
        Lab::where('lab_id', $license->client_id)
           ->update(['license_status' => 'active']);

        return response()->json([
            'result' => true,
            'message' => 'License activated successfully'
        ]);
    }

    public function deactivate(License $license)
    {
        $license->update(['status' => 'inactive']);
        
        if (License::where('client_id', $license->client_id)
                 ->where('status', 'active')
                 ->count() === 0) {
            Lab::where('lab_id', $license->client_id)
               ->update(['license_status' => 'inactive']);
        }

        return response()->json([
            'result' => true,
            'message' => 'License deactivated successfully'
        ]);
    }

    public function checkExpiry()
    {
        $expiredLicenses = License::where('expiry_date', '<', Carbon::now())
                                 ->where('status', '!=', 'expired')
                                 ->get();

        foreach ($expiredLicenses as $license) {
            $license->update(['status' => 'expired']);
            Lab::where('lab_id', $license->client_id)
               ->update(['license_status' => 'expired']);
        }

        return response()->json([
            'result' => true,
            'message' => 'Expired licenses processed',
            'count' => $expiredLicenses->count()
        ]);
    }

    public function validateToken(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string'
        ]);

        $isValid = $this->licenseService->validateToken($validated['token']);
        $data = $this->licenseService->getTokenData($validated['token']);

        return response()->json([
            'valid' => $isValid,
            'data' => $data,
            'message' => $isValid ? 'License is valid' : 'License is invalid or expired'
        ]);
    }
}