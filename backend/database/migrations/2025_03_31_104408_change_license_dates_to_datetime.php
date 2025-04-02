<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->dateTime('issued_date')->change();
            $table->dateTime('expiry_date')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('datetime', function (Blueprint $table) {
            //
        });
    }
};
