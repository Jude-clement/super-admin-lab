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
    }

    public function generateToken(array $payload, Carbon $expiryDate): string
    {
        $issuedAt = Carbon::now();
        
        $tokenPayload = [
            'iss' => config('app.url'), // Issuer
            'iat' => $issuedAt->timestamp, // Issued at
            'exp' => $expiryDate->timestamp, // Expiration
            'data' => $payload // Custom data
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
}
return \Firebase\JWT\JWT::encode($tokenPayload, $this->secretKey, $this->algorithm);