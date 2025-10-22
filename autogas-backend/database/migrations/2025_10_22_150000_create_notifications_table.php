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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Notification details
            $table->string('type'); // transfer_approved, transfer_rejected, money_received, shipment_updated, etc.
            $table->string('title');
            $table->text('message');

            // Related resources (nullable for flexibility)
            $table->foreignId('transfer_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('transaction_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('shipment_id')->nullable()->constrained()->onDelete('cascade');

            // Notification metadata
            $table->json('data')->nullable(); // Additional data
            $table->string('action_url')->nullable(); // Link to resource

            // Status
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            // Channel tracking
            $table->boolean('sent_via_email')->default(false);
            $table->boolean('sent_via_sms')->default(false);
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamp('sms_sent_at')->nullable();

            // Priority
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');

            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'is_read', 'created_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
