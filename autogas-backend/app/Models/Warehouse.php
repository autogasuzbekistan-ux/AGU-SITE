<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'code',
        'description',
        'region',
        'district',
        'address',
        'latitude',
        'longitude',
        'phone',
        'manager_name',
        'total_capacity',
        'used_capacity',
        'capacity_unit',
        'is_active',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean',
        'total_capacity' => 'decimal:2',
        'used_capacity' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    // Relationships

    /**
     * Warehouse egasi (Kontragent)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Warehouse inventorylari
     */
    public function inventory()
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * Stock movements
     */
    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    // Helper Methods

    /**
     * Generate unique warehouse code
     */
    public static function generateCode()
    {
        do {
            $code = 'WH-' . strtoupper(Str::random(6));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    /**
     * Get available capacity
     */
    public function getAvailableCapacityAttribute()
    {
        if (!$this->total_capacity) return null;
        return $this->total_capacity - $this->used_capacity;
    }

    /**
     * Get capacity usage percentage
     */
    public function getCapacityUsagePercentageAttribute()
    {
        if (!$this->total_capacity || $this->total_capacity == 0) return 0;
        return round(($this->used_capacity / $this->total_capacity) * 100, 2);
    }

    /**
     * Check if warehouse is full
     */
    public function isFull()
    {
        if (!$this->total_capacity) return false;
        return $this->used_capacity >= $this->total_capacity;
    }

    /**
     * Check if warehouse is nearly full (90%)
     */
    public function isNearlyFull()
    {
        if (!$this->total_capacity) return false;
        return $this->capacity_usage_percentage >= 90;
    }

    /**
     * Update used capacity
     */
    public function updateUsedCapacity()
    {
        // Bu methodda agar kerak bo'lsa real hisoblash qilish mumkin
        // Hozircha manual update qilamiz
        return $this;
    }

    /**
     * Get total inventory value
     */
    public function getTotalInventoryValue()
    {
        return $this->inventory()->sum('total_value');
    }

    /**
     * Get total products count
     */
    public function getTotalProductsCount()
    {
        return $this->inventory()->count();
    }

    /**
     * Get low stock items
     */
    public function getLowStockItems()
    {
        return $this->inventory()
            ->whereColumn('available_quantity', '<=', 'min_quantity')
            ->with('product')
            ->get();
    }

    /**
     * Activate warehouse
     */
    public function activate()
    {
        $this->update([
            'is_active' => true,
            'status' => 'active',
        ]);

        return $this;
    }

    /**
     * Deactivate warehouse
     */
    public function deactivate()
    {
        $this->update([
            'is_active' => false,
            'status' => 'inactive',
        ]);

        return $this;
    }

    // Scopes

    /**
     * Active warehouses
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Inactive warehouses
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * By region
     */
    public function scopeInRegion($query, $region)
    {
        return $query->where('region', $region);
    }

    /**
     * By user (kontragent)
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Full warehouses
     */
    public function scopeFull($query)
    {
        return $query->where('status', 'full')
            ->orWhereRaw('used_capacity >= total_capacity');
    }

    /**
     * Nearly full warehouses (90% or more)
     */
    public function scopeNearlyFull($query)
    {
        return $query->whereRaw('(used_capacity / total_capacity) >= 0.9');
    }

    // Accessors

    /**
     * Status name in Uzbek
     */
    public function getStatusNameAttribute()
    {
        return match($this->status) {
            'active' => 'Faol',
            'inactive' => 'Faol emas',
            'maintenance' => 'Ta\'mirlashda',
            'full' => 'To\'lgan',
            default => 'Noma\'lum',
        };
    }

    /**
     * Full address
     */
    public function getFullAddressAttribute()
    {
        $parts = array_filter([
            $this->address,
            $this->district,
            $this->region,
        ]);

        return implode(', ', $parts);
    }
}
