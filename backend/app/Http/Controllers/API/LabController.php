<?php

namespace App\Http\Controllers\API;

use App\Models\Lab;
use App\Models\License;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Carbon\Carbon;

class LabController extends Controller
{
    public function index()
    {
        return response()->json([
            'result' => true,
            'data' => Lab::with(['licenses' => function($query) {
                $query->orderBy('expiry_date', 'desc');
            }])->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lab_name' => 'required|string|max:255',
            'contact_person' => 'required|string|max:255',
            'contact_email' => 'required|email',
            'contact_phone' => 'required|string',
            'address' => 'required|string',
            'license_status' => 'sometimes|string|in:active,inactive,expired',
            'license_key' => 'sometimes|nullable|string|unique:licenses,license_key',
            'issued_date' => 'sometimes|nullable|date',
            'expiry_date' => 'sometimes|nullable|date|after:issued_date'
        ]);
    
        // Create the lab
        $lab = Lab::create([
            'lab_name' => $validated['lab_name'],
            'contact_person' => $validated['contact_person'],
            'contact_email' => $validated['contact_email'],
            'contact_phone' => $validated['contact_phone'],
            'address' => $validated['address'],
            'license_status' => $validated['license_status'] ?? 'active'
        ]);
    
        // Create license if included
        if (isset($validated['license_key'])) {
            $license = License::create([
                'client_id' => $lab->lab_id,
                'license_key' => $validated['license_key'],
                'issued_date' => $validated['issued_date'],
                'expiry_date' => $validated['expiry_date'],
                'status' => 'active'
            ]);
            
            // Update lab's license status based on the license
            $lab->update(['license_status' => $license->status]);
        }
    
        return response()->json([
            'result' => true,
            'data' => $lab->load('licenses'),
            'message' => 'Lab created successfully'
        ], 201);
    }

    public function show(Lab $lab)
    {
        return response()->json([
            'result' => true,
            'data' => $lab->load(['licenses' => function($query) {
                $query->orderBy('expiry_date', 'desc');
            }])
        ]);
    }

    public function update(Request $request, Lab $lab)
    {
        $validated = $request->validate([
            'lab_name' => 'sometimes|string|max:255',
            'contact_person' => 'sometimes|string|max:255',
            'contact_email' => 'sometimes|email',
            'contact_phone' => 'sometimes|string',
            'address' => 'sometimes|string',
            'license_status' => 'sometimes|string|in:active,inactive,expired'
        ]);

        $lab->update($validated);

        return response()->json([
            'result' => true,
            'data' => $lab,
            'message' => 'Lab updated successfully'
        ]);
    }

    public function destroy(Lab $lab)
    {
        // Delete associated licenses first
        $lab->licenses()->delete();
        $lab->delete();
        
        return response()->json([
            'result' => true,
            'message' => 'Lab and associated licenses deleted successfully'
        ]);
    }
}