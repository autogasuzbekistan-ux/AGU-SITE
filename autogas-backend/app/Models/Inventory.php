<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'user_id',
        'quantity',
        'reserved_quantity',
        'available_quantity',
        'unit',
        'min_quantity',
        'max_quantity',
        'reorder_point',
        'location',
        'batch_number',
        'expiry_date',
        'cost_per_unit',
        'total_value',
        'metadata',
        'notes',
        'last_stock_check',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'available_quantity' => 'decimal:2',
        'min_quantity' => 'decimal:2',
        'max_quantity' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'total_value' => 'decimal:2',
        'metadata' => 'array',
        'expiry_date' => 'date',
        'last_stock_check' => 'datetime',
    ];

    // Relationships

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
     * User (Kontragent)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
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
     * Add stock
     */
    public function addStock($quantity, $type = 'in', $userId = null, $notes = null, $relatedId = null, $relatedType = null)
    {
        $quantityBefore = $this->quantity;

        $this->quantity += $quantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->updateTotalValue();
        $this->save();

        // Record movement
        $movementData = [
            'inventory_id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'user_id' => $userId ?? $this->user_id,
            'type' => $type,
            'quantity' => $quantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $this->quantity,
            'reference_number' => StockMovement::generateReferenceNumber(),
            'notes' => $notes,
            'cost_per_unit' => $this->cost_per_unit,
            'total_value' => $quantity * ($this->cost_per_unit ?? 0),
        ];

        // Add related entity
        if ($relatedType === 'transfer') {
            $movementData['transfer_id'] = $relatedId;
        } elseif ($relatedType === 'order') {
            $movementData['order_id'] = $relatedId;
        } elseif ($relatedType === 'transaction') {
            $movementData['transaction_id'] = $relatedId;
        }

        StockMovement::create($movementData);

        return $this;
    }

    /**
     * Remove stock
     */
    public function removeStock($quantity, $type = 'out', $userId = null, $notes = null, $relatedId = null, $relatedType = null)
    {
        if ($this->available_quantity < $quantity) {
            throw new \Exception("Yetarli mahsulot yo'q. Mavjud: {$this->available_quantity}");
        }

        $quantityBefore = $this->quantity;

        $this->quantity -= $quantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->updateTotalValue();
        $this->save();

        // Record movement
        $movementData = [
            'inventory_id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'user_id' => $userId ?? $this->user_id,
            'type' => $type,
            'quantity' => -$quantity, // Negative for out
            'quantity_before' => $quantityBefore,
            'quantity_after' => $this->quantity,
            'reference_number' => StockMovement::generateReferenceNumber(),
            'notes' => $notes,
            'cost_per_unit' => $this->cost_per_unit,
            'total_value' => $quantity * ($this->cost_per_unit ?? 0),
        ];

        // Add related entity
        if ($relatedType === 'transfer') {
            $movementData['transfer_id'] = $relatedId;
        } elseif ($relatedType === 'order') {
            $movementData['order_id'] = $relatedId;
        } elseif ($relatedType === 'transaction') {
            $movementData['transaction_id'] = $relatedId;
        }

        StockMovement::create($movementData);

        return $this;
    }

    /**
     * Reserve stock
     */
    public function reserveStock($quantity)
    {
        if ($this->available_quantity < $quantity) {
            throw new \Exception("Yetarli mahsulot yo'q rezerv qilish uchun");
        }

        $this->reserved_quantity += $quantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->save();

        return $this;
    }

    /**
     * Release reserved stock
     */
    public function releaseReservedStock($quantity)
    {
        $this->reserved_quantity -= $quantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->save();

        return $this;
    }

    /**
     * Adjust stock (inventarizatsiya)
     */
    public function adjustStock($newQuantity, $userId, $reason)
    {
        $quantityBefore = $this->quantity;
        $difference = $newQuantity - $quantityBefore;

        $this->quantity = $newQuantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->last_stock_check = now();
        $this->updateTotalValue();
        $this->save();

        // Record adjustment
        StockMovement::create([
            'inventory_id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'user_id' => $userId,
            'type' => 'adjustment',
            'quantity' => $difference,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $newQuantity,
            'reference_number' => StockMovement::generateReferenceNumber(),
            'reason' => $reason,
            'cost_per_unit' => $this->cost_per_unit,
            'total_value' => abs($difference) * ($this->cost_per_unit ?? 0),
        ]);

        return $this;
    }

    /**
     * Update total value
     */
    public function updateTotalValue()
    {
        if ($this->cost_per_unit) {
            $this->total_value = $this->quantity * $this->cost_per_unit;
        }

        return $this;
    }

    /**
     * Check if low stock
     */
    public function isLowStock()
    {
        return $this->available_quantity <= $this->min_quantity;
    }

    /**
     * Check if out of stock
     */
    public function isOutOfStock()
    {
        return $this->available_quantity <= 0;
    }

    /**
     * Check if needs reorder
     */
    public function needsReorder()
    {
        if (!$this->reorder_point) return false;
        return $this->available_quantity <= $this->reorder_point;
    }

    /**
     * Check if expired
     */
    public function isExpired()
    {
        if (!$this->expiry_date) return false;
        return $this->expiry_date->isPast();
    }

    /**
     * Check if expiring soon (30 days)
     */
    public function isExpiringSoon()
    {
        if (!$this->expiry_date) return false;
        return $this->expiry_date->diffInDays(now()) <= 30 && !$this->isExpired();
    }

    // Scopes

    /**
     * Low stock items
     */
    public function scopeLowStock($query)
    {
        return $query->whereColumn('available_quantity', '<=', 'min_quantity');
    }

    /**
     * Out of stock items
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('available_quantity', '<=', 0);
    }

    /**
     * In stock items
     */
    public function scopeInStock($query)
    {
        return $query->where('available_quantity', '>', 0);
    }

    /**
     * Needs reorder
     */
    public function scopeNeedsReorder($query)
    {
        return $query->whereNotNull('reorder_point')
            ->whereColumn('available_quantity', '<=', 'reorder_point');
    }

    /**
     * Expired items
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('expiry_date')
            ->where('expiry_date', '<', now());
    }

    /**
     * Expiring soon (30 days)
     */
    public function scopeExpiringSoon($query)
    {
        return $query->whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now(), now()->addDays(30)]);
    }

    /**
     * By warehouse
     */
    public function scopeInWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    /**
     * By user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Accessors

    /**
     * Stock status
     */
    public function getStockStatusAttribute()
    {
        if ($this->isOutOfStock()) return 'out_of_stock';
        if ($this->isLowStock()) return 'low_stock';
        if ($this->needsReorder()) return 'needs_reorder';
        return 'in_stock';
    }

    /**
     * Stock status name
     */
    public function getStockStatusNameAttribute()
    {
        return match($this->stock_status) {
            'out_of_stock' => 'Tugagan',
            'low_stock' => 'Kam',
            'needs_reorder' => 'Buyurtma berish kerak',
            'in_stock' => 'Mavjud',
            default => 'Noma\'lum',
        };
    }

    /**
     * Stock status color
     */
    public function getStockStatusColorAttribute()
    {
        return match($this->stock_status) {
            'out_of_stock' => 'red',
            'low_stock' => 'orange',
            'needs_reorder' => 'yellow',
            'in_stock' => 'green',
            default => 'gray',
        };
    }
}
