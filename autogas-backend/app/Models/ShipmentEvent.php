<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShipmentEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'shipment_id',
        'event_type',
        'status',
        'location',
        'latitude',
        'longitude',
        'description',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    // Relationships

    /**
     * Bog'liq shipment
     */
    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }

    /**
     * Event yaratgan foydalanuvchi
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Helper Methods

    /**
     * Event type nomi (O'zbekcha)
     */
    public function getEventTypeNameAttribute()
    {
        return match($this->event_type) {
            'status_changed' => 'Holat o\'zgartirildi',
            'location_updated' => 'Lokatsiya yangilandi',
            'note_added' => 'Izoh qo\'shildi',
            'issue_reported' => 'Muammo xabar qilindi',
            default => 'Noma\'lum',
        };
    }

    /**
     * Icon for event type
     */
    public function getEventIconAttribute()
    {
        return match($this->event_type) {
            'status_changed' => 'fa-sync-alt',
            'location_updated' => 'fa-map-marker-alt',
            'note_added' => 'fa-sticky-note',
            'issue_reported' => 'fa-exclamation-triangle',
            default => 'fa-info-circle',
        };
    }

    /**
     * Color for event type
     */
    public function getEventColorAttribute()
    {
        return match($this->event_type) {
            'status_changed' => 'blue',
            'location_updated' => 'green',
            'note_added' => 'purple',
            'issue_reported' => 'red',
            default => 'gray',
        };
    }
}
