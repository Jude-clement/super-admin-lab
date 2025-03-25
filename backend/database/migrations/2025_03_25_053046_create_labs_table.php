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
        Schema::create('labs', function (Blueprint $table) {
            $table->id('lab_id');
            $table->string('lab_name');
            $table->string('contact_person');
            $table->string('contact_email');
            $table->string('contact_phone');
            $table->text('address');
            $table->enum('license_status', ['active', 'expired', 'pending'])->default('pending');
            $table->foreignId('settings_id')->constrained('settings', 'settings_id')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('labs');
    }
};