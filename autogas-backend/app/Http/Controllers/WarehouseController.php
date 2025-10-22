<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    /**
     * Get all warehouses (role-based)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Warehouse::with(['user', 'inventory']);

        // Role-based filtering
        if ($user->role === 'kontragent') {
            $query->where('user_id', $user->id);
        }

        // Filters
        if ($request->has('region')) {
            $query->where('region', $request->region);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $warehouses = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'warehouses' => $warehouses,
        ]);
    }

    /**
     * Get single warehouse
     */
    public function show(Request $request, Warehouse $warehouse)
    {
        $user = $request->user();

        // Kontragent can only view their own warehouse
        if ($user->role === 'kontragent' && $warehouse->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'warehouse' => $warehouse->load(['user', 'inventory.product']),
        ]);
    }

    /**
     * Create new warehouse
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'region' => 'required|string',
            'district' => 'nullable|string',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'phone' => 'nullable|string',
            'manager_name' => 'nullable|string',
            'total_capacity' => 'nullable|numeric|min:0',
            'capacity_unit' => 'nullable|string',
        ]);

        try {
            $warehouse = Warehouse::create([
                'user_id' => $user->role === 'kontragent' ? $user->id : $validated['user_id'] ?? $user->id,
                'name' => $validated['name'],
                'code' => Warehouse::generateCode(),
                'description' => $validated['description'] ?? null,
                'region' => $validated['region'],
                'district' => $validated['district'] ?? null,
                'address' => $validated['address'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'manager_name' => $validated['manager_name'] ?? null,
                'total_capacity' => $validated['total_capacity'] ?? null,
                'capacity_unit' => $validated['capacity_unit'] ?? 'm³',
                'is_active' => true,
                'status' => 'active',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ombor muvaffaqiyatli yaratildi',
                'warehouse' => $warehouse->load('user'),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Xatolik yuz berdi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update warehouse
     */
    public function update(Request $request, Warehouse $warehouse)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $warehouse->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'region' => 'nullable|string',
            'district' => 'nullable|string',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'phone' => 'nullable|string',
            'manager_name' => 'nullable|string',
            'total_capacity' => 'nullable|numeric|min:0',
            'capacity_unit' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,maintenance,full',
        ]);

        $warehouse->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Ombor yangilandi',
            'warehouse' => $warehouse->fresh(),
        ]);
    }

    /**
     * Activate/Deactivate warehouse
     */
    public function toggleStatus(Request $request, Warehouse $warehouse)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $warehouse->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        if ($warehouse->is_active) {
            $warehouse->deactivate();
            $message = 'Ombor faolsizlantirildi';
        } else {
            $warehouse->activate();
            $message = 'Ombor faollashtirildi';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'warehouse' => $warehouse->fresh(),
        ]);
    }

    /**
     * Delete warehouse
     */
    public function destroy(Request $request, Warehouse $warehouse)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $warehouse->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        // Can only delete if no inventory
        if ($warehouse->inventory()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory bo\'lgan omborni o\'chirib bo\'lmaydi',
            ], 400);
        }

        $warehouse->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ombor o\'chirildi',
        ]);
    }

    /**
     * Get warehouse statistics
     */
    public function statistics(Request $request, Warehouse $warehouse)
    {
        $user = $request->user();

        // Check ownership
        if ($user->role === 'kontragent' && $warehouse->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $stats = [
            'total_products' => $warehouse->getTotalProductsCount(),
            'total_value' => $warehouse->getTotalInventoryValue(),
            'total_capacity' => $warehouse->total_capacity,
            'used_capacity' => $warehouse->used_capacity,
            'available_capacity' => $warehouse->available_capacity,
            'capacity_usage_percentage' => $warehouse->capacity_usage_percentage,
            'low_stock_items' => $warehouse->getLowStockItems()->count(),
            'total_stock_quantity' => $warehouse->inventory()->sum('quantity'),
            'available_quantity' => $warehouse->inventory()->sum('available_quantity'),
            'reserved_quantity' => $warehouse->inventory()->sum('reserved_quantity'),
        ];

        return response()->json([
            'success' => true,
            'statistics' => $stats,
        ]);
    }
}
