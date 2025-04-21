<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Add the column if it doesn't exist
            if (!Schema::hasColumn('tickets', 'lab_id')) {
                $table->unsignedBigInteger('lab_id')->after('id');
            }
            
            // Add foreign key constraint
            $table->foreign('lab_id')
                  ->references('lab_id')
                  ->on('labs')
                  ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['lab_id']);
            $table->dropColumn('lab_id');
        });
    }
};