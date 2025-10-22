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
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();

            // Bog'liq transfer
            $table->foreignId('transfer_id')->constrained('transfers')->onDelete('cascade');

            // Tracking ma'lumotlari
            $table->string('tracking_code')->unique(); // Kuzatuv kodi
            $table->string('carrier_name')->nullable(); // Tashuvchi nomi
            $table->string('carrier_phone')->nullable(); // Tashuvchi telefoni
            $table->string('vehicle_number')->nullable(); // Transport raqami

            // Holat
            // preparing - Tayyorlanmoqda
            // picked_up - Olib ketildi
            // in_transit - Yo'lda
            // arrived - Manzilga yetdi
            // delivered - Topshirildi
            // returned - Qaytarildi
            // cancelled - Bekor qilindi
            $table->enum('status', [
                'preparing',
                'picked_up',
                'in_transit',
                'arrived',
                'delivered',
                'returned',
                'cancelled'
            ])->default('preparing');

            // Lokatsiya ma'lumotlari
            $table->string('current_location')->nullable(); // Hozirgi joylashuv
            $table->decimal('latitude', 10, 7)->nullable(); // GPS kenglik
            $table->decimal('longitude', 10, 7)->nullable(); // GPS uzunlik

            // Marshrut ma'lumotlari
            $table->string('origin_address')->nullable(); // Boshlang'ich manzil
            $table->string('origin_city')->nullable(); // Boshlang'ich shahar
            $table->string('destination_address')->nullable(); // Maqsad manzil
            $table->string('destination_city')->nullable(); // Maqsad shahar

            // Vaqt ma'lumotlari
            $table->timestamp('estimated_pickup_at')->nullable(); // Taxminiy olib ketish vaqti
            $table->timestamp('actual_pickup_at')->nullable(); // Haqiqiy olib ketish vaqti
            $table->timestamp('estimated_delivery_at')->nullable(); // Taxminiy yetkazish vaqti
            $table->timestamp('actual_delivery_at')->nullable(); // Haqiqiy yetkazish vaqti

            // Qo'shimcha ma'lumotlar
            $table->text('notes')->nullable(); // Izohlar
            $table->text('special_instructions')->nullable(); // Maxsus ko'rsatmalar
            $table->decimal('weight', 8, 2)->nullable(); // Og'irlik (kg)
            $table->string('package_dimensions')->nullable(); // O'lchamlar
            $table->integer('package_count')->default(1); // Quti soni

            // Imzo va tasdiqlash
            $table->string('receiver_signature')->nullable(); // Qabul qiluvchi imzosi (fayl yo'li)
            $table->text('delivery_notes')->nullable(); // Yetkazib berish izohi
            $table->string('delivery_photo')->nullable(); // Yetkazib berish rasmi

            // Muammolar
            $table->boolean('has_issues')->default(false); // Muammo bormi
            $table->text('issues_description')->nullable(); // Muammo tavsifi

            $table->timestamps();

            // Indexes
            $table->index('status');
            $table->index('transfer_id');
            $table->index('tracking_code');
            $table->index('current_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
