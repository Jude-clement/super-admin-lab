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
        Schema::create('settings', function (Blueprint $table) {
            $table->id('settings_id');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website_link')->nullable();
            $table->string('logo')->nullable();
            $table->string('letterhead')->nullable();
            $table->text('location')->nullable();
            $table->boolean('whatsappactivated')->default(false);
            $table->string('whatsappno')->nullable();
            $table->string('whatsappid')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};