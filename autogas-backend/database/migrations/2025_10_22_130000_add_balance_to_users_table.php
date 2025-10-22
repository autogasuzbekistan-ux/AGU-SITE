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
        Schema::table('users', function (Blueprint $table) {
            // Foydalanuvchi balansi (kontragentlar uchun)
            $table->decimal('balance', 15, 2)->default(0)->after('region');

            // Jami kirim (total received)
            $table->decimal('total_received', 15, 2)->default(0)->after('balance');

            // Jami chiqim (total sent)
            $table->decimal('total_sent', 15, 2)->default(0)->after('total_received');

            // Qarz (debt) - manfiy bo'lishi mumkin
            $table->decimal('debt', 15, 2)->default(0)->after('total_sent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['balance', 'total_received', 'total_sent', 'debt']);
        });
    }
};
