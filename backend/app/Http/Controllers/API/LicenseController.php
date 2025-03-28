<?php

namespace App\Http\Controllers\API;

use App\Models\License;
use App\Models\Lab;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Carbon\Carbon;

class LicenseController extends Controller
{
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
            'license_key' => [
                'required',
                'string',
                'unique:licenses',
                'regex:/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/'
            ],
            'issued_date' => 'required|date',
            'expiry_date' => 'required|date|after:issued_date',
            'status' => 'sometimes|in:active,inactive,expired'
        ]);

        $license = License::create($validated);

        // Update the associated lab's license status
        Lab::where('lab_id', $validated['client_id'])
           ->update(['license_status' => $license->status]);

        return response()->json([
            'result' => true,
            'data' => $license->load('lab'),
            'message' => 'License created successfully'
        ], 201);
    }

    public function show(License $license)
    {
        return response()->json([
            'result' => true,
            'data' => $license->load('lab')
        ]);
    }

    public function update(Request $request, License $license)
    {
        $validated = $request->validate([
            'client_id' => 'sometimes|exists:labs,lab_id',
            'license_key' => [
                'sometimes',
                'string',
                'unique:licenses,license_key,'.$license->license_id.',license_id',
                'regex:/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}$/'
            ],
            'issued_date' => 'sometimes|date',
            'expiry_date' => 'sometimes|date|after:issued_date',
            'status' => 'sometimes|in:active,inactive,expired'
        ]);

        $license->update($validated);

        // Update the associated lab's license status if status changed
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

        // Update lab's license status if this was the last license
        $remainingLicenses = License::where('client_id', $labId)->count();
        if ($remainingLicenses === 0) {
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
        
        // Update the associated lab's status
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
        
        // Only update lab status if all licenses are inactive
        $activeLicenses = License::where('client_id', $license->client_id)
                                ->where('status', 'active')
                                ->count();
        
        if ($activeLicenses === 0) {
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
}