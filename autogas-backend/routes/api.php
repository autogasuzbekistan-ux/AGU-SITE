<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ShipmentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InventoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- Ochiq yo'llar (autentifikatsiyasiz) ---
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is running',
        'timestamp' => now()->toDateTimeString()
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Mahsulotlar uchun ochiq yo'llar
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/products/{product}/reviews', [ReviewController::class, 'index']);

// --- Himoyalangan yo'llar (autentifikatsiya talab qilinadi) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Foydalanuvchi profili
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    
    // Foydalanuvchi buyurtmalari
    Route::get('/user/orders', [OrderController::class, 'listForUser']);

    // Savatcha (Cart)
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{product}', [CartController::class, 'update']);
    Route::delete('/cart/{product}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);

    // Wishlist (Sevimlilar)
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy']);
    Route::delete('/wishlist', [WishlistController::class, 'clear']);

    // Buyurtmalar
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

    // Sharhlar
    Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);

    // --- OWNER yo'llari (faqat owner roli uchun) ---
    Route::middleware('role:owner')->prefix('owner')->group(function () {
        // Adminlarni boshqarish
        Route::get('/admins', [AdminController::class, 'getAdmins']);
        Route::post('/admins', [AdminController::class, 'createAdmin']);
        Route::put('/admins/{id}', [AdminController::class, 'updateAdmin']);
        Route::put('/admins/{id}/toggle', [AdminController::class, 'toggleAdminStatus']);
        Route::delete('/admins/{id}', [AdminController::class, 'deleteAdmin']);
        
        // Kontragentlarni ko'rish
        Route::get('/kontragents', [AdminController::class, 'getKontragents']);
        Route::get('/kontragents/{id}/sales', [AdminController::class, 'getKontragentSales']);
        
        // Dashboard statistikasi
        Route::get('/dashboard', [AdminController::class, 'getDashboardStats']);
        
        // Activity logs
        Route::get('/activities', [AdminController::class, 'getActivityLogs']);
    });

    // --- ADMIN yo'llari (owner va admin rollari uchun) ---
    Route::middleware('role:owner,admin')->prefix('admin')->group(function () {
        // Kontragentlarni boshqarish
        Route::get('/kontragents', [AdminController::class, 'getKontragents']);
        Route::post('/kontragents', [AdminController::class, 'createKontragent']);
        Route::put('/kontragents/{id}', [AdminController::class, 'updateKontragent']);
        Route::put('/kontragents/{id}/toggle', [AdminController::class, 'toggleKontragentStatus']);
        Route::get('/kontragents/{id}/sales', [AdminController::class, 'getKontragentSales']);
        
        // Dashboard
        Route::get('/dashboard', [AdminController::class, 'getDashboardStats']);
        
        // Mahsulotlarni boshqarish
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        
        // Buyurtmalarni boshqarish
        Route::get('/orders', [OrderController::class, 'index']);
        Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });

    // --- KONTRAGENT yo'llari (SOTUVCHILAR) ---
    Route::middleware('role:kontragent')->prefix('kontragent')->group(function () {
        // Dashboard va statistika
        Route::get('/dashboard', [AdminController::class, 'getKontragentDashboard']);

        // Buyurtmalar (sotuvlar)
        Route::get('/sales', [AdminController::class, 'getMySales']);

        // Mahsulotlar CRUD
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);

        // Buyurtmalar
        Route::get('/orders', [OrderController::class, 'index']);
    });

    // --- TRANSFER yo'llari (Yuk almashinuvi) ---

    // Barcha foydalanuvchilar uchun (tracking)
    Route::get('/transfers/track', [TransferController::class, 'trackByNumber']);

    // Kontragentlar uchun
    Route::middleware('role:kontragent')->group(function () {
        Route::get('/transfers/my', [TransferController::class, 'myTransfers']);
        Route::post('/transfers', [TransferController::class, 'store']);
        Route::post('/transfers/{transfer}/approve', [TransferController::class, 'approve']);
        Route::post('/transfers/{transfer}/reject', [TransferController::class, 'reject']);
        Route::post('/transfers/{transfer}/ship', [TransferController::class, 'ship']);
        Route::post('/transfers/{transfer}/deliver', [TransferController::class, 'deliver']);
        Route::post('/transfers/{transfer}/cancel', [TransferController::class, 'cancel']);
    });

    // Admin va Owner uchun
    Route::middleware('role:admin,owner')->prefix('admin')->group(function () {
        Route::get('/transfers', [TransferController::class, 'index']);
        Route::get('/transfers/statistics', [TransferController::class, 'statistics']);
        Route::get('/transfers/{transfer}', [TransferController::class, 'show']);
        Route::post('/transfers/{transfer}/ship', [TransferController::class, 'ship']);
        Route::post('/transfers/{transfer}/deliver', [TransferController::class, 'deliver']);
    });

    // --- TRANSACTION yo'llari (Pul tranzaksiyalari) ---

    // Kontragentlar uchun
    Route::middleware('role:kontragent')->group(function () {
        Route::get('/transactions/my', [TransactionController::class, 'myTransactions']);
        Route::post('/transactions/transfer', [TransactionController::class, 'transfer']);
        Route::get('/transactions/balance', [TransactionController::class, 'balance']);
        Route::get('/transactions/debts', [TransactionController::class, 'debts']);
    });

    // Admin va Owner uchun
    Route::middleware('role:admin,owner')->prefix('admin')->group(function () {
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::get('/transactions/statistics', [TransactionController::class, 'statistics']);
        Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
        Route::post('/transactions/adjust-balance', [TransactionController::class, 'adjustBalance']);
    });

    // --- SHIPMENT yo'llari (Yuk jo'natish tracking) ---

    // Public tracking (authentication yo'q)
    Route::get('/shipments/track', [ShipmentController::class, 'trackByCode']);

    // Kontragentlar uchun
    Route::middleware('role:kontragent')->group(function () {
        Route::get('/shipments', [ShipmentController::class, 'index']);
        Route::post('/shipments', [ShipmentController::class, 'store']);
        Route::get('/shipments/{shipment}', [ShipmentController::class, 'show']);
        Route::post('/shipments/{shipment}/update-status', [ShipmentController::class, 'updateStatus']);
        Route::post('/shipments/{shipment}/update-location', [ShipmentController::class, 'updateLocation']);
        Route::post('/shipments/{shipment}/add-note', [ShipmentController::class, 'addNote']);
        Route::post('/shipments/{shipment}/report-issue', [ShipmentController::class, 'reportIssue']);
    });

    // Admin va Owner uchun
    Route::middleware('role:admin,owner')->prefix('admin')->group(function () {
        Route::get('/shipments', [ShipmentController::class, 'index']);
        Route::get('/shipments/statistics', [ShipmentController::class, 'statistics']);
        Route::get('/shipments/{shipment}', [ShipmentController::class, 'show']);
        Route::post('/shipments/{shipment}/update-status', [ShipmentController::class, 'updateStatus']);
        Route::post('/shipments/{shipment}/update-location', [ShipmentController::class, 'updateLocation']);
    });

    // --- NOTIFICATION yo'llari (Bildirishnomalar) ---

    // Barcha autentifikatsiyalangan foydalanuvchilar uchun
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications/recent', [NotificationController::class, 'recent']);
    Route::get('/notifications/statistics', [NotificationController::class, 'statistics']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/delete-read', [NotificationController::class, 'deleteRead']);
    Route::delete('/notifications/delete-all', [NotificationController::class, 'deleteAll']);

    // Test notification (development)
    Route::post('/notifications/test', [NotificationController::class, 'sendTestNotification']);

    // Individual notification operations
    Route::get('/notifications/{notification}', [NotificationController::class, 'show']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/{notification}/unread', [NotificationController::class, 'markAsUnread']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // --- WAREHOUSE yo'llari (Omborlar) ---

    // Kontragentlar uchun
    Route::middleware('role:kontragent')->group(function () {
        Route::get('/warehouses', [WarehouseController::class, 'index']);
        Route::post('/warehouses', [WarehouseController::class, 'store']);
        Route::get('/warehouses/{warehouse}', [WarehouseController::class, 'show']);
        Route::put('/warehouses/{warehouse}', [WarehouseController::class, 'update']);
        Route::post('/warehouses/{warehouse}/toggle-status', [WarehouseController::class, 'toggleStatus']);
        Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy']);
        Route::get('/warehouses/{warehouse}/statistics', [WarehouseController::class, 'statistics']);
    });

    // Admin va Owner uchun
    Route::middleware('role:admin,owner')->prefix('admin')->group(function () {
        Route::get('/warehouses', [WarehouseController::class, 'index']);
        Route::get('/warehouses/{warehouse}', [WarehouseController::class, 'show']);
        Route::get('/warehouses/{warehouse}/statistics', [WarehouseController::class, 'statistics']);
    });

    // --- INVENTORY yo'llari (Inventarizatsiya) ---

    // Kontragentlar uchun
    Route::middleware('role:kontragent')->group(function () {
        Route::get('/inventory', [InventoryController::class, 'index']);
        Route::post('/inventory', [InventoryController::class, 'store']);
        Route::get('/inventory/{inventory}', [InventoryController::class, 'show']);
        Route::put('/inventory/{inventory}', [InventoryController::class, 'update']);
        Route::delete('/inventory/{inventory}', [InventoryController::class, 'destroy']);

        // Stock management
        Route::post('/inventory/{inventory}/add-stock', [InventoryController::class, 'addStock']);
        Route::post('/inventory/{inventory}/remove-stock', [InventoryController::class, 'removeStock']);
        Route::post('/inventory/{inventory}/adjust-stock', [InventoryController::class, 'adjustStock']);
        Route::get('/inventory/{inventory}/movements', [InventoryController::class, 'getStockMovements']);

        // Reports
        Route::get('/inventory/low-stock/list', [InventoryController::class, 'getLowStock']);
        Route::get('/inventory/out-of-stock/list', [InventoryController::class, 'getOutOfStock']);
        Route::get('/inventory/statistics/summary', [InventoryController::class, 'statistics']);
    });

    // Admin va Owner uchun
    Route::middleware('role:admin,owner')->prefix('admin')->group(function () {
        Route::get('/inventory', [InventoryController::class, 'index']);
        Route::get('/inventory/{inventory}', [InventoryController::class, 'show']);
        Route::get('/inventory/{inventory}/movements', [InventoryController::class, 'getStockMovements']);
        Route::get('/inventory/low-stock/list', [InventoryController::class, 'getLowStock']);
        Route::get('/inventory/out-of-stock/list', [InventoryController::class, 'getOutOfStock']);
        Route::get('/inventory/statistics/summary', [InventoryController::class, 'statistics']);
    });
});