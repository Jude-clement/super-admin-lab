<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Lab extends Model
{
    use HasFactory;

    protected $primaryKey = 'lab_id';

    protected $fillable = [
        'lab_name',
        'contact_person',
        'contact_email',
        'contact_phone',
        'address',
        'numeric_status', // Add this to allow mass assignment
        'license_status' // Maintains string status for backward compatibility
    ];

    protected $casts = [
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    /**
     * Get all licenses for this lab ordered by expiry date
     */
    public function licenses()
    {
        return $this->hasMany(License::class, 'client_id', 'lab_id')
                   ->orderBy('expiry_date', 'desc');
    }

    /**
     * Get the current active license (within valid date range)
     */
    public function activeLicense()
    {
        return $this->hasOne(License::class, 'client_id', 'lab_id')
                   ->where('status', License::ACTIVE)
                   ->where('issued_date', '<=', now())
                   ->where('expiry_date', '>=', now())
                   ->latest('expiry_date');
    }

    /**
     * Get the most recent license (regardless of status)
     */
    public function latestLicense()
    {
        return $this->hasOne(License::class, 'client_id', 'lab_id')
                   ->latest('expiry_date');
    }

    /**
     * Check if lab has a valid license
     */
    public function hasValidLicense(): bool
    {
        return $this->activeLicense()->exists();
    }

    /**
     * Get license status with proper typing
     * Maintains string status for backward compatibility
     */
    protected function licenseStatus(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ?? 'inactive',
            set: fn ($value) => is_numeric($value) 
                ? ($value ? 'active' : 'inactive')
                : strtolower($value)
        );
    }

    /**
     * Automatically sync license status when lab is saved
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($lab) {
        // Always sync numeric_status with license_status
        $lab->numeric_status = $lab->license_status === 'active' 
            ? License::ACTIVE 
            : License::DEACTIVATED;
        });

        static::deleting(function ($lab) {
            // Delete all associated licenses when lab is deleted
            $lab->licenses()->delete();
        });
    }

    /**
     * Helper method to get the current license status based on dates
     */
    public function refreshLicenseStatus(): void
    {
        $hasActive = $this->licenses()
            ->where('issued_date', '<=', now())
            ->where('expiry_date', '>=', now())
            ->where('status', License::ACTIVE)
            ->exists();

        $this->license_status = $hasActive ? 'active' : 'inactive';
        $this->save();
    }
}