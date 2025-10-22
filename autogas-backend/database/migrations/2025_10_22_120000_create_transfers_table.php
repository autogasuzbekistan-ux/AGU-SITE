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
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();

            // Yuboruvchi va qabul qiluvchi kontragentlar
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');

            // Mahsulot ma'lumotlari
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantity'); // Miqdor

            // Viloyat ma'lumotlari
            $table->string('from_region'); // Qaysi viloyatdan
            $table->string('to_region'); // Qaysi viloyatga

            // Holat (Status)
            // pending - Kutilmoqda (yuborildi, tasdiqlanmagan)
            // approved - Tasdiqlangan (qabul qiluvchi rozi bo'ldi)
            // in_transit - Yo'lda
            // delivered - Yetkazildi
            // rejected - Rad etildi
            // cancelled - Bekor qilindi
            $table->enum('status', [
                'pending',
                'approved',
                'in_transit',
                'delivered',
                'rejected',
                'cancelled'
            ])->default('pending');

            // Qo'shimcha ma'lumotlar
            $table->text('notes')->nullable(); // Izoh
            $table->string('tracking_number')->unique()->nullable(); // Kuzatuv raqami

            // Narx va to'lov ma'lumotlari
            $table->decimal('unit_price', 10, 2)->nullable(); // Birlik narxi
            $table->decimal('total_amount', 10, 2)->nullable(); // Umumiy summa
            $table->boolean('is_paid')->default(false); // To'langan/To'lanmagan

            // Vaqt ma'lumotlari
            $table->timestamp('requested_at')->nullable(); // So'ralgan vaqt
            $table->timestamp('approved_at')->nullable(); // Tasdiqlangan vaqt
            $table->timestamp('shipped_at')->nullable(); // Jo'natilgan vaqt
            $table->timestamp('delivered_at')->nullable(); // Yetkazilgan vaqt

            // Rad etish sababi
            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            // Indexes for better performance
            $table->index('status');
            $table->index('sender_id');
            $table->index('receiver_id');
            $table->index(['from_region', 'to_region']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
