<?php

namespace App\Http\Controllers\API;

use App\Models\Lab;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class LabController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $labs = Lab::with('settings')->get();
        return response()->json([
            'result' => true,
            'data' => $labs
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lab_name' => 'required|string|max:255',
            'contact_person' => 'required|string|max:255',
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:20',
            'address' => 'required|string',
            'license_status' => 'required|string|in:active,expired,suspended',
            'settings' => 'required|array',
            'settings.name' => 'required|string|max:255',
            'settings.phone' => 'required|string|max:20',
            'settings.email' => 'required|email|max:255',
            // Add other settings validation rules
        ]);

        if ($validator->fails()) {
            return response()->json([
                'result' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create settings first
            $settings = Setting::create($request->settings);

            // Create lab with settings_id
            $lab = Lab::create(array_merge(
                $request->except('settings'),
                ['settings_id' => $settings->settings_id]
            ));

            return response()->json([
                'result' => true,
                'data' => $lab->load('settings')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'result' => false,
                'message' => 'Failed to create lab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Lab $lab)
    {
        return response()->json([
            'result' => true,
            'data' => $lab->load('settings')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Lab $lab)
    {
        $validator = Validator::make($request->all(), [
            'lab_name' => 'sometimes|string|max:255',
            'contact_person' => 'sometimes|string|max:255',
            'contact_email' => 'sometimes|email|max:255',
            'contact_phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string',
            'license_status' => 'sometimes|string|in:active,expired,suspended',
            'settings' => 'sometimes|array',
            // Add other settings validation rules
        ]);

        if ($validator->fails()) {
            return response()->json([
                'result' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Update lab
            $lab->update($request->except('settings'));

            // Update settings if provided
            if ($request->has('settings')) {
                $lab->settings()->update($request->settings);
            }

            return response()->json([
                'result' => true,
                'data' => $lab->load('settings')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'result' => false,
                'message' => 'Failed to update lab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Lab $lab)
    {
        try {
            // Delete settings first to maintain referential integrity
            $lab->settings()->delete();
            $lab->delete();

            return response()->json([
                'result' => true,
                'message' => 'Lab deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'result' => false,
                'message' => 'Failed to delete lab',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}