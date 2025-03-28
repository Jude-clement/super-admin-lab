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
        'license_status'
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
     * Get the current active license
     */
    public function activeLicense()
    {
        return $this->hasOne(License::class, 'client_id', 'lab_id')
                   ->where('status', 'active')
                   ->where('expiry_date', '>', now())
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
     */
    protected function licenseStatus(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ?? 'inactive',
            set: fn ($value) => strtolower($value)
        );
    }

    /**
     * Automatically sync license status when lab is saved
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($lab) {
            if ($lab->isDirty('license_status')) {
                // If manually changing status, update all licenses
                $lab->licenses()->update(['status' => $lab->license_status]);
            }
        });

        static::deleting(function ($lab) {
            // Delete all associated licenses when lab is deleted
            $lab->licenses()->delete();
        });
    }
}