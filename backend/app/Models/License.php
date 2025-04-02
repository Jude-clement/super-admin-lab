<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use App\Services\LicenseService;
use Exception;

class License extends Model
{
    use HasFactory;

    protected $primaryKey = 'license_id';

    protected $fillable = [
        'client_id',
        'license_key',
        'issued_date',
        'expiry_date',
        'status',
        'features' // Added for JWT payload
    ];

    protected $casts = [
        'issued_date' => 'datetime:Y-m-d H:i:s',
        'expiry_date' => 'datetime:Y-m-d H:i:s',
        'features' => 'array'
    ];

    // Add these mutators to ensure proper formatting
protected function issuedDate(): Attribute
{
    return Attribute::make(
        set: fn ($value) => is_string($value) 
            ? Carbon::createFromFormat('Y-m-d H:i:s', $value) 
            : $value,
    );
}

protected function expiryDate(): Attribute
{
    return Attribute::make(
        set: fn ($value) => is_string($value) 
            ? Carbon::createFromFormat('Y-m-d H:i:s', $value) 
            : $value,
    );
}

    /**
     * The lab that owns this license.
     */
    public function lab()
    {
        return $this->belongsTo(Lab::class, 'client_id', 'lab_id');
    }

    /**
     * Scope for active licenses
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where('expiry_date', '>', now());
    }

    /**
     * Scope for expired licenses
     */
    public function scopeExpired($query)
    {
        return $query->where(function($q) {
            $q->where('status', 'expired')
              ->orWhere('expiry_date', '<', now());
        });
    }

    /**
     * Check if license is valid (both in DB and JWT)
     */
    public function isValid(): bool
    {
        try {
            $service = new LicenseService();
            return $this->status === 'active' && 
                   $service->validateToken($this->license_key) &&
                   now()->lessThanOrEqualTo($this->expiry_date);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get decoded token payload
     */
    public function getTokenData(): ?array
    {
        try {
            return (new LicenseService())->getTokenData($this->license_key);
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Automatically handle license status and sync with lab
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($license) {
            // Auto-expire if past expiry date
            if (now()->greaterThan($license->expiry_date)) {
                $license->status = 'expired';
            }

            // Validate JWT token if present
            if ($license->license_key) {
                try {
                    $service = new LicenseService();
                    if (!$service->validateToken($license->license_key)) {
                        throw new \InvalidArgumentException('Invalid license token');
                    }
                } catch (Exception $e) {
                    throw new \InvalidArgumentException('License token validation failed: '.$e->getMessage());
                }
            }
        });

        static::saved(function ($license) {
            // Sync with lab's license status
            if ($license->lab && $license->isDirty('status')) {
                $license->lab->update(['license_status' => $license->status]);
            }
        });

        static::deleted(function ($license) {
            // Update lab status if this was the last license
            if ($license->lab && $license->lab->licenses()->count() === 0) {
                $license->lab->update(['license_status' => 'inactive']);
            }
        });
    }

    /**
     * Generate a new JWT token for this license
     */
    public function generateNewToken(): string
    {
        $service = new LicenseService();
        $this->license_key = $service->generateToken(
            [
                'lab_id' => $this->client_id,
                'features' => $this->features ?? []
            ],
            $this->expiry_date
        );
        return $this->license_key;
    }
}