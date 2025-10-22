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
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Kontragent

            // Stock details
            $table->decimal('quantity', 15, 2)->default(0);
            $table->decimal('reserved_quantity', 15, 2)->default(0); // Band qilingan (pending orders/transfers)
            $table->decimal('available_quantity', 15, 2)->default(0); // Mavjud (quantity - reserved)
            $table->string('unit')->default('dona'); // dona, kg, litr, m³

            // Thresholds
            $table->decimal('min_quantity', 15, 2)->default(10); // Minimum stock (alert)
            $table->decimal('max_quantity', 15, 2)->nullable(); // Maximum stock
            $table->decimal('reorder_point', 15, 2)->nullable(); // Qayta buyurtma nuqtasi

            // Location in warehouse
            $table->string('location')->nullable(); // Raft, qator
            $table->string('batch_number')->nullable(); // Partiya raqami
            $table->date('expiry_date')->nullable(); // Muddati

            // Financial
            $table->decimal('cost_per_unit', 15, 2)->nullable(); // Tannarx
            $table->decimal('total_value', 15, 2)->default(0); // Umumiy qiymat

            // Metadata
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();

            // Timestamps
            $table->timestamp('last_stock_check')->nullable(); // So'nggi inventarizatsiya
            $table->timestamps();

            // Indexes
            $table->index(['warehouse_id', 'product_id']);
            $table->index(['user_id', 'product_id']);
            $table->index('quantity');

            // Unique constraint
            $table->unique(['warehouse_id', 'product_id', 'batch_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
