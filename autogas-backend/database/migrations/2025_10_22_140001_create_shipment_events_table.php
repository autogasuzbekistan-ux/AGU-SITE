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
        Schema::create('shipment_events', function (Blueprint $table) {
            $table->id();

            // Bog'liq shipment
            $table->foreignId('shipment_id')->constrained('shipments')->onDelete('cascade');

            // Event ma'lumotlari
            $table->string('event_type'); // status_changed, location_updated, note_added, issue_reported
            $table->string('status')->nullable(); // Yangi status (agar status_changed bo'lsa)
            $table->string('location')->nullable(); // Lokatsiya
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Tavsif
            $table->text('description'); // Event tavsifi
            $table->text('notes')->nullable(); // Qo'shimcha izoh

            // Kim yaratdi
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();

            // Indexes
            $table->index('shipment_id');
            $table->index('event_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_events');
    }
};
