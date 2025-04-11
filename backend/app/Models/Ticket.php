<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'status',
        'attachment',
        'assignee',
        'representer_name',
        'representer_email',
        'representer_phone',
        'eta',
        'client_id' // We'll keep this field but remove the relationship for now
    ];

    protected $casts = [
        'eta' => 'date',
    ];

    // We'll remove the client() relationship method for now
    // public function client()
    // {
    //     return $this->belongsTo(Client::class);
    // }
}