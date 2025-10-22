<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'type',
        'amount',
        'status',
        'transfer_id',
        'order_id',
        'description',
        'notes',
        'reference_number',
        'sender_balance_before',
        'sender_balance_after',
        'receiver_balance_before',
        'receiver_balance_after',
        'completed_at',
        'failed_at',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'sender_balance_before' => 'decimal:2',
        'sender_balance_after' => 'decimal:2',
        'receiver_balance_before' => 'decimal:2',
        'receiver_balance_after' => 'decimal:2',
        'completed_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    // Relationships

    /**
     * Yuboruvchi (pul beruvchi)
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Qabul qiluvchi (pul oluvchi)
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Bog'liq transfer
     */
    public function transfer()
    {
        return $this->belongsTo(Transfer::class);
    }

    /**
     * Bog'liq buyurtma
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Helper Methods

    /**
     * Referens raqam generatsiya qilish
     */
    public static function generateReferenceNumber()
    {
        do {
            $refNumber = 'TXN-' . strtoupper(Str::random(10));
        } while (self::where('reference_number', $refNumber)->exists());

        return $refNumber;
    }

    /**
     * Tranzaksiyani bajarish
     */
    public function complete()
    {
        if ($this->status === 'pending') {
            $this->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
            return true;
        }
        return false;
    }

    /**
     * Tranzaksiyani bekor qilish
     */
    public function fail($reason)
    {
        if ($this->status === 'pending') {
            $this->update([
                'status' => 'failed',
                'failed_at' => now(),
                'failure_reason' => $reason,
            ]);
            return true;
        }
        return false;
    }

    /**
     * Tranzaksiyani cancel qilish
     */
    public function cancel()
    {
        if ($this->status === 'pending') {
            $this->update(['status' => 'cancelled']);
            return true;
        }
        return false;
    }

    /**
     * Type nomi (O'zbekcha)
     */
    public function getTypeNameAttribute()
    {
        return match($this->type) {
            'transfer' => 'Pul o\'tkazmasi',
            'payment' => 'To\'lov',
            'product_sale' => 'Mahsulot sotildi',
            'commission' => 'Komissiya',
            'deposit' => 'Balansga qo\'shish',
            'withdrawal' => 'Balansdan chiqarish',
            'refund' => 'Qaytarish',
            default => 'Noma\'lum',
        };
    }

    /**
     * Status nomi (O'zbekcha)
     */
    public function getStatusNameAttribute()
    {
        return match($this->status) {
            'pending' => 'Kutilmoqda',
            'completed' => 'Bajarildi',
            'failed' => 'Muvaffaqiyatsiz',
            'cancelled' => 'Bekor qilindi',
            default => 'Noma\'lum',
        };
    }

    // Scopes

    /**
     * Faqat pending
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Faqat completed
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Faqat failed
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Muayyan foydalanuvchi yuborgan
     */
    public function scopeSentBy($query, $userId)
    {
        return $query->where('sender_id', $userId);
    }

    /**
     * Muayyan foydalanuvchi qabul qilgan
     */
    public function scopeReceivedBy($query, $userId)
    {
        return $query->where('receiver_id', $userId);
    }

    /**
     * Muayyan type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Muayyan vaqt oralig'ida
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
