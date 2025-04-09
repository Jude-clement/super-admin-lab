<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Log;
use App\Models\License;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('licenses:update-status')
            // ->everyFiveMinutes()
            ->everyMinute()

            ->timezone('Asia/Kolkata')
            ->runInBackground()
            ->onSuccess(function () {
                // Get counts of licenses in each status
                $activeCount = License::where('status', License::ACTIVE)->count();
                $inactiveCount = License::where('status', License::DEACTIVATED)->count();
                
                // Get recently updated licenses (last 10 minutes)
                $recentUpdates = License::where('updated_at', '>=', now()->subMinutes(10))
                    ->whereRaw('updated_at > created_at')
                    ->take(5)
                    ->get()
                    ->map(function ($license) {
                        return [
                            'id' => $license->license_id,
                            'client_id' => $license->client_id,
                            'old_status' => $license->getOriginal('status'),
                            'new_status' => $license->status,
                            'issued_date' => $license->issued_date,
                            'expiry_date' => $license->expiry_date,
                            'updated_at' => $license->updated_at
                        ];
                    });

                // Log::info('License status update completed', [
                //     'stats' => [
                //         'total_active' => $activeCount,
                //         'total_inactive' => $inactiveCount,
                //         'recent_updates_count' => $recentUpdates->count()
                //     ],
                //     'sample_updates' => $recentUpdates,
                //     'execution_time' => now()->format('Y-m-d H:i:s T')
                // ]);
            })
            ->onFailure(function () {
                Log::error('License status update failed', [
                    'error_time' => now()->format('Y-m-d H:i:s T')
                ]);
            });
    }
    
    protected $commands = [
        \App\Console\Commands\UpdateLicenseStatuses::class,
    ];
}