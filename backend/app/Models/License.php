<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;

class License extends Model
{
    use HasFactory;

    protected $primaryKey = 'license_id';

    protected $fillable = [
        'client_id',
        'license_key',
        'issued_date',
        'expiry_date',
        'status'
    ];

    protected $casts = [
        'issued_date' => 'datetime:Y-m-d H:i:s',
        'expiry_date' => 'datetime:Y-m-d H:i:s',
    ];

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
     * Check if license is valid (active and not expired)
     */
    public function isValid(): bool
    {
        return $this->status === 'active' && now()->lessThanOrEqualTo($this->expiry_date);
    }

    /**
     * License key mutator for consistent formatting
     */
    protected function licenseKey(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => strtoupper($value) // Preserve format
        );
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

            // Validate license key format
            if (!preg_match('/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{13}$/', $license->license_key)) {
                throw new \InvalidArgumentException('Invalid license key format');
            }
        });

        static::saved(function ($license) {
            // Sync with lab's license status
            if ($license->lab && $license->isDirty('status')) {
                if ($license->isValid()) {
                    $license->lab->update(['license_status' => 'active']);
                } elseif ($license->status === 'expired') {
                    $license->lab->update(['license_status' => 'expired']);
                }
            }
        });

        static::deleted(function ($license) {
            // Update lab status if this was the last license
            if ($license->lab && $license->lab->licenses()->count() === 0) {
                $license->lab->update(['license_status' => 'inactive']);
            }
        });
    }
}