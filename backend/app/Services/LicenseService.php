<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Carbon\Carbon;

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
        $issuedAt = Carbon::now();
        
        $tokenPayload = [
            'iss' => config('app.url'),
            'iat' => $issuedAt->timestamp,
            'exp' => $expiryDate->timestamp,
            'data' => $payload
        ];

        return JWT::encode($tokenPayload, $this->secretKey, $this->algorithm);
    }

    public function validateToken(string $token): bool
    {
        try {
            JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getTokenData(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            return (array) $decoded->data;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function generateTokenForLab($labId, Carbon $issuedAt, Carbon $expiryDate): string
    {
        // Validate dates
        if ($expiryDate <= $issuedAt) {
            throw new \InvalidArgumentException('Expiry date must be after issued date');
        }

        return $this->generateToken([
            'lab_id' => $labId,
            'issued_at' => $issuedAt->toDateTimeString(),
            'expires_at' => $expiryDate->toDateTimeString()
        ], $expiryDate);
    }

    public function parseDateTimeString(string $dateTime): Carbon
    {
        try {
            return Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);
        } catch (\Exception $e) {
            throw new \InvalidArgumentException("Invalid datetime format. Expected Y-m-d H:i:s, got: {$dateTime}");
        }
    }
}