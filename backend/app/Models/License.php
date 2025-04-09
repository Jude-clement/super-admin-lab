<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use App\Services\LicenseService;
use Exception;
use Illuminate\Support\Facades\Log;

class License extends Model
{
    use HasFactory;

    const DEACTIVATED = 0;
    const ACTIVE = 1;

    protected $primaryKey = 'license_id';

    protected $fillable = [
        'client_id',
        'license_key',
        'issued_date',
        'expiry_date',
        'status',
        'features'
    ];

    protected $casts = [
        'issued_date' => 'datetime:Y-m-d H:i:s',
        'expiry_date' => 'datetime:Y-m-d H:i:s',
        'status' => 'integer',
        'features' => 'array'
    ];

    protected $appends = ['real_time_status'];

    protected function issuedDate(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => is_string($value) 
                ? Carbon::createFromFormat('Y-m-d H:i:s', $value, 'Asia/Kolkata')
                : $value->timezone('Asia/Kolkata'),
        );
    }

    protected function expiryDate(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => is_string($value) 
                ? Carbon::createFromFormat('Y-m-d H:i:s', $value, 'Asia/Kolkata')
                : $value->timezone('Asia/Kolkata'),
        );
    }

    public function lab()
    {
        return $this->belongsTo(Lab::class, 'client_id', 'lab_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::ACTIVE);
    }

    public function scopeDeactivated($query)
    {
        return $query->where('status', self::DEACTIVATED)
                    ->orWhere('issued_date', '>', now('Asia/Kolkata'))
                    ->orWhere('expiry_date', '<', now('Asia/Kolkata'));
    }

    public function scopeInactive($query)
    {
        return $query->where('status', self::DEACTIVATED);
    }

    public function getRealTimeStatusAttribute()
    {
        $now = now('Asia/Kolkata');
        $issued = Carbon::parse($this->issued_date)->timezone('Asia/Kolkata');
        $expiry = Carbon::parse($this->expiry_date)->timezone('Asia/Kolkata');
        
        return $now->between($issued, $expiry) ? self::ACTIVE : self::DEACTIVATED;
    }

    public function isValid(): bool
    {
        try {
            $service = new LicenseService();
            return $this->real_time_status === self::ACTIVE && 
                   $service->validateToken($this->license_key);
        } catch (Exception $e) {
            return false;
        }
    }

    public function getTokenData(): ?array
    {
        try {
            return (new LicenseService())->getTokenData($this->license_key);
        } catch (Exception $e) {
            return null;
        }
    }

// Replace the boot method with this:
protected static function boot()
{
    parent::boot();

    static::saving(function ($license) {
        $timezone = 'Asia/Kolkata';
        $now = Carbon::now($timezone);
        $issued = Carbon::parse($license->issued_date)->timezone($timezone);
        $expiry = Carbon::parse($license->expiry_date)->timezone($timezone);
        
        // Force status update based on current time
        $license->status = $now->between($issued, $expiry) 
            ? self::ACTIVE 
            : self::DEACTIVATED;
    });

    static::updated(function ($license) {
        if ($license->lab && $license->isDirty('status')) {
            $license->lab->update([
                'license_status' => $license->status ? 'active' : 'inactive',
                'numeric_status' => $license->status
            ]);
        }
    });
}

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

// In App\Models\License
// In App\Models\License
public function refreshStatus()
{
    try {
        $timezone = 'Asia/Kolkata';
        $now = Carbon::now($timezone);
        $issued = Carbon::parse($this->issued_date)->timezone($timezone);
        $expiry = Carbon::parse($this->expiry_date)->timezone($timezone);
        
        $oldStatus = $this->status;
        $newStatus = $now->between($issued, $expiry) 
            ? self::ACTIVE 
            : self::DEACTIVATED;
        
        if ($oldStatus !== $newStatus) {
            // Add more descriptive logging
            $statusChangeType = $oldStatus == self::DEACTIVATED && $newStatus == self::ACTIVE 
                ? 'activation' 
                : 'deactivation';
                
            Log::channel('license')->info("License {$statusChangeType}", [
                'license_id' => $this->license_id,
                'client_id' => $this->client_id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'issued_date' => $issued->format('Y-m-d H:i:s'),
                'expiry_date' => $expiry->format('Y-m-d H:i:s'),
                'current_time' => $now->format('Y-m-d H:i:s'),
                'timezone' => $timezone,
                'action' => "status_{$statusChangeType}",
                'model' => 'License'
            ]);
            
            $this->status = $newStatus;
            $this->save();
            
            // Update lab status if necessary
            if ($this->lab) {
                $this->lab->update([
                    'license_status' => $newStatus ? 'active' : 'inactive',
                    'numeric_status' => $newStatus
                ]);
            }
        }
        
        return $this;
    } catch (\Exception $e) {
        Log::channel('license')->error('License status refresh failed', [
            'license_id' => $this->license_id ?? null,
            'error' => $e->getMessage(),
            'stack_trace' => $e->getTraceAsString()
        ]);
        throw $e;
    }
}
}