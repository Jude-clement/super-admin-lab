<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('licenses', function (Blueprint $table) {
            $table->id('license_id');
            $table->foreignId('client_id')->constrained('labs', 'lab_id')->onDelete('cascade');
            $table->string('license_key',255)->unique();
            $table->dateTime('issued_date')->change();
            $table->dateTime('expiry_date')->change();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['client_id', 'status']);
            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};