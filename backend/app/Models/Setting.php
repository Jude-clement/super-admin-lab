<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $primaryKey = 'settings_id';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'website_link',
        'logo',
        'letterhead',
        'location',
        'whatsappactivated',
        'whatsappno',
        'whatsappid'
    ];

    protected $casts = [
        'whatsappactivated' => 'boolean',
    ];
}