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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            // Kim kimga pul o'tkazdi
            $table->foreignId('sender_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('receiver_id')->nullable()->constrained('users')->onDelete('set null');

            // Tranzaksiya turi
            // transfer - oddiy pul o'tkazma (kontragent to kontragent)
            // payment - transfer uchun to'lov
            // product_sale - mahsulot sotildi
            // commission - komissiya
            // deposit - balansga pul qo'shish (admin tomonidan)
            // withdrawal - balansdan pul chiqarish (admin tomonidan)
            // refund - qaytarish
            $table->enum('type', [
                'transfer',
                'payment',
                'product_sale',
                'commission',
                'deposit',
                'withdrawal',
                'refund'
            ])->default('transfer');

            // Summa
            $table->decimal('amount', 15, 2);

            // Holat
            // pending - kutilmoqda
            // completed - bajarildi
            // failed - muvaffaqiyatsiz
            // cancelled - bekor qilindi
            $table->enum('status', [
                'pending',
                'completed',
                'failed',
                'cancelled'
            ])->default('pending');

            // Bog'liq ma'lumotlar
            $table->foreignId('transfer_id')->nullable()->constrained('transfers')->onDelete('set null');
            $table->foreignId('order_id')->nullable()->constrained('orders')->onDelete('set null');

            // Qo'shimcha ma'lumotlar
            $table->text('description')->nullable(); // Tavsif
            $table->text('notes')->nullable(); // Qo'shimcha izoh
            $table->string('reference_number')->unique()->nullable(); // Referens raqam

            // Balanslarga ta'siri
            $table->decimal('sender_balance_before', 15, 2)->nullable();
            $table->decimal('sender_balance_after', 15, 2)->nullable();
            $table->decimal('receiver_balance_before', 15, 2)->nullable();
            $table->decimal('receiver_balance_after', 15, 2)->nullable();

            // Vaqt ma'lumotlari
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('failure_reason')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('type');
            $table->index('status');
            $table->index('sender_id');
            $table->index('receiver_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
