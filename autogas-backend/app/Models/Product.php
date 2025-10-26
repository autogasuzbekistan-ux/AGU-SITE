<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * Ma'lumotlar bazasi jadvali nomi
     */
    protected $table = 'products';

    /**
     * Primary key ustuni
     */
    protected $primaryKey = 'id';

    /**
     * Primary key auto-increment
     */
    public $incrementing = true;

    /**
     * Primary key turi
     */
    protected $keyType = 'int';

    /**
     * Timestamps (created_at, updated_at)
     */
    public $timestamps = true;

    /**
     * Mass assignment uchun ruxsat berilgan ustunlar
     */
    protected $fillable = [
        'name',
        'price',
        'category',
        'description',
        'imageUrl',
        'stockStatus',
        'seller_id',
        'quantity',
        'status',
        'is_active',
    ];

    /**
     * Casting - ustunlar uchun ma'lumot turlarini belgilash
     */
    protected $casts = [
        'id' => 'integer',
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'seller_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Default qiymatlar
     */
    protected $attributes = [
        'stockStatus' => 'in_stock',
        'quantity' => 0,
        'status' => 'approved',
        'is_active' => true,
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Seller who added this product
     */
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * Cart Items bilan bog'lanish
     */
    public function cartItems()
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Wishlist items
     */
    public function wishlistItems()
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * Order items
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Reviews
     */
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    // ==================== SCOPES ====================

    /**
     * Faqat stokda mavjud mahsulotlarni olish
     */
    public function scopeInStock($query)
    {
        return $query->where('stockStatus', 'in_stock');
    }

    /**
     * Stokda yo'q mahsulotlarni olish
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('stockStatus', 'out_of_stock');
    }

    /**
     * Kategoriya bo'yicha filter
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Seller bo'yicha filter
     */
    public function scopeBySeller($query, $sellerId)
    {
        return $query->where('seller_id', $sellerId);
    }

    /**
     * Active products (in stock or low stock)
     */
    public function scopeAvailable($query)
    {
        return $query->whereIn('stockStatus', ['in_stock', 'low_stock']);
    }

    /**
     * Faqat tasdiqlangan mahsulotlar
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Faqat faol mahsulotlar
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Ommaviy ko'rinish uchun mahsulotlar (approved va active)
     */
    public function scopePublic($query)
    {
        return $query->where('status', 'approved')->where('is_active', true);
    }

    // ==================== ACCESSORS & MUTATORS ====================

    /**
     * Narxni formatlangan ko'rinishda olish
     */
    public function getFormattedPriceAttribute()
    {
        return '$' . number_format($this->price, 2);
    }

    /**
     * Stock status textini olish
     */
    public function getStockStatusTextAttribute()
    {
        return match($this->stockStatus) {
            'in_stock' => 'Stokda mavjud',
            'out_of_stock' => 'Stokda yo\'q',
            'low_stock' => 'Kam qoldi',
            default => 'Noma\'lum',
        };
    }

    /**
     * Get stock status color for UI
     */
    public function getStockStatusColorAttribute()
    {
        return match($this->stockStatus) {
            'in_stock' => 'green',
            'out_of_stock' => 'red',
            'low_stock' => 'orange',
            default => 'gray',
        };
    }

    // ==================== HELPER METHODS ====================

    /**
     * Mahsulot stokda mavjudmi?
     */
    public function isAvailable(): bool
    {
        return $this->stockStatus === 'in_stock' || $this->stockStatus === 'low_stock';
    }

    /**
     * Mahsulot stokda yo'qmi?
     */
    public function isOutOfStock(): bool
    {
        return $this->stockStatus === 'out_of_stock';
    }

    /**
     * Check if product has enough quantity
     */
    public function hasStock(int $quantity = 1): bool
    {
        return $this->quantity >= $quantity && $this->isAvailable();
    }

    /**
     * Decrease quantity (when order is placed)
     */
    public function decreaseQuantity(int $quantity = 1): bool
    {
        if ($this->quantity >= $quantity) {
            $this->quantity -= $quantity;
            
            // Update stock status based on quantity
            if ($this->quantity == 0) {
                $this->stockStatus = 'out_of_stock';
            } elseif ($this->quantity <= 10) {
                $this->stockStatus = 'low_stock';
            }
            
            return $this->save();
        }
        
        return false;
    }

    /**
     * Increase quantity (when restocking)
     */
    public function increaseQuantity(int $quantity = 1): bool
    {
        $this->quantity += $quantity;
        
        // Update stock status
        if ($this->quantity > 10) {
            $this->stockStatus = 'in_stock';
        } elseif ($this->quantity > 0) {
            $this->stockStatus = 'low_stock';
        }
        
        return $this->save();
    }

    /**
     * Get average rating
     */
    public function getAverageRating()
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    /**
     * Get reviews count
     */
    public function getReviewsCount()
    {
        return $this->reviews()->count();
    }
}