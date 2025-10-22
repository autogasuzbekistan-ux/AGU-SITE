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
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Kontragent

            // Warehouse details
            $table->string('name');
            $table->string('code')->unique(); // WH-XXXX
            $table->text('description')->nullable();

            // Location
            $table->string('region'); // Viloyat
            $table->string('district')->nullable(); // Tuman
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            // Contact
            $table->string('phone')->nullable();
            $table->string('manager_name')->nullable();

            // Capacity
            $table->decimal('total_capacity', 15, 2)->nullable(); // Umumiy sig'im (m³)
            $table->decimal('used_capacity', 15, 2)->default(0); // Ishlatilgan sig'im
            $table->string('capacity_unit')->default('m³'); // m³, kg, items

            // Status
            $table->boolean('is_active')->default(true);
            $table->enum('status', ['active', 'inactive', 'maintenance', 'full'])->default('active');

            // Metadata
            $table->json('metadata')->nullable(); // Qo'shimcha ma'lumotlar

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['user_id', 'is_active']);
            $table->index('region');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
