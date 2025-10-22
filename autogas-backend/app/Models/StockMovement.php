<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_id',
        'warehouse_id',
        'product_id',
        'user_id',
        'type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'transfer_id',
        'order_id',
        'transaction_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'reference_number',
        'reason',
        'notes',
        'cost_per_unit',
        'total_value',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'quantity_before' => 'decimal:2',
        'quantity_after' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'total_value' => 'decimal:2',
        'metadata' => 'array',
    ];

    // Relationships

    /**
     * Inventory
     */
    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }

    /**
     * Warehouse
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Product
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * User (kim o'zgartirdi)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Related transfer
     */
    public function transfer()
    {
        return $this->belongsTo(Transfer::class);
    }

    /**
     * Related order
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Related transaction
     */
    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * From warehouse (transfer)
     */
    public function fromWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    /**
     * To warehouse (transfer)
     */
    public function toWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    // Helper Methods

    /**
     * Generate unique reference number
     */
    public static function generateReferenceNumber()
    {
        do {
            $referenceNumber = 'SM-' . strtoupper(Str::random(8));
        } while (self::where('reference_number', $referenceNumber)->exists());

        return $referenceNumber;
    }

    /**
     * Check if movement is incoming
     */
    public function isIncoming()
    {
        return in_array($this->type, ['in', 'transfer_in', 'return', 'production']);
    }

    /**
     * Check if movement is outgoing
     */
    public function isOutgoing()
    {
        return in_array($this->type, ['out', 'transfer_out', 'damaged', 'expired', 'sample']);
    }

    /**
     * Get absolute quantity
     */
    public function getAbsoluteQuantity()
    {
        return abs($this->quantity);
    }

    // Scopes

    /**
     * Incoming movements
     */
    public function scopeIncoming($query)
    {
        return $query->whereIn('type', ['in', 'transfer_in', 'return', 'production']);
    }

    /**
     * Outgoing movements
     */
    public function scopeOutgoing($query)
    {
        return $query->whereIn('type', ['out', 'transfer_out', 'damaged', 'expired', 'sample']);
    }

    /**
     * By type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * By warehouse
     */
    public function scopeInWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    /**
     * By product
     */
    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * By user
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Between dates
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Recent movements (last 30 days)
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subDays(30));
    }

    // Accessors

    /**
     * Type name in Uzbek
     */
    public function getTypeNameAttribute()
    {
        return match($this->type) {
            'in' => 'Kirish',
            'out' => 'Chiqish',
            'transfer_in' => 'Transfer (kirish)',
            'transfer_out' => 'Transfer (chiqish)',
            'adjustment' => 'Tuzatish',
            'damaged' => 'Shikastlangan',
            'expired' => 'Muddati o\'tgan',
            'return' => 'Qaytarilgan',
            'production' => 'Ishlab chiqarish',
            'sample' => 'Namuna',
            default => 'Noma\'lum',
        };
    }

    /**
     * Type icon
     */
    public function getTypeIconAttribute()
    {
        return match($this->type) {
            'in' => 'fa-arrow-down',
            'out' => 'fa-arrow-up',
            'transfer_in' => 'fa-arrow-circle-down',
            'transfer_out' => 'fa-arrow-circle-up',
            'adjustment' => 'fa-wrench',
            'damaged' => 'fa-exclamation-triangle',
            'expired' => 'fa-clock',
            'return' => 'fa-undo',
            'production' => 'fa-industry',
            'sample' => 'fa-flask',
            default => 'fa-box',
        };
    }

    /**
     * Type color
     */
    public function getTypeColorAttribute()
    {
        if ($this->isIncoming()) return 'green';
        if ($this->isOutgoing()) return 'red';
        return 'gray';
    }

    /**
     * Direction
     */
    public function getDirectionAttribute()
    {
        if ($this->isIncoming()) return 'in';
        if ($this->isOutgoing()) return 'out';
        return 'neutral';
    }
}
