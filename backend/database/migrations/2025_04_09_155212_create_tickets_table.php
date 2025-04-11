<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('status', ['open', 'inprogress', 'closed'])->default('open');
            $table->string('attachment')->nullable();
            $table->string('assignee')->nullable();
            $table->string('representer_name');
            $table->string('representer_email');
            $table->string('representer_phone');
            $table->date('eta')->nullable();
            $table->unsignedBigInteger('client_id'); // Changed from foreignId to unsignedBigInteger
            $table->timestamps();
            
            // Removed the foreign key constraint
            // $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('tickets');
    }
};