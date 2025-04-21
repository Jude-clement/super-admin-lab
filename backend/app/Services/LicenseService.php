<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Carbon\Carbon;
use App\Models\License;
use App\Models\Lab;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LicenseService
{
    protected $secretKey;
    protected $encryptionKey;
    protected $algorithm = 'HS256';
    protected $timezone = 'Asia/Kolkata';

    public function __construct()
    {
        $this->secretKey = config('app.key');
        if (empty($this->secretKey)) {
            throw new \RuntimeException('Application key not configured');
        }
        $this->encryptionKey = substr(hash_hmac('sha256', $this->secretKey, 'license_key'), 0, 32);
    }

    protected function customEncrypt(string $data): string
    {
        $ivlen = openssl_cipher_iv_length($cipher = 'AES-128-CBC');
        $iv = openssl_random_pseudo_bytes($ivlen);
        $encrypted = openssl_encrypt($data, $cipher, $this->encryptionKey, 0, $iv);
        return strtr(base64_encode($iv . $encrypted), '+/=', '-_.');
    }

    protected function customDecrypt(string $data): string
    {
        $data = base64_decode(strtr($data, '-_.', '+/='));
        $ivlen = openssl_cipher_iv_length($cipher = 'AES-128-CBC');
        return openssl_decrypt(
            substr($data, $ivlen), 
            $cipher, 
            $this->encryptionKey, 
            0, 
            substr($data, 0, $ivlen)
        );
    }

    public function getJwtFromToken(string $encryptedToken): ?string
    {
        try {
            return $this->customDecrypt($encryptedToken);
        } catch (\Exception $e) {
            Log::error("Failed to extract JWT: " . $e->getMessage());
            return null;
        }
    }

    public function generateToken(array $payload, Carbon $expiryDate, ?string $issuer = null): string
    {
        $tokenPayload = [
            'iss' => $issuer ?? config('app.url'),
            'iat' => Carbon::now($this->timezone)->timestamp,
            'exp' => $expiryDate->timestamp,
            'tz' => $this->timezone,
            'd' => $payload,
            'n' => Str::random(8),
        ];
        
        return $this->customEncrypt(JWT::encode($tokenPayload, $this->secretKey, $this->algorithm));
    }

    public function validateToken(string $encryptedToken): bool
    {
        try {
            $decoded = JWT::decode(
                $this->customDecrypt($encryptedToken), 
                new Key($this->secretKey, $this->algorithm)
            );
            
            return Carbon::now($this->timezone)->timestamp <= $decoded->exp;
        } catch (\Exception $e) {
            Log::error("Token validation failed: " . $e->getMessage());
            return false;
        }
    }

    public function getTokenData(string $encryptedToken): ?array
    {
        try {
            $decoded = (array)JWT::decode(
                $this->customDecrypt($encryptedToken), 
                new Key($this->secretKey, $this->algorithm)
            );
            
            // Expand shortened keys
            if (isset($decoded['d'])) {
                $decoded['data'] = $decoded['d'];
                unset($decoded['d']);
            }
            
            if (isset($decoded['tz'])) {
                $decoded['timezone'] = $decoded['tz'];
                unset($decoded['tz']);
            }
            
            $now = Carbon::now($this->timezone);
            $expiresAt = Carbon::createFromTimestamp($decoded['exp'])->setTimezone($this->timezone);
            
            $decoded['is_valid'] = $now <= $expiresAt;
            $decoded['current_status'] = $now->between(
                Carbon::createFromTimestamp($decoded['iat']), 
                $expiresAt
            ) ? License::ACTIVE : License::DEACTIVATED;
            
            return $decoded;
        } catch (\Exception $e) {
            Log::error("Failed to get token data: " . $e->getMessage());
            return null;
        }
    }

    public function generateTokenForLab($labId, $issuedAt, $expiresAt): string
    {
        $issuedAt = $this->ensureCarbon($issuedAt);
        $expiresAt = $this->ensureCarbon($expiresAt);

        if ($expiresAt <= $issuedAt) {
            throw new \InvalidArgumentException('Expiration time must be after issue time');
        }

        $lab = Lab::findOrFail($labId);

        return $this->generateToken(
            [
                'lab_id' => $labId,
                'issued_at' => $issuedAt->format('Y-m-d'),
                'expires_at' => $expiresAt->format('Y-m-d'),
            ],
            $expiresAt, 
            $lab->app_url
        );
    }

    public function validateTokenWithDates(string $encryptedToken): array
    {
        try {
            $token = $this->customDecrypt($encryptedToken);
            $decoded = (array)JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            
            $now = Carbon::now($this->timezone);
            $issuedAt = Carbon::createFromTimestamp($decoded['iat'])->setTimezone($this->timezone);
            $expiresAt = Carbon::createFromTimestamp($decoded['exp'])->setTimezone($this->timezone);
            
            $isActive = $now->between($issuedAt, $expiresAt);

            return [
                'valid' => $isActive,
                'issued_at' => $issuedAt->format('Y-m-d H:i:s'),
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
                'issuer' => $decoded['iss'] ?? null,
                'current_time' => $now->format('Y-m-d H:i:s'),
                'should_be_active' => $isActive,
                'raw_jwt' => $token
            ];
        } catch (\Exception $e) {
            Log::error("Token validation with dates failed: " . $e->getMessage());
            return ['valid' => false];
        }
    }

    public function syncLicenseStatus(License $license): bool
    {
        $validation = $this->validateTokenWithDates($license->license_key);
        $newStatus = $validation['valid'] ? License::ACTIVE : License::DEACTIVATED;
        
        if ($license->status !== $newStatus) {
            $license->update(['status' => $newStatus]);
            
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

    protected function ensureCarbon($dateTime): Carbon
    {
        if ($dateTime instanceof Carbon) {
            return $dateTime->setTimezone($this->timezone);
        }
        
        try {
            return Carbon::parse($dateTime)->setTimezone($this->timezone);
        } catch (\Exception $e) {
            throw new \InvalidArgumentException("Invalid datetime format: {$dateTime}");
        }
    }

    public function parseDateTimeString(string $dateTime): Carbon
    {
        try {
            return Carbon::createFromFormat('Y-m-d H:i:s', $dateTime, $this->timezone);
        } catch (\Exception $e) {
            throw new \InvalidArgumentException("Invalid datetime format. Expected Y-m-d H:i:s, got: {$dateTime}");
        }
    }
}