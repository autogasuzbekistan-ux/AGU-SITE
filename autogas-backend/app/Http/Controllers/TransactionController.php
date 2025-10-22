<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * Tranzaksiyalar ro'yxati (role-based)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Transaction::with(['sender', 'receiver', 'transfer', 'order']);

        // Role-based filtering
        if ($user->role === 'kontragent') {
            // Kontragent faqat o'z tranzaksiyalarini ko'radi
            $query->where(function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            });
        }
        // Admin va Owner barcha tranzaksiyalarni ko'radi

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->betweenDates($request->start_date, $request->end_date);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Bitta tranzaksiyani ko'rish
     */
    public function show(Request $request, Transaction $transaction)
    {
        $user = $request->user();

        // Kontragent faqat o'z tranzaksiyasini ko'ra oladi
        if ($user->role === 'kontragent') {
            if ($transaction->sender_id !== $user->id && $transaction->receiver_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruxsat yo\'q',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'transaction' => $transaction->load(['sender', 'receiver', 'transfer', 'order']),
        ]);
    }

    /**
     * Pul o'tkazish (kontragentlar o'rtasida)
     */
    public function transfer(Request $request)
    {
        $user = $request->user();

        // Faqat kontragent pul o'tkaza oladi
        if ($user->role !== 'kontragent') {
            return response()->json([
                'success' => false,
                'message' => 'Faqat kontragentlar pul o\'tkaza oladi',
            ], 403);
        }

        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        // O'ziga o'zi pul o'tkaza olmaydi
        if ($validated['receiver_id'] == $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'O\'zingizga pul o\'tkaza olmaysiz',
            ], 400);
        }

        // Qabul qiluvchi kontragent bo'lishi kerak
        $receiver = User::find($validated['receiver_id']);
        if ($receiver->role !== 'kontragent') {
            return response()->json([
                'success' => false,
                'message' => 'Qabul qiluvchi kontragent bo\'lishi kerak',
            ], 400);
        }

        // Yuboruvchi balansini tekshirish
        if ($user->balance < $validated['amount']) {
            return response()->json([
                'success' => false,
                'message' => 'Balansda yetarli mablag\' yo\'q',
                'current_balance' => $user->balance,
                'required_amount' => $validated['amount'],
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Yuboruvchi balansi
            $senderBalanceBefore = $user->balance;
            $receiverBalanceBefore = $receiver->balance;

            // Tranzaksiya yaratish
            $transaction = Transaction::create([
                'sender_id' => $user->id,
                'receiver_id' => $receiver->id,
                'type' => 'transfer',
                'amount' => $validated['amount'],
                'status' => 'pending',
                'description' => $validated['description'] ?? "Pul o'tkazmasi",
                'notes' => $validated['notes'] ?? null,
                'reference_number' => Transaction::generateReferenceNumber(),
                'sender_balance_before' => $senderBalanceBefore,
                'receiver_balance_before' => $receiverBalanceBefore,
            ]);

            // Balanslarni yangilash
            $user->balance -= $validated['amount'];
            $user->total_sent += $validated['amount'];
            $user->save();

            $receiver->balance += $validated['amount'];
            $receiver->total_received += $validated['amount'];
            $receiver->save();

            // Tranzaksiyani tugatish
            $transaction->sender_balance_after = $user->balance;
            $transaction->receiver_balance_after = $receiver->balance;
            $transaction->complete();

            // Notification - qabul qiluvchiga pul kelganligi haqida xabar
            Notification::moneyReceived($transaction->fresh()->load(['sender']), $receiver->id);

            // Low balance warning - agar yuboruvchi balansi kam qolsa
            if ($user->balance < 100000) { // 100,000 so'm dan kam
                Notification::lowBalanceWarning($user->id, $user->balance);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pul muvaffaqiyatli o\'tkazildi',
                'transaction' => $transaction->fresh()->load(['sender', 'receiver']),
                'new_balance' => $user->balance,
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
     * Mening tranzaksiyalarim
     */
    public function myTransactions(Request $request)
    {
        $user = $request->user();

        $type = $request->get('type', 'all'); // all, sent, received

        $query = Transaction::with(['sender', 'receiver', 'transfer', 'order']);

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

        if ($request->has('transaction_type')) {
            $query->where('type', $request->transaction_type);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Balans va statistika
     */
    public function balance(Request $request)
    {
        $user = $request->user();

        // Faqat kontragent uchun
        if ($user->role !== 'kontragent') {
            return response()->json([
                'success' => false,
                'message' => 'Faqat kontragentlar uchun',
            ], 403);
        }

        // Qarzlar ro'yxati (kimdan qancha olish kerak)
        $debtsToReceive = Transaction::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        // Qarzlar ro'yxati (kimga qancha berish kerak)
        $debtsToPayDB = Transaction::where('sender_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        // Ohirgi 30 kun ichidagi tranzaksiyalar
        $last30Days = Transaction::where(function ($q) use ($user) {
            $q->where('sender_id', $user->id)
              ->orWhere('receiver_id', $user->id);
        })
        ->where('status', 'completed')
        ->where('created_at', '>=', now()->subDays(30))
        ->count();

        return response()->json([
            'success' => true,
            'balance' => [
                'current_balance' => $user->balance,
                'total_received' => $user->total_received,
                'total_sent' => $user->total_sent,
                'debt' => $user->debt,
                'pending_to_receive' => $debtsToReceive,
                'pending_to_pay' => $debtsToPayDB,
                'transactions_last_30_days' => $last30Days,
            ],
        ]);
    }

    /**
     * Qarzdorliklar (kimga qancha, kimdan qancha)
     */
    public function debts(Request $request)
    {
        $user = $request->user();

        // Faqat kontragent uchun
        if ($user->role !== 'kontragent') {
            return response()->json([
                'success' => false,
                'message' => 'Faqat kontragentlar uchun',
            ], 403);
        }

        // Kimdan qancha olish kerak (men qabul qiluvchi)
        $debtsToReceive = Transaction::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->with('sender')
            ->get()
            ->groupBy('sender_id')
            ->map(function ($transactions) {
                return [
                    'user' => $transactions->first()->sender,
                    'total_amount' => $transactions->sum('amount'),
                    'count' => $transactions->count(),
                ];
            })
            ->values();

        // Kimga qancha berish kerak (men yuboruvchi)
        $debtsToPay = Transaction::where('sender_id', $user->id)
            ->where('status', 'pending')
            ->with('receiver')
            ->get()
            ->groupBy('receiver_id')
            ->map(function ($transactions) {
                return [
                    'user' => $transactions->first()->receiver,
                    'total_amount' => $transactions->sum('amount'),
                    'count' => $transactions->count(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'debts_to_receive' => $debtsToReceive,
            'debts_to_pay' => $debtsToPay,
        ]);
    }

    /**
     * Admin: Balans qo'shish yoki chiqarish
     */
    public function adjustBalance(Request $request)
    {
        $user = $request->user();

        // Faqat admin va owner
        if (!in_array($user->role, ['admin', 'owner'])) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'amount' => 'required|numeric',
            'type' => 'required|in:deposit,withdrawal',
            'description' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $targetUser = User::find($validated['user_id']);

        try {
            DB::beginTransaction();

            $balanceBefore = $targetUser->balance;

            if ($validated['type'] === 'deposit') {
                // Balansga qo'shish
                $targetUser->balance += abs($validated['amount']);
                $targetUser->total_received += abs($validated['amount']);
            } else {
                // Balansdan chiqarish
                if ($targetUser->balance < abs($validated['amount'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Balansda yetarli mablag\' yo\'q',
                    ], 400);
                }
                $targetUser->balance -= abs($validated['amount']);
                $targetUser->total_sent += abs($validated['amount']);
            }

            $targetUser->save();

            // Tranzaksiya yaratish
            $transaction = Transaction::create([
                'sender_id' => $validated['type'] === 'withdrawal' ? $targetUser->id : null,
                'receiver_id' => $validated['type'] === 'deposit' ? $targetUser->id : null,
                'type' => $validated['type'],
                'amount' => abs($validated['amount']),
                'status' => 'completed',
                'description' => $validated['description'],
                'notes' => $validated['notes'] ?? null,
                'reference_number' => Transaction::generateReferenceNumber(),
                'sender_balance_before' => $validated['type'] === 'withdrawal' ? $balanceBefore : null,
                'sender_balance_after' => $validated['type'] === 'withdrawal' ? $targetUser->balance : null,
                'receiver_balance_before' => $validated['type'] === 'deposit' ? $balanceBefore : null,
                'receiver_balance_after' => $validated['type'] === 'deposit' ? $targetUser->balance : null,
                'completed_at' => now(),
            ]);

            // Notification - foydalanuvchiga balans o'zgarganligi haqida xabar
            if ($validated['type'] === 'deposit') {
                Notification::createForUser(
                    $targetUser->id,
                    'balance_deposit',
                    'Balansga pul qo\'shildi',
                    "Sizning balansingizga {$validated['amount']} so'm qo'shildi. Yangi balans: {$targetUser->balance} so'm",
                    [
                        'transaction_id' => $transaction->id,
                        'action_url' => '/transactions',
                        'priority' => 'medium',
                        'data' => [
                            'amount' => $validated['amount'],
                            'new_balance' => $targetUser->balance,
                            'reference_number' => $transaction->reference_number,
                        ],
                    ]
                );
            } else {
                Notification::createForUser(
                    $targetUser->id,
                    'balance_withdrawal',
                    'Balansdan pul yechib olindi',
                    "Sizning balansingizdan {$validated['amount']} so'm yechib olindi. Yangi balans: {$targetUser->balance} so'm",
                    [
                        'transaction_id' => $transaction->id,
                        'action_url' => '/transactions',
                        'priority' => 'high',
                        'data' => [
                            'amount' => $validated['amount'],
                            'new_balance' => $targetUser->balance,
                            'reference_number' => $transaction->reference_number,
                        ],
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Balans muvaffaqiyatli o\'zgartirildi',
                'transaction' => $transaction,
                'new_balance' => $targetUser->balance,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Xatolik yuz berdi: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: Statistika
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
            'total_transactions' => Transaction::count(),
            'completed' => Transaction::where('status', 'completed')->count(),
            'pending' => Transaction::where('status', 'pending')->count(),
            'failed' => Transaction::where('status', 'failed')->count(),
            'total_volume' => Transaction::where('status', 'completed')->sum('amount'),
            'today_volume' => Transaction::where('status', 'completed')
                ->whereDate('created_at', today())
                ->sum('amount'),
            'this_month_volume' => Transaction::where('status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->sum('amount'),
            'recent_transactions' => Transaction::with(['sender', 'receiver'])
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
