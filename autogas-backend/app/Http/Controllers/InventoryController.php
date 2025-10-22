<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * Get all inventory (role-based)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Inventory::with(['warehouse', 'product', 'user']);

        // Role-based filtering
        if ($user->role === 'kontragent') {
            $query->where('user_id', $user->id);
        }

        // Filters
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('stock_status')) {
            $status = $request->stock_status;
            if ($status === 'low_stock') {
                $query->lowStock();
            } elseif ($status === 'out_of_stock') {
                $query->outOfStock();
            } elseif ($status === 'in_stock') {
                $query->inStock();
            } elseif ($status === 'needs_reorder') {
                $query->needsReorder();
            }
        }

        if ($request->boolean('expired_only')) {
            $query->expired();
        }

        if ($request->boolean('expiring_soon')) {
            $query->expiringSoon();
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $inventory = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'inventory' => $inventory,
        ]);
    }

    /**
     * Get single inventory item
     */
    public function show(Request $request, Inventory $inventory)
    {
        $user = $request->user();

        // Kontragent can only view their own inventory
        if ($user->role === 'kontragent' && $inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'inventory' => $inventory->load(['warehouse', 'product', 'user', 'stockMovements']),
        ]);
    }

    /**
     * Add or update inventory item
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'nullable|string',
            'min_quantity' => 'nullable|numeric|min:0',
            'max_quantity' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'location' => 'nullable|string',
            'batch_number' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'cost_per_unit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Check warehouse ownership
        $warehouse = Warehouse::find($validated['warehouse_id']);
        if ($user->role === 'kontragent' && $warehouse->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bu ombor sizga tegishli emas',
            ], 403);
        }

        try {
            DB::beginTransaction();

            // Check if inventory already exists
            $inventory = Inventory::where('warehouse_id', $validated['warehouse_id'])
                ->where('product_id', $validated['product_id'])
                ->where('batch_number', $validated['batch_number'] ?? null)
                ->first();

            if ($inventory) {
                // Update existing
                $inventory->addStock(
                    $validated['quantity'],
                    'in',
                    $user->id,
                    $validated['notes'] ?? 'Stock qo\'shildi'
                );
            } else {
                // Create new
                $inventory = Inventory::create([
                    'warehouse_id' => $validated['warehouse_id'],
                    'product_id' => $validated['product_id'],
                    'user_id' => $warehouse->user_id,
                    'quantity' => $validated['quantity'],
                    'available_quantity' => $validated['quantity'],
                    'unit' => $validated['unit'] ?? 'dona',
                    'min_quantity' => $validated['min_quantity'] ?? 10,
                    'max_quantity' => $validated['max_quantity'] ?? null,
                    'reorder_point' => $validated['reorder_point'] ?? null,
                    'location' => $validated['location'] ?? null,
                    'batch_number' => $validated['batch_number'] ?? null,
                    'expiry_date' => $validated['expiry_date'] ?? null,
                    'cost_per_unit' => $validated['cost_per_unit'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);

                $inventory->updateTotalValue();
                $inventory->save();

                // Record initial stock movement
                StockMovement::create([
                    'inventory_id' => $inventory->id,
                    'warehouse_id' => $inventory->warehouse_id,
                    'product_id' => $inventory->product_id,
                    'user_id' => $user->id,
                    'type' => 'in',
                    'quantity' => $validated['quantity'],
                    'quantity_before' => 0,
                    'quantity_after' => $validated['quantity'],
                    'reference_number' => StockMovement::generateReferenceNumber(),
                    'notes' => 'Boshlang\'ich stock',
                    'cost_per_unit' => $validated['cost_per_unit'] ?? null,
                    'total_value' => ($validated['quantity'] * ($validated['cost_per_unit'] ?? 0)),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Inventory muvaffaqiyatli qo\'shildi',
                'inventory' => $inventory->fresh()->load(['warehouse', 'product']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Xatolik yuz berdi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update inventory item details (not quantity)
     */
    public function update(Request $request, Inventory $inventory)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $validated = $request->validate([
            'min_quantity' => 'nullable|numeric|min:0',
            'max_quantity' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'location' => 'nullable|string',
            'cost_per_unit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $inventory->update($validated);
        $inventory->updateTotalValue();
        $inventory->save();

        return response()->json([
            'success' => true,
            'message' => 'Inventory yangilandi',
            'inventory' => $inventory->fresh(),
        ]);
    }

    /**
     * Add stock to inventory
     */
    public function addStock(Request $request, Inventory $inventory)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        try {
            $inventory->addStock(
                $validated['quantity'],
                'in',
                $user->id,
                $validated['notes'] ?? 'Stock qo\'shildi'
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock muvaffaqiyatli qo\'shildi',
                'inventory' => $inventory->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Xatolik: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove stock from inventory
     */
    public function removeStock(Request $request, Inventory $inventory)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'type' => 'nullable|in:out,damaged,expired,sample',
            'notes' => 'nullable|string',
        ]);

        try {
            $inventory->removeStock(
                $validated['quantity'],
                $validated['type'] ?? 'out',
                $user->id,
                $validated['notes'] ?? 'Stock chiqarildi'
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock muvaffaqiyatli chiqarildi',
                'inventory' => $inventory->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Xatolik: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Adjust stock (inventarizatsiya)
     */
    public function adjustStock(Request $request, Inventory $inventory)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $validated = $request->validate([
            'new_quantity' => 'required|numeric|min:0',
            'reason' => 'required|string|min:5',
        ]);

        try {
            $inventory->adjustStock(
                $validated['new_quantity'],
                $user->id,
                $validated['reason']
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock tuzatildi',
                'inventory' => $inventory->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Xatolik: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get stock movements for inventory
     */
    public function getStockMovements(Request $request, Inventory $inventory)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $movements = $inventory->stockMovements()
            ->with(['user', 'transfer', 'order'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'movements' => $movements,
        ]);
    }

    /**
     * Get low stock items
     */
    public function getLowStock(Request $request)
    {
        $user = $request->user();
        $query = Inventory::with(['warehouse', 'product'])->lowStock();

        if ($user->role === 'kontragent') {
            $query->where('user_id', $user->id);
        }

        $lowStock = $query->get();

        return response()->json([
            'success' => true,
            'low_stock_items' => $lowStock,
            'count' => $lowStock->count(),
        ]);
    }

    /**
     * Get out of stock items
     */
    public function getOutOfStock(Request $request)
    {
        $user = $request->user();
        $query = Inventory::with(['warehouse', 'product'])->outOfStock();

        if ($user->role === 'kontragent') {
            $query->where('user_id', $user->id);
        }

        $outOfStock = $query->get();

        return response()->json([
            'success' => true,
            'out_of_stock_items' => $outOfStock,
            'count' => $outOfStock->count(),
        ]);
    }

    /**
     * Delete inventory item
     */
    public function destroy(Request $request, Inventory $inventory)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $inventory->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        // Can only delete if quantity is 0
        if ($inventory->quantity > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Faqat bo\'sh inventoryni o\'chirish mumkin',
            ], 400);
        }

        $inventory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Inventory o\'chirildi',
        ]);
    }

    /**
     * Inventory statistics
     */
    public function statistics(Request $request)
    {
        $user = $request->user();
        $query = Inventory::query();

        if ($user->role === 'kontragent') {
            $query->where('user_id', $user->id);
        }

        $stats = [
            'total_items' => $query->count(),
            'total_products' => $query->distinct('product_id')->count('product_id'),
            'total_value' => $query->sum('total_value'),
            'in_stock' => (clone $query)->inStock()->count(),
            'low_stock' => (clone $query)->lowStock()->count(),
            'out_of_stock' => (clone $query)->outOfStock()->count(),
            'needs_reorder' => (clone $query)->needsReorder()->count(),
            'expired' => (clone $query)->expired()->count(),
            'expiring_soon' => (clone $query)->expiringSoon()->count(),
            'total_quantity' => $query->sum('quantity'),
            'available_quantity' => $query->sum('available_quantity'),
            'reserved_quantity' => $query->sum('reserved_quantity'),
        ];

        return response()->json([
            'success' => true,
            'statistics' => $stats,
        ]);
    }
}
