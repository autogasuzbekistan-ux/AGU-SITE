<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    // ==================== KONTRAGENT (SELLER) DASHBOARD ====================
    
    /**
     * Kontragent Dashboard
     * GET /api/kontragent/dashboard
     */
    public function getKontragentDashboard(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'kontragent') {
            return response()->json(['message' => 'Ruxsat berilmagan'], 403);
        }
        
        // Sotuvchining viloyatidagi buyurtmalar
        $totalOrders = Order::where('region', $user->region)->count();
        
        // Jami sotuv
        $totalSales = Order::where('region', $user->region)
            ->whereIn('status', ['delivered', 'processing', 'shipped'])
            ->sum('total_price');
        
        // Mahsulotlar soni
        $totalProducts = Product::count();
        
        // Oy statistikasi
        $thisMonthOrders = Order::where('region', $user->region)
            ->whereMonth('created_at', now()->month)
            ->count();
        
        $thisMonthSales = Order::where('region', $user->region)
            ->whereMonth('created_at', now()->month)
            ->whereIn('status', ['delivered', 'processing', 'shipped'])
            ->sum('total_price');
        
        return response()->json([
            'total_orders' => $totalOrders,
            'total_sales' => (float) $totalSales,
            'total_products' => $totalProducts,
            'this_month_orders' => $thisMonthOrders,
            'this_month_sales' => (float) $thisMonthSales,
            'user_info' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'region' => $user->region,
                'balance' => (float) ($user->balance ?? 0),
                'warehouse_info' => [
                    'address' => $user->warehouse_address ?? 'N/A',
                    'capacity' => (int) ($user->warehouse_capacity ?? 0),
                ]
            ]
        ]);
    }
    
    /**
     * Kontragent Sales (Buyurtmalar)
     * GET /api/kontragent/sales
     */
    public function getMySales(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'kontragent') {
            return response()->json(['message' => 'Ruxsat berilmagan'], 403);
        }
        
        // Viloyatdagi barcha buyurtmalar
        $orders = Order::with(['items.product'])
            ->where('region', $user->region)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json($orders);
    }

    /**
     * Kontragentlar ro'yxati (Transfer uchun)
     * GET /api/kontragent/kontragents
     */
    public function getKontragentsForTransfer(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'kontragent') {
            return response()->json(['message' => 'Ruxsat berilmagan'], 403);
        }

        // Faqat aktiv kontragentlarni qaytarish (o'zidan boshqa)
        $kontragents = User::where('role', 'kontragent')
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'email', 'phone', 'region')
            ->get()
            ->map(function($k) {
                return [
                    'id' => $k->id,
                    'name' => $k->name,
                    'email' => $k->email,
                    'phone' => $k->phone,
                    'region' => $k->region,
                ];
            });

        return response()->json(['kontragents' => $kontragents]);
    }

    /**
     * Sotuvchi mahsulot qo'shish
     * POST /api/kontragent/products
     */
    public function addProductToWarehouse(Request $request)
    {
        $user = $request->user();
        
        if ($user->role !== 'kontragent') {
            return response()->json(['message' => 'Ruxsat berilmagan'], 403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'imageUrl' => 'nullable|string',
            'stockStatus' => 'nullable|in:in_stock,out_of_stock,low_stock',
            'quantity' => 'required|integer|min:1',
        ]);
        
        $product = Product::create([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'category' => $validated['category'] ?? null,
            'description' => $validated['description'] ?? null,
            'imageUrl' => $validated['imageUrl'] ?? null,
            'stockStatus' => $validated['stockStatus'] ?? 'in_stock',
            'seller_id' => $user->id,
            'quantity' => $validated['quantity'],
        ]);
        
        return response()->json([
            'message' => 'Mahsulot muvaffaqiyatli qo\'shildi',
            'product' => $product
        ], 201);
    }
    
    // ==================== ADMIN - KONTRAGENTLARNI BOSHQARISH ====================
    
    /**
     * Barcha kontragentlar
     * GET /api/admin/kontragents
     */
    public function getKontragents(Request $request)
    {
        $user = $request->user();
        
        $query = User::where('role', 'kontragent');
        
        // Admin faqat o'z viloyatini ko'radi
        if ($user->role === 'admin') {
            $query->where('region', $user->region);
        }
        
        $kontragents = $query->get()->map(function($kontragent) {
            $totalOrders = Order::where('region', $kontragent->region)->count();
            $totalSales = Order::where('region', $kontragent->region)
                ->whereIn('status', ['delivered', 'processing', 'shipped'])
                ->sum('total_price');
            
            return [
                'id' => $kontragent->id,
                'name' => $kontragent->name,
                'email' => $kontragent->email,
                'phone' => $kontragent->phone,
                'region' => $kontragent->region,
                'is_active' => $kontragent->is_active,
                'balance' => (float) ($kontragent->balance ?? 0),
                'warehouse_address' => $kontragent->warehouse_address ?? 'N/A',
                'warehouse_capacity' => (int) ($kontragent->warehouse_capacity ?? 0),
                'total_orders' => $totalOrders,
                'total_sales' => (float) $totalSales,
                'products_count' => Product::where('seller_id', $kontragent->id)->count(),
                'created_at' => $kontragent->created_at->format('Y-m-d'),
            ];
        });
        
        return response()->json($kontragents);
    }
    
    /**
     * Yangi kontragent yaratish
     * POST /api/admin/kontragents
     */
    public function createKontragent(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'region' => 'required|string|max:255',
            'warehouse_address' => 'nullable|string|max:500',
            'warehouse_capacity' => 'nullable|integer|min:0',
        ]);
        
        $kontragent = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'kontragent',
            'region' => $validated['region'],
            'managed_by' => $request->user()->id,
            'warehouse_address' => $validated['warehouse_address'] ?? null,
            'warehouse_capacity' => $validated['warehouse_capacity'] ?? 0,
            'is_active' => true,
            'balance' => 0,
        ]);
        
        return response()->json([
            'message' => 'Kontragent yaratildi',
            'kontragent' => $kontragent
        ], 201);
    }
    
    /**
     * Kontragentni yangilash
     * PUT /api/admin/kontragents/{id}
     */
    public function updateKontragent(Request $request, $id)
    {
        $kontragent = User::where('role', 'kontragent')->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($id)],
            'phone' => 'sometimes|string|max:20',
            'region' => 'sometimes|string|max:255',
            'balance' => 'sometimes|numeric',
            'warehouse_address' => 'sometimes|string|max:500',
            'warehouse_capacity' => 'sometimes|integer|min:0',
        ]);
        
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }
        
        $kontragent->update($validated);
        
        return response()->json([
            'message' => 'Kontragent yangilandi',
            'kontragent' => $kontragent
        ]);
    }
    
    /**
     * Kontragent statusini o'zgartirish
     * PUT /api/admin/kontragents/{id}/toggle
     */
    public function toggleKontragentStatus($id)
    {
        $kontragent = User::where('role', 'kontragent')->findOrFail($id);
        $kontragent->is_active = !$kontragent->is_active;
        $kontragent->save();
        
        return response()->json([
            'message' => 'Status o\'zgartirildi',
            'is_active' => $kontragent->is_active
        ]);
    }
    
    /**
     * Kontragent sotuvlari
     * GET /api/admin/kontragents/{id}/sales
     */
    public function getKontragentSales($id)
    {
        $kontragent = User::where('role', 'kontragent')->findOrFail($id);
        
        $orders = Order::with(['items.product'])
            ->where('region', $kontragent->region)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $totalSales = $orders->whereIn('status', ['delivered', 'processing', 'shipped'])
            ->sum('total_price');
        
        return response()->json([
            'kontragent' => [
                'id' => $kontragent->id,
                'name' => $kontragent->name,
                'email' => $kontragent->email,
                'region' => $kontragent->region,
                'balance' => (float) ($kontragent->balance ?? 0),
            ],
            'total_sales' => (float) $totalSales,
            'total_orders' => $orders->count(),
            'orders' => $orders
        ]);
    }
    
    // ==================== ADMIN DASHBOARD ====================
    
    /**
     * Admin Dashboard
     * GET /api/admin/dashboard
     */
    public function getDashboardStats(Request $request)
    {
        $user = $request->user();
        
        if ($user->role === 'owner') {
            return response()->json([
                'total_admins' => User::where('role', 'admin')->count(),
                'active_admins' => User::where('role', 'admin')->where('is_active', true)->count(),
                'total_kontragents' => User::where('role', 'kontragent')->count(),
                'active_kontragents' => User::where('role', 'kontragent')->where('is_active', true)->count(),
                'total_customers' => User::where('role', 'customer')->count(),
                'total_orders' => Order::count(),
                'total_sales' => (float) Order::whereIn('status', ['delivered', 'processing', 'shipped'])->sum('total_price'),
                'total_products' => Product::count(),
                'pending_orders' => Order::where('status', 'new')->count(),
            ]);
        }
        
        if ($user->role === 'admin') {
            return response()->json([
                'total_kontragents' => User::where('role', 'kontragent')->where('region', $user->region)->count(),
                'active_kontragents' => User::where('role', 'kontragent')->where('region', $user->region)->where('is_active', true)->count(),
                'total_orders' => Order::where('region', $user->region)->count(),
                'total_sales' => (float) Order::where('region', $user->region)->whereIn('status', ['delivered', 'processing', 'shipped'])->sum('total_price'),
                'total_products' => Product::whereHas('seller', function($q) use ($user) {
                    $q->where('region', $user->region);
                })->count(),
                'pending_orders' => Order::where('region', $user->region)->where('status', 'new')->count(),
            ]);
        }
        
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    // ==================== OWNER - ADMINLARNI BOSHQARISH ====================
    
    /**
     * Barcha adminlar
     * GET /api/owner/admins
     */
    public function getAdmins()
    {
        $admins = User::where('role', 'admin')->get()->map(function($admin) {
            return [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'region' => $admin->region,
                'is_active' => $admin->is_active,
                'total_kontragents' => User::where('role', 'kontragent')->where('region', $admin->region)->count(),
                'total_sales' => (float) Order::where('region', $admin->region)->whereIn('status', ['delivered', 'processing', 'shipped'])->sum('total_price'),
                'created_at' => $admin->created_at->format('Y-m-d'),
            ];
        });
        
        return response()->json($admins);
    }
    
    /**
     * Yangi admin yaratish
     * POST /api/owner/admins
     */
    public function createAdmin(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'region' => 'required|string|max:255',
        ]);
        
        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'region' => $validated['region'],
            'is_active' => true,
        ]);
        
        return response()->json([
            'message' => 'Admin yaratildi',
            'admin' => $admin
        ], 201);
    }
    
    /**
     * Adminni yangilash
     * PUT /api/owner/admins/{id}
     */
    public function updateAdmin(Request $request, $id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($id)],
            'phone' => 'sometimes|string|max:20',
            'region' => 'sometimes|string|max:255',
            'password' => 'sometimes|string|min:6',
        ]);
        
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }
        
        $admin->update($validated);
        
        return response()->json([
            'message' => 'Admin yangilandi',
            'admin' => $admin
        ]);
    }
    
    /**
     * Admin statusini o'zgartirish
     * PUT /api/owner/admins/{id}/toggle
     */
    public function toggleAdminStatus($id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);
        $admin->is_active = !$admin->is_active;
        $admin->save();
        
        return response()->json([
            'message' => 'Status o\'zgartirildi',
            'is_active' => $admin->is_active
        ]);
    }
    
    /**
     * Adminni o'chirish
     * DELETE /api/owner/admins/{id}
     */
    public function deleteAdmin($id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);
        $admin->delete();
        
        return response()->json(['message' => 'Admin o\'chirildi']);
    }
    
    // ==================== PRODUCTS (ADMIN/OWNER) ====================
    
    /**
     * Mahsulot yaratish
     * POST /api/admin/products
     */
    public function createProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'imageUrl' => 'nullable|string',
            'stockStatus' => 'nullable|in:in_stock,out_of_stock,low_stock',
            'quantity' => 'nullable|integer|min:0',
        ]);
        
        $product = Product::create($validated);
        
        return response()->json([
            'message' => 'Mahsulot yaratildi',
            'product' => $product
        ], 201);
    }
    
    /**
     * Activity Logs (placeholder)
     * GET /api/owner/activities
     */
    public function getActivityLogs()
    {
        return response()->json([
            'message' => 'Activity logs keyinroq qo\'shiladi',
            'logs' => []
        ]);
    }
}