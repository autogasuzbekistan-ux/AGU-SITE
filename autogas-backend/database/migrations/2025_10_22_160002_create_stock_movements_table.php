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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventory')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Kim o'zgartirdi

            // Movement details
            $table->enum('type', [
                'in',           // Kirish (sotib olish, qaytarish)
                'out',          // Chiqish (sotish, transfer)
                'transfer_in',  // Transfer orqali kirish
                'transfer_out', // Transfer orqali chiqish
                'adjustment',   // Tuzatish (inventarizatsiya)
                'damaged',      // Shikastlangan
                'expired',      // Muddati o'tgan
                'return',       // Qaytarilgan
                'production',   // Ishlab chiqarish
                'sample'        // Namuna
            ]);

            $table->decimal('quantity', 15, 2);
            $table->decimal('quantity_before', 15, 2); // Oldingi miqdor
            $table->decimal('quantity_after', 15, 2); // Keyingi miqdor

            // Related entities (nullable - turli sabablarga ko'ra)
            $table->foreignId('transfer_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('transaction_id')->nullable()->constrained()->onDelete('set null');

            // Source/Destination (transfer uchun)
            $table->foreignId('from_warehouse_id')->nullable()->constrained('warehouses')->onDelete('set null');
            $table->foreignId('to_warehouse_id')->nullable()->constrained('warehouses')->onDelete('set null');

            // Details
            $table->string('reference_number')->unique(); // SM-XXXXXXXX
            $table->text('reason')->nullable(); // Sabab
            $table->text('notes')->nullable();

            // Financial
            $table->decimal('cost_per_unit', 15, 2)->nullable();
            $table->decimal('total_value', 15, 2)->nullable();

            // Metadata
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['warehouse_id', 'product_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index('type');
            $table->index('reference_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
