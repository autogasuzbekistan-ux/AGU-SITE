<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_id',
        'tracking_code',
        'carrier_name',
        'carrier_phone',
        'vehicle_number',
        'status',
        'current_location',
        'latitude',
        'longitude',
        'origin_address',
        'origin_city',
        'destination_address',
        'destination_city',
        'estimated_pickup_at',
        'actual_pickup_at',
        'estimated_delivery_at',
        'actual_delivery_at',
        'notes',
        'special_instructions',
        'weight',
        'package_dimensions',
        'package_count',
        'receiver_signature',
        'delivery_notes',
        'delivery_photo',
        'has_issues',
        'issues_description',
    ];

    protected $casts = [
        'estimated_pickup_at' => 'datetime',
        'actual_pickup_at' => 'datetime',
        'estimated_delivery_at' => 'datetime',
        'actual_delivery_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'weight' => 'decimal:2',
        'has_issues' => 'boolean',
        'package_count' => 'integer',
    ];

    // Relationships

    /**
     * Bog'liq transfer
     */
    public function transfer()
    {
        return $this->belongsTo(Transfer::class);
    }

    /**
     * Shipment events (timeline)
     */
    public function events()
    {
        return $this->hasMany(ShipmentEvent::class)->orderBy('created_at', 'desc');
    }

    // Helper Methods

    /**
     * Tracking code generatsiya qilish
     */
    public static function generateTrackingCode()
    {
        do {
            $trackingCode = 'SHIP-' . strtoupper(Str::random(10));
        } while (self::where('tracking_code', $trackingCode)->exists());

        return $trackingCode;
    }

    /**
     * Status o'zgartirish va event yaratish
     */
    public function updateStatus($newStatus, $description, $userId = null, $location = null)
    {
        $oldStatus = $this->status;

        $this->update(['status' => $newStatus]);

        // Event yaratish
        $this->events()->create([
            'event_type' => 'status_changed',
            'status' => $newStatus,
            'location' => $location ?? $this->current_location,
            'description' => $description,
            'created_by' => $userId,
        ]);

        return true;
    }

    /**
     * Lokatsiya yangilash
     */
    public function updateLocation($location, $latitude = null, $longitude = null, $userId = null)
    {
        $this->update([
            'current_location' => $location,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        // Event yaratish
        $this->events()->create([
            'event_type' => 'location_updated',
            'location' => $location,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'description' => "Lokatsiya yangilandi: {$location}",
            'created_by' => $userId,
        ]);

        return true;
    }

    /**
     * Izoh qo'shish
     */
    public function addNote($note, $userId = null)
    {
        $this->events()->create([
            'event_type' => 'note_added',
            'description' => 'Izoh qo\'shildi',
            'notes' => $note,
            'created_by' => $userId,
        ]);

        return true;
    }

    /**
     * Muammo xabar qilish
     */
    public function reportIssue($issue, $userId = null)
    {
        $this->update([
            'has_issues' => true,
            'issues_description' => $issue,
        ]);

        $this->events()->create([
            'event_type' => 'issue_reported',
            'description' => 'Muammo xabar qilindi',
            'notes' => $issue,
            'created_by' => $userId,
        ]);

        return true;
    }

    /**
     * Olib ketish
     */
    public function markAsPickedUp($userId = null)
    {
        $this->update([
            'status' => 'picked_up',
            'actual_pickup_at' => now(),
        ]);

        $this->events()->create([
            'event_type' => 'status_changed',
            'status' => 'picked_up',
            'description' => 'Yuk olib ketildi',
            'created_by' => $userId,
        ]);

        return true;
    }

    /**
     * Yetkazib berish
     */
    public function markAsDelivered($deliveryNotes = null, $userId = null)
    {
        $this->update([
            'status' => 'delivered',
            'actual_delivery_at' => now(),
            'delivery_notes' => $deliveryNotes,
        ]);

        $this->events()->create([
            'event_type' => 'status_changed',
            'status' => 'delivered',
            'description' => 'Yuk topshirildi',
            'notes' => $deliveryNotes,
            'created_by' => $userId,
        ]);

        return true;
    }

    /**
     * Status nomi (O'zbekcha)
     */
    public function getStatusNameAttribute()
    {
        return match($this->status) {
            'preparing' => 'Tayyorlanmoqda',
            'picked_up' => 'Olib ketildi',
            'in_transit' => 'Yo\'lda',
            'arrived' => 'Manzilga yetdi',
            'delivered' => 'Topshirildi',
            'returned' => 'Qaytarildi',
            'cancelled' => 'Bekor qilindi',
            default => 'Noma\'lum',
        };
    }

    /**
     * Progress percentage
     */
    public function getProgressPercentageAttribute()
    {
        return match($this->status) {
            'preparing' => 10,
            'picked_up' => 30,
            'in_transit' => 60,
            'arrived' => 90,
            'delivered' => 100,
            'returned' => 100,
            'cancelled' => 0,
            default => 0,
        };
    }

    /**
     * Kechikkanmi?
     */
    public function getIsDelayedAttribute()
    {
        if (!$this->estimated_delivery_at || $this->status === 'delivered') {
            return false;
        }

        return now()->greaterThan($this->estimated_delivery_at);
    }

    // Scopes

    /**
     * Active shipments
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['delivered', 'returned', 'cancelled']);
    }

    /**
     * Delivered
     */
    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    /**
     * In transit
     */
    public function scopeInTransit($query)
    {
        return $query->where('status', 'in_transit');
    }

    /**
     * With issues
     */
    public function scopeWithIssues($query)
    {
        return $query->where('has_issues', true);
    }

    /**
     * Delayed
     */
    public function scopeDelayed($query)
    {
        return $query->whereNotNull('estimated_delivery_at')
                     ->where('estimated_delivery_at', '<', now())
                     ->whereNotIn('status', ['delivered', 'returned', 'cancelled']);
    }
}
