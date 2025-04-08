<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Carbon\Carbon;
use App\Models\License;
use App\Models\Lab;

class LicenseService
{
    protected $secretKey;
    protected $algorithm = 'HS256';

    public function __construct()
    {
        $this->secretKey = config('app.key');
        
        if (empty($this->secretKey)) {
            throw new \RuntimeException('Application key not configured');
        }
    }

    public function generateToken(array $payload, Carbon $expiryDate): string
    {
        $issuedAt = Carbon::now()->setTimezone('Asia/Kolkata');
        
        $tokenPayload = [
            'iss' => config('app.url'),
            'iat' => $issuedAt->timestamp,
            'exp' => $expiryDate->timestamp,
            'data' => $payload,
            'timezone' => 'Asia/Kolkata' // Explicit timezone
        ];

        return JWT::encode($tokenPayload, $this->secretKey, $this->algorithm);
    }

    public function validateToken(string $token): bool
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            $data = (array) $decoded->data;
            
            // Additional date validation
            $now = Carbon::now('Asia/Kolkata');
            $expiresAt = Carbon::createFromTimestamp($decoded->exp)->setTimezone('Asia/Kolkata');
            
            return $now <= $expiresAt;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getTokenData(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            $data = (array) $decoded->data;
            
            // Add status information
            $data['is_valid'] = $this->validateToken($token);
            $data['current_status'] = $this->calculateCurrentStatus(
                Carbon::parse($data['issued_at']),
                Carbon::parse($data['expires_at'])
            );
            
            return $data;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function generateTokenForLab($labId, $issuedAt, $expiresAt): string
    {
        $issuedAt = $this->ensureCarbon($issuedAt)->setTimezone('Asia/Kolkata');
        $expiresAt = $this->ensureCarbon($expiresAt)->setTimezone('Asia/Kolkata');

        if ($expiresAt <= $issuedAt) {
            throw new \InvalidArgumentException('Expiration time must be after issue time');
        }

        $payload = [
            'lab_id' => $labId,
            'issued_at' => $issuedAt->format('Y-m-d H:i:s'),
            'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
            'timezone' => 'Asia/Kolkata'
        ];

        return $this->generateToken($payload, $expiresAt);
    }

    public function validateTokenWithDates(string $token): array
    {
        try {
            $data = $this->getTokenData($token);
            
            if (!$data) {
                return ['valid' => false];
            }

            $now = Carbon::now('Asia/Kolkata');
            $isActive = $now->between(
                Carbon::parse($data['issued_at'])->setTimezone('Asia/Kolkata'),
                Carbon::parse($data['expires_at'])->setTimezone('Asia/Kolkata')
            );

            return [
                'valid' => $isActive,
                'issued_at' => $data['issued_at'],
                'expires_at' => $data['expires_at'],
                'current_time' => $now->format('Y-m-d H:i:s'),
                'should_be_active' => $isActive
            ];
        } catch (\Exception $e) {
            return ['valid' => false];
        }
    }

    public function syncLicenseStatus(License $license): bool
    {
        $validation = $this->validateTokenWithDates($license->license_key);
        
        $newStatus = $validation['valid'] ? License::ACTIVE : License::DEACTIVATED;
        
        if ($license->status !== $newStatus) {
            $license->update(['status' => $newStatus]);
            
            // Sync with lab
            if ($license->lab) {
                $license->lab->update([
                    'license_status' => $newStatus ? 'active' : 'inactive',
                    'numeric_status' => $newStatus
                ]);
            }
            
            return true;
        }
        
        return false;
    }

    protected function calculateCurrentStatus(Carbon $issuedAt, Carbon $expiresAt): int
    {
        $now = Carbon::now('Asia/Kolkata');
        return $now->between($issuedAt, $expiresAt) ? License::ACTIVE : License::DEACTIVATED;
    }

    protected function ensureCarbon($dateTime): Carbon
    {
        if ($dateTime instanceof Carbon) {
            return $dateTime;
        }
        
        try {
            return Carbon::parse($dateTime)->setTimezone('Asia/Kolkata');
        } catch (\Exception $e) {
            throw new \InvalidArgumentException("Invalid datetime format: {$dateTime}");
        }
    }

    public function parseDateTimeString(string $dateTime): Carbon
    {
        try {
            return Carbon::createFromFormat('Y-m-d H:i:s', $dateTime, 'Asia/Kolkata');
        } catch (\Exception $e) {
            throw new \InvalidArgumentException("Invalid datetime format. Expected Y-m-d H:i:s, got: {$dateTime}");
        }
    }
}