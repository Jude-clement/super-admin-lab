<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'license_status',
        'settings_id'
    ];

    protected $casts = [
        'license_status' => 'string',
    ];

    /**
     * Get the settings associated with the lab.
     */
    public function settings()
    {
        return $this->belongsTo(Setting::class, 'settings_id', 'settings_id');
    }
}