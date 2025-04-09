<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\License;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class UpdateLicenseStatuses extends Command
{
    protected $signature = 'licenses:update-status {--debug}';
    protected $description = 'Update license statuses with timezone-safe checks';

    public function handle()
    {
        try {
            $debug = $this->option('debug');
            $timezone = 'Asia/Kolkata';
            $now = Carbon::now($timezone);
            
            if ($debug) {
                $this->info("Current time: {$now->format('Y-m-d H:i:s')}");
                
                // Debug upcoming activations
                $upcomingActivations = License::where('status', License::DEACTIVATED)
                    ->whereRaw("issued_date <= DATE_ADD(NOW(), INTERVAL 10 MINUTE)")
                    ->whereRaw("issued_date > NOW()")
                    ->get();
                
                $this->info("Found {$upcomingActivations->count()} upcoming activations:");
                foreach ($upcomingActivations as $license) {
                    $this->info("License ID: {$license->license_id}, Client: {$license->client_id}, Issue Date: {$license->issued_date}");
                }
                
                // Debug upcoming expirations
                $upcomingExpirations = License::where('status', License::ACTIVE)
                    ->whereRaw("expiry_date <= DATE_ADD(NOW(), INTERVAL 10 MINUTE)")
                    ->whereRaw("expiry_date > NOW()")
                    ->get();
                
                $this->info("Found {$upcomingExpirations->count()} upcoming expirations:");
                foreach ($upcomingExpirations as $license) {
                    $this->info("License ID: {$license->license_id}, Client: {$license->client_id}, Expiry Date: {$license->expiry_date}");
                }
            }
            
            // Get all licenses that need checking
            $licenses = License::where(function($query) use ($now) {
                // 1. Should be active (issued date passed, expiry date not passed)
                $query->where(function($q) {
                    $q->whereRaw('issued_date <= NOW()')
                      ->whereRaw('expiry_date > NOW()')
                      ->where('status', License::DEACTIVATED);
                });
                
                // 2. Should be inactive (expiry date passed)
                $query->orWhere(function($q) {
                    $q->whereRaw('expiry_date <= NOW()')
                      ->where('status', License::ACTIVE);
                });
                
                // 3. Should be inactive (issued date not yet reached)
                $query->orWhere(function($q) {
                    $q->whereRaw('issued_date > NOW()')
                      ->where('status', License::ACTIVE);
                });
                
                // 4. Special case: just about to become active (issue date within next minute)
                $query->orWhere(function($q) {
                    $q->whereRaw('TIMESTAMPDIFF(SECOND, NOW(), issued_date) BETWEEN -5 AND 60')
                      ->where('status', License::DEACTIVATED);
                });
                
                // 5. Special case: just about to expire (expiry date within next minute)
                $query->orWhere(function($q) {
                    $q->whereRaw('TIMESTAMPDIFF(SECOND, NOW(), expiry_date) BETWEEN -5 AND 60')
                      ->where('status', License::ACTIVE);
                });
            })->get();
            
            $activationCount = 0;
            $deactivationCount = 0;
            
            foreach ($licenses as $license) {
                $oldStatus = $license->status;
                
                // Force timezone to be consistent
                $issuedDate = Carbon::parse($license->issued_date)->timezone($timezone);
                $expiryDate = Carbon::parse($license->expiry_date)->timezone($timezone);
                
                // Calculate correct status based on current time
                // A license is active only when current time is:
                // 1. Greater than or equal to the issued date AND
                // 2. Less than the expiry date
                $shouldBeActive = $now->greaterThanOrEqualTo($issuedDate) && 
                                 $now->lessThan($expiryDate);
                
                $newStatus = $shouldBeActive ? License::ACTIVE : License::DEACTIVATED;
                
                if ($oldStatus !== $newStatus) {
                    $statusChangeType = $newStatus === License::ACTIVE ? 'activation' : 'deactivation';
                    $reason = '';
                    
                    if ($statusChangeType === 'activation') {
                        $activationCount++;
                        $reason = 'Issue date reached';
                    } else {
                        $deactivationCount++;
                        if ($now->greaterThanOrEqualTo($expiryDate)) {
                            $reason = 'Expiry date reached';
                        } else {
                            $reason = 'Current time before issue date';
                        }
                    }
                    
                    // Log the change
                    Log::channel('license')->info("License {$statusChangeType}", [
                        'license_id' => $license->license_id,
                        'client_id' => $license->client_id,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'issued_date' => $issuedDate->format('Y-m-d H:i:s'),
                        'expiry_date' => $expiryDate->format('Y-m-d H:i:s'),
                        'current_time' => $now->format('Y-m-d H:i:s'),
                        'timezone' => $timezone,
                        'action' => "status_{$statusChangeType}",
                        'reason' => $reason,
                        'should_be_active' => $shouldBeActive
                    ]);
                    
                    // Update license status
                    $license->status = $newStatus;
                    $license->save();
                    
                    // Update lab status if necessary
                    if ($license->lab) {
                        $license->lab->update([
                            'license_status' => $newStatus ? 'active' : 'inactive',
                            'numeric_status' => $newStatus
                        ]);
                    }
                }
            }
            
            if ($debug || $activationCount > 0 || $deactivationCount > 0) {
                $this->info("Processed {$licenses->count()} licenses.");
                $this->info("Activated: {$activationCount}, Deactivated: {$deactivationCount}");
            }
    
            return 0;
        } catch (\Exception $e) {
            Log::error('License status update failed: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}