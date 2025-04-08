<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Log;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('licenses:update-status')
          // $schedule->command('licenses:update-status')->everyMinute();
        // ->everyMinute() // Temporary for testing
        ->everyFiveMinutes() // For production
        ->timezone('Asia/Kolkata')
        ->runInBackground()
                 ->onSuccess(function () {
                     Log::info('License status update completed successfully');
                 })
                 ->onFailure(function () {
                     Log::error('License status update failed');
                 });
    }
    
    protected $commands = [
        \App\Console\Commands\UpdateLicenseStatuses::class,
    ];
}
