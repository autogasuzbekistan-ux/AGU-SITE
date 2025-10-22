<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\Product;
use App\Models\User;
use App\Models\Notification;
use App\Models\Inventory;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransferController extends Controller
{
    /**
     * Barcha transferlarni ko'rish (role-based)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Transfer::with(['sender', 'receiver', 'product']);

        // Role-based filtering
        if ($user->role === 'kontragent') {
            // Kontragent faqat o'z transferlarini ko'radi
            $query->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            });
        }
        // Admin va Owner barcha transferlarni ko'radi

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_region')) {
            $query->where('from_region', $request->from_region);
        }

        if ($request->has('to_region')) {
            $query->where('to_region', $request->to_region);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $transfers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'transfers' => $transfers,
        ]);
    }

    /**
     * Yangi transfer yaratish (faqat kontragent)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Faqat kontragent transfer yarata oladi
        if ($user->role !== 'kontragent') {
            return response()->json([
                'success' => false,
                'message' => 'Faqat kontragentlar transfer yarata oladi',
            ], 403);
        }

        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'to_region' => 'required|string',
            'notes' => 'nullable|string',
            'unit_price' => 'nullable|numeric|min:0',
        ]);

        // Qabul qiluvchi kontragent bo'lishi kerak
        $receiver = User::find($validated['receiver_id']);
        if ($receiver->role !== 'kontragent') {
            return response()->json([
                'success' => false,
                'message' => 'Qabul qiluvchi kontragent bo\'lishi kerak',
            ], 400);
        }

        // O'ziga o'zi yubora olmaydi
        if ($receiver->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'O\'zingizga transfer qila olmaysiz',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $transfer = Transfer::create([
                'sender_id' => $user->id,
                'receiver_id' => $validated['receiver_id'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'from_region' => $user->region ?? 'Noma\'lum',
                'to_region' => $validated['to_region'],
                'notes' => $validated['notes'] ?? null,
                'unit_price' => $validated['unit_price'] ?? null,
                'tracking_number' => Transfer::generateTrackingNumber(),
                'requested_at' => now(),
            ]);

            // Agar narx ko'rsatilgan bo'lsa, umumiy summani hisoblash
            if (isset($validated['unit_price'])) {
                $transfer->calculateTotalAmount();
            }

            // Notification - qabul qiluvchiga yangi transfer so'rovi haqida xabar
            Notification::newTransferRequest($transfer->load(['sender', 'receiver']), $validated['receiver_id']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer muvaffaqiyatli yaratildi',
                'transfer' => $transfer->load(['sender', 'receiver', 'product']),
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
     * Bitta transferni ko'rish
     */
    public function show(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Kontragent faqat o'z transferini ko'ra oladi
        if ($user->role === 'kontragent') {
            if ($transfer->sender_id !== $user->id && $transfer->receiver_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruxsat yo\'q',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'transfer' => $transfer->load(['sender', 'receiver', 'product']),
        ]);
    }

    /**
     * Transferni tasdiqlash (faqat qabul qiluvchi)
     */
    public function approve(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Faqat qabul qiluvchi tasdiqlashi mumkin
        if ($transfer->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Faqat qabul qiluvchi tasdiqlashi mumkin',
            ], 403);
        }

        // Faqat pending holatda tasdiqlash mumkin
        if ($transfer->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Bu transfer allaqachon qayta ishlangan',
            ], 400);
        }

        $transfer->approve();

        // Notification - yuboruvchiga transfer tasdiqlangani haqida xabar
        Notification::transferApproved($transfer, $transfer->sender_id);

        return response()->json([
            'success' => true,
            'message' => 'Transfer tasdiqlandi',
            'transfer' => $transfer->fresh()->load(['sender', 'receiver', 'product']),
        ]);
    }

    /**
     * Transferni rad etish (faqat qabul qiluvchi)
     */
    public function reject(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Faqat qabul qiluvchi rad etishi mumkin
        if ($transfer->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Faqat qabul qiluvchi rad etishi mumkin',
            ], 403);
        }

        // Faqat pending holatda rad etish mumkin
        if ($transfer->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Bu transfer allaqachon qayta ishlangan',
            ], 400);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:5',
        ]);

        $transfer->reject($validated['rejection_reason']);

        // Notification - yuboruvchiga transfer rad etilgani haqida xabar
        Notification::transferRejected($transfer, $transfer->sender_id, $validated['rejection_reason']);

        return response()->json([
            'success' => true,
            'message' => 'Transfer rad etildi',
            'transfer' => $transfer->fresh()->load(['sender', 'receiver', 'product']),
        ]);
    }

    /**
     * Yo'lga chiqarish (Admin/Owner yoki yuboruvchi)
     */
    public function ship(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Faqat admin, owner yoki yuboruvchi yo'lga chiqarishi mumkin
        if (!in_array($user->role, ['admin', 'owner']) && $transfer->sender_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        // Faqat approved holatda yo'lga chiqarish mumkin
        if ($transfer->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Transfer avval tasdiqlanishi kerak',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $transfer->ship();

            // Automatic stock adjustment - yuboruvchi omboridan mahsulot chiqarish
            $senderWarehouse = Warehouse::where('user_id', $transfer->sender_id)
                ->where('region', $transfer->from_region)
                ->active()
                ->first();

            if ($senderWarehouse) {
                $inventory = Inventory::where('warehouse_id', $senderWarehouse->id)
                    ->where('product_id', $transfer->product_id)
                    ->first();

                if ($inventory && $inventory->available_quantity >= $transfer->quantity) {
                    $inventory->removeStock(
                        $transfer->quantity,
                        'transfer_out',
                        $user->id,
                        "Transfer: {$transfer->tracking_number}",
                        $transfer->id,
                        'transfer'
                    );
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Xatolik: ' . $e->getMessage(),
            ], 500);
        }

        // Notification - qabul qiluvchiga yuk yo'lda ekanligi haqida xabar
        Notification::createForUser(
            $transfer->receiver_id,
            'transfer_shipped',
            'Transfer yo\'lga chiqdi',
            "Sizning {$transfer->tracking_number} raqamli transferingiz yo'lga chiqarildi va yaqin orada yetib keladi.",
            [
                'transfer_id' => $transfer->id,
                'action_url' => "/transfers/{$transfer->id}",
                'priority' => 'medium',
                'data' => [
                    'tracking_number' => $transfer->tracking_number,
                ],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Transfer yo\'lga chiqarildi',
            'transfer' => $transfer->fresh()->load(['sender', 'receiver', 'product']),
        ]);
    }

    /**
     * Yetkazib berish (Admin/Owner yoki qabul qiluvchi)
     */
    public function deliver(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Faqat admin, owner yoki qabul qiluvchi yetkazilganini tasdiqlashi mumkin
        if (!in_array($user->role, ['admin', 'owner']) && $transfer->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        // Faqat in_transit holatda yetkazish mumkin
        if ($transfer->status !== 'in_transit') {
            return response()->json([
                'success' => false,
                'message' => 'Transfer yo\'lda bo\'lishi kerak',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $transfer->deliver();

            // Automatic stock adjustment - qabul qiluvchi omboriga mahsulot qo'shish
            $receiverWarehouse = Warehouse::where('user_id', $transfer->receiver_id)
                ->where('region', $transfer->to_region)
                ->active()
                ->first();

            if ($receiverWarehouse) {
                $inventory = Inventory::where('warehouse_id', $receiverWarehouse->id)
                    ->where('product_id', $transfer->product_id)
                    ->first();

                if ($inventory) {
                    // Mavjud inventory ga qo'shish
                    $inventory->addStock(
                        $transfer->quantity,
                        'transfer_in',
                        $user->id,
                        "Transfer qabul qilindi: {$transfer->tracking_number}",
                        $transfer->id,
                        'transfer'
                    );
                } else {
                    // Yangi inventory yaratish
                    $inventory = Inventory::create([
                        'warehouse_id' => $receiverWarehouse->id,
                        'product_id' => $transfer->product_id,
                        'user_id' => $transfer->receiver_id,
                        'quantity' => $transfer->quantity,
                        'available_quantity' => $transfer->quantity,
                        'unit' => 'dona',
                        'min_quantity' => 10,
                    ]);

                    $inventory->updateTotalValue();
                    $inventory->save();
                }

                // Low stock check for sender
                $senderWarehouse = Warehouse::where('user_id', $transfer->sender_id)
                    ->where('region', $transfer->from_region)
                    ->active()
                    ->first();

                if ($senderWarehouse) {
                    $senderInventory = Inventory::where('warehouse_id', $senderWarehouse->id)
                        ->where('product_id', $transfer->product_id)
                        ->first();

                    if ($senderInventory && $senderInventory->isLowStock()) {
                        Notification::createForUser(
                            $transfer->sender_id,
                            'low_stock',
                            'Mahsulot kam qoldi',
                            "Sizning {$senderInventory->product->name} mahsulotingiz kam qoldi. Mavjud: {$senderInventory->available_quantity}",
                            [
                                'inventory_id' => $senderInventory->id,
                                'action_url' => '/inventory',
                                'priority' => 'medium',
                            ]
                        );
                    }
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Xatolik: ' . $e->getMessage(),
            ], 500);
        }

        // Notification - yuboruvchiga yuk yetkazib berilgani haqida xabar
        Notification::createForUser(
            $transfer->sender_id,
            'transfer_delivered',
            'Transfer yetkazib berildi',
            "Sizning {$transfer->tracking_number} raqamli transferingiz muvaffaqiyatli yetkazib berildi!",
            [
                'transfer_id' => $transfer->id,
                'action_url' => "/transfers/{$transfer->id}",
                'priority' => 'high',
                'data' => [
                    'tracking_number' => $transfer->tracking_number,
                    'delivered_at' => $transfer->delivered_at,
                ],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Transfer yetkazildi',
            'transfer' => $transfer->fresh()->load(['sender', 'receiver', 'product']),
        ]);
    }

    /**
     * Transferni bekor qilish (faqat yuboruvchi va pending holatda)
     */
    public function cancel(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Faqat yuboruvchi bekor qilishi mumkin
        if ($transfer->sender_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Faqat yuboruvchi bekor qilishi mumkin',
            ], 403);
        }

        if (!$transfer->cancel()) {
            return response()->json([
                'success' => false,
                'message' => 'Faqat kutilayotgan transferlarni bekor qilish mumkin',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transfer bekor qilindi',
            'transfer' => $transfer->fresh()->load(['sender', 'receiver', 'product']),
        ]);
    }

    /**
     * Mening transferlarim (yuborgan + qabul qilgan)
     */
    public function myTransfers(Request $request)
    {
        $user = $request->user();

        $type = $request->get('type', 'all'); // all, sent, received

        $query = Transfer::with(['sender', 'receiver', 'product']);

        if ($type === 'sent') {
            $query->where('sender_id', $user->id);
        } elseif ($type === 'received') {
            $query->where('receiver_id', $user->id);
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            });
        }

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $transfers = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'transfers' => $transfers,
        ]);
    }

    /**
     * Tracking raqami bilan qidirish
     */
    public function trackByNumber(Request $request)
    {
        $validated = $request->validate([
            'tracking_number' => 'required|string',
        ]);

        $transfer = Transfer::where('tracking_number', $validated['tracking_number'])
            ->with(['sender', 'receiver', 'product'])
            ->first();

        if (!$transfer) {
            return response()->json([
                'success' => false,
                'message' => 'Transfer topilmadi',
            ], 404);
        }

        // Kontragent faqat o'z transferini track qilishi mumkin
        $user = $request->user();
        if ($user && $user->role === 'kontragent') {
            if ($transfer->sender_id !== $user->id && $transfer->receiver_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruxsat yo\'q',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'transfer' => $transfer,
        ]);
    }

    /**
     * Statistika (Admin/Owner)
     */
    public function statistics(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'owner'])) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $stats = [
            'total_transfers' => Transfer::count(),
            'pending' => Transfer::where('status', 'pending')->count(),
            'approved' => Transfer::where('status', 'approved')->count(),
            'in_transit' => Transfer::where('status', 'in_transit')->count(),
            'delivered' => Transfer::where('status', 'delivered')->count(),
            'rejected' => Transfer::where('status', 'rejected')->count(),
            'cancelled' => Transfer::where('status', 'cancelled')->count(),
            'total_value' => Transfer::where('status', 'delivered')->sum('total_amount'),
            'recent_transfers' => Transfer::with(['sender', 'receiver', 'product'])
                ->latest()
                ->take(10)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'statistics' => $stats,
        ]);
    }
}
