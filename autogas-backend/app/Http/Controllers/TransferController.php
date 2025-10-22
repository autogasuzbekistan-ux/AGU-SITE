<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\Product;
use App\Models\User;
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

        $transfer->ship();

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

        $transfer->deliver();

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
