<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RefreshToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|regex:/^[A-Za-z0-9_ ]+$/',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/',
            'role' => 'required|string|in:superadmin,admin,frontoffice',
            'address' => 'nullable|string', // Add address validation

        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'address' => $request->address, // Save address

        ]);

        // Assign role
        $user->assignRole($request->role);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check email
        $user = User::where('email', $request->email)->first();

        // Check password
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Get user's role and permissions
        $roles = $user->getRoleNames();
        $permissions = $user->getAllPermissions()->pluck('name');

        // Create access token with abilities based on permissions
        $token = $user->createToken('auth_token', $permissions->toArray())->plainTextToken;

        // Generate refresh token
        $refreshToken = $this->createRefreshToken($user);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'roles' => $roles,
            'role' => $roles->first(), // Include the user's primary role in the response
            'permissions' => $permissions,
            'access_token' => $token,
            'refresh_token' => $refreshToken->token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        // Revoke the token that was used to authenticate the current request
        $request->user()->currentAccessToken()->delete();

        // If refresh token was provided, revoke it too
        if ($request->has('refresh_token')) {
            $this->revokeRefreshToken($request->refresh_token);
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    public function refresh(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'refresh_token' => 'required|string',
        ]);
    
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }
    
        // Find the refresh token
        $refreshToken = RefreshToken::where('token', $request->refresh_token)
            ->where('revoked', false)
            ->where('expires_at', '>', now())
            ->first();
    
        // Check if token exists and is valid
        if (!$refreshToken) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired refresh token',
            ], 401);
        }
    
        $user = $refreshToken->user;
    
        // Revoke the used refresh token
        $refreshToken->update(['revoked' => true]);
    
        // Revoke all of the user's tokens
        $user->tokens()->delete();
    
        // Get user's permissions
        $permissions = $user->getAllPermissions()->pluck('name');
    
        // Generate a new access token
        $token = $user->createToken('auth_token', $permissions->toArray())->plainTextToken;
    
        // Generate a new refresh token
        $newRefreshToken = $this->createRefreshToken($user);
    
        return response()->json([
            'success' => true,
            'message' => 'Token refreshed successfully',
            'access_token' => $token,
            'refresh_token' => $newRefreshToken->token,
            'token_type' => 'Bearer',
        ]);
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $roles = $user->getRoleNames();
        $permissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'success' => true,
            'user' => $user,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    private function createRefreshToken(User $user)
    {
        // First, clean up any expired tokens for this user
        RefreshToken::where('user_id', $user->id)
            ->where('expires_at', '<', now())
            ->delete();

        // Create a new refresh token
        return RefreshToken::create([
            'user_id' => $user->id,
            'token' => Str::random(64),
            'expires_at' => now()->addDays(30), // 1 day expiration
        ]);
    }

    private function revokeRefreshToken($token)
    {
        $refreshToken = RefreshToken::where('token', $token)->first();
        
        if ($refreshToken) {
            $refreshToken->update(['revoked' => true]);
        }
    }
}