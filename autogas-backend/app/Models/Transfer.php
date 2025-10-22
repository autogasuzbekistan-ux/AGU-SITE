<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Transfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'product_id',
        'quantity',
        'from_region',
        'to_region',
        'status',
        'notes',
        'tracking_number',
        'unit_price',
        'total_amount',
        'is_paid',
        'requested_at',
        'approved_at',
        'shipped_at',
        'delivered_at',
        'rejection_reason',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'is_paid' => 'boolean',
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    // Relationships

    /**
     * Yuboruvchi kontragent
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Qabul qiluvchi kontragent
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Mahsulot
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Shipment (yuk jo'natish)
     */
    public function shipment()
    {
        return $this->hasOne(Shipment::class);
    }

    // Helper Methods

    /**
     * Tracking raqam generatsiya qilish
     */
    public static function generateTrackingNumber()
    {
        do {
            $trackingNumber = 'TRF-' . strtoupper(Str::random(8));
        } while (self::where('tracking_number', $trackingNumber)->exists());

        return $trackingNumber;
    }

    /**
     * Transferni tasdiqlash
     */
    public function approve()
    {
        $this->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);
    }

    /**
     * Yo'lga chiqarish
     */
    public function ship()
    {
        $this->update([
            'status' => 'in_transit',
            'shipped_at' => now(),
        ]);
    }

    /**
     * Yetkazib berish
     */
    public function deliver()
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);
    }

    /**
     * Rad etish
     */
    public function reject($reason)
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Bekor qilish
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
     * Holat nomi (O'zbekcha)
     */
    public function getStatusNameAttribute()
    {
        return match($this->status) {
            'pending' => 'Kutilmoqda',
            'approved' => 'Tasdiqlangan',
            'in_transit' => 'Yo\'lda',
            'delivered' => 'Yetkazildi',
            'rejected' => 'Rad etildi',
            'cancelled' => 'Bekor qilindi',
            default => 'Noma\'lum',
        };
    }

    /**
     * To'liq summa hisoblash
     */
    public function calculateTotalAmount()
    {
        if ($this->unit_price && $this->quantity) {
            $this->total_amount = $this->unit_price * $this->quantity;
            $this->save();
        }
    }

    // Scopes

    /**
     * Faqat kutilayotgan transferlar
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Faqat tasdiqlangan transferlar
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Yo'ldagi transferlar
     */
    public function scopeInTransit($query)
    {
        return $query->where('status', 'in_transit');
    }

    /**
     * Yetkazilgan transferlar
     */
    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    /**
     * Muayyan foydalanuvchi yuborgan transferlar
     */
    public function scopeSentBy($query, $userId)
    {
        return $query->where('sender_id', $userId);
    }

    /**
     * Muayyan foydalanuvchiga kelgan transferlar
     */
    public function scopeReceivedBy($query, $userId)
    {
        return $query->where('receiver_id', $userId);
    }

    /**
     * Muayyan viloyatdan
     */
    public function scopeFromRegion($query, $region)
    {
        return $query->where('from_region', $region);
    }

    /**
     * Muayyan viloyatga
     */
    public function scopeToRegion($query, $region)
    {
        return $query->where('to_region', $region);
    }
}
