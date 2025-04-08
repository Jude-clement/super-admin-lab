<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\License;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateLicenseStatuses extends Command
{
    protected $signature = 'licenses:update-status {--force}';
    protected $description = 'Update license statuses with timezone-safe checks';

// In App\Console\Commands\UpdateLicenseStatuses
// In App\Console\Commands\UpdateLicenseStatuses
public function handle()
{
    try {
        $timezone = 'Asia/Kolkata';
        $now = Carbon::now($timezone);
        
        // Get licenses that should be ACTIVE but aren't
        License::where(function($query) use ($now, $timezone) {
            $query->whereRaw("CONVERT_TZ(issued_date, '+00:00', '+05:30') <= ?", [$now])
                  ->whereRaw("CONVERT_TZ(expiry_date, '+00:00', '+05:30') >= ?", [$now])
                  ->where('status', '!=', License::ACTIVE);
        })
        // Or licenses that should be INACTIVE but aren't
        ->orWhere(function($query) use ($now, $timezone) {
            $query->where(function($q) use ($now, $timezone) {
                $q->whereRaw("CONVERT_TZ(issued_date, '+00:00', '+05:30') > ?", [$now])
                  ->orWhereRaw("CONVERT_TZ(expiry_date, '+00:00', '+05:30') < ?", [$now]);
            })->where('status', '!=', License::DEACTIVATED);
        })
        ->chunkById(200, function ($licenses) use ($now, $timezone) {
            foreach ($licenses as $license) {
                $license->refreshStatus(); // This will trigger model events
            }
        });

        return 0;
    } catch (\Exception $e) {
        Log::error('License status update failed: '.$e->getMessage());
        return 1;
    }
}
}