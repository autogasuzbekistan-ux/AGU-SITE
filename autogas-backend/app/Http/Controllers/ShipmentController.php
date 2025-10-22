<?php

namespace App\Http\Controllers;

use App\Models\Shipment;
use App\Models\Transfer;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShipmentController extends Controller
{
    /**
     * Barcha shipmentlar (role-based)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Shipment::with(['transfer.sender', 'transfer.receiver', 'transfer.product']);

        // Role-based filtering
        if ($user->role === 'kontragent') {
            // Kontragent faqat o'z shipmentlarini ko'radi
            $query->whereHas('transfer', function ($q) use ($user) {
                $q->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            });
        }
        // Admin va Owner barcha shipmentlarni ko'radi

        // Filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('has_issues')) {
            $query->where('has_issues', $request->boolean('has_issues'));
        }

        if ($request->has('active_only') && $request->boolean('active_only')) {
            $query->active();
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $shipments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'shipments' => $shipments,
        ]);
    }

    /**
     * Yangi shipment yaratish
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'transfer_id' => 'required|exists:transfers,id',
            'carrier_name' => 'nullable|string',
            'carrier_phone' => 'nullable|string',
            'vehicle_number' => 'nullable|string',
            'origin_address' => 'nullable|string',
            'origin_city' => 'nullable|string',
            'destination_address' => 'nullable|string',
            'destination_city' => 'nullable|string',
            'estimated_pickup_at' => 'nullable|date',
            'estimated_delivery_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'special_instructions' => 'nullable|string',
            'weight' => 'nullable|numeric|min:0',
            'package_dimensions' => 'nullable|string',
            'package_count' => 'nullable|integer|min:1',
        ]);

        // Transfer tekshirish
        $transfer = Transfer::find($validated['transfer_id']);

        // Faqat transfer ishtirokchilari shipment yarata oladi
        if ($user->role === 'kontragent') {
            if ($transfer->sender_id !== $user->id && $transfer->receiver_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruxsat yo\'q',
                ], 403);
            }
        }

        // Allaqachon shipment bormi?
        if ($transfer->shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Bu transfer uchun shipment allaqachon yaratilgan',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $shipment = Shipment::create([
                'transfer_id' => $validated['transfer_id'],
                'tracking_code' => Shipment::generateTrackingCode(),
                'carrier_name' => $validated['carrier_name'] ?? null,
                'carrier_phone' => $validated['carrier_phone'] ?? null,
                'vehicle_number' => $validated['vehicle_number'] ?? null,
                'origin_address' => $validated['origin_address'] ?? null,
                'origin_city' => $validated['origin_city'] ?? $transfer->from_region,
                'destination_address' => $validated['destination_address'] ?? null,
                'destination_city' => $validated['destination_city'] ?? $transfer->to_region,
                'estimated_pickup_at' => $validated['estimated_pickup_at'] ?? null,
                'estimated_delivery_at' => $validated['estimated_delivery_at'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'special_instructions' => $validated['special_instructions'] ?? null,
                'weight' => $validated['weight'] ?? null,
                'package_dimensions' => $validated['package_dimensions'] ?? null,
                'package_count' => $validated['package_count'] ?? 1,
                'status' => 'preparing',
            ]);

            // Birinchi event yaratish
            $shipment->events()->create([
                'event_type' => 'status_changed',
                'status' => 'preparing',
                'description' => 'Shipment yaratildi',
                'created_by' => $user->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Shipment muvaffaqiyatli yaratildi',
                'shipment' => $shipment->load(['transfer', 'events']),
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
     * Bitta shipmentni ko'rish
     */
    public function show(Request $request, Shipment $shipment)
    {
        $user = $request->user();

        // Kontragent faqat o'z shipmentini ko'ra oladi
        if ($user && $user->role === 'kontragent') {
            $transfer = $shipment->transfer;
            if ($transfer->sender_id !== $user->id && $transfer->receiver_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruxsat yo\'q',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'shipment' => $shipment->load(['transfer.sender', 'transfer.receiver', 'transfer.product', 'events.creator']),
        ]);
    }

    /**
     * Tracking code bilan qidirish (public)
     */
    public function trackByCode(Request $request)
    {
        $validated = $request->validate([
            'tracking_code' => 'required|string',
        ]);

        $shipment = Shipment::where('tracking_code', $validated['tracking_code'])
            ->with(['transfer.sender', 'transfer.receiver', 'transfer.product', 'events.creator'])
            ->first();

        if (!$shipment) {
            return response()->json([
                'success' => false,
                'message' => 'Shipment topilmadi',
            ], 404);
        }

        // Public tracking uchun - maxfiy ma'lumotlarni yashirish
        if (!$request->user()) {
            $shipment->makeHidden(['carrier_phone', 'special_instructions']);
        }

        return response()->json([
            'success' => true,
            'shipment' => $shipment,
        ]);
    }

    /**
     * Status yangilash
     */
    public function updateStatus(Request $request, Shipment $shipment)
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => 'required|in:preparing,picked_up,in_transit,arrived,delivered,returned,cancelled',
            'description' => 'nullable|string',
            'location' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'delivery_notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $description = $validated['description'] ?? "Status o'zgartirildi: {$validated['status']}";

            if ($validated['status'] === 'delivered') {
                $shipment->markAsDelivered($validated['delivery_notes'] ?? null, $user->id);

                // Notification - jo'natuvchi va qabul qiluvchiga yetkazib berilgani haqida
                $transfer = $shipment->transfer;
                if ($transfer) {
                    Notification::shipmentDelivered($shipment, $transfer->sender_id);
                    Notification::shipmentDelivered($shipment, $transfer->receiver_id);
                }
            } elseif ($validated['status'] === 'picked_up') {
                $shipment->markAsPickedUp($user->id);

                // Notification - qabul qiluvchiga yuk olib ketilganligi haqida
                $transfer = $shipment->transfer;
                if ($transfer) {
                    Notification::shipmentStatusChanged($shipment, $transfer->receiver_id);
                }
            } else {
                $shipment->updateStatus(
                    $validated['status'],
                    $description,
                    $user->id,
                    $validated['location'] ?? null
                );

                // Notification - har qanday status o'zgarishida
                $transfer = $shipment->transfer;
                if ($transfer) {
                    // Jo'natuvchiga va qabul qiluvchiga xabar
                    Notification::shipmentStatusChanged($shipment, $transfer->sender_id);
                    Notification::shipmentStatusChanged($shipment, $transfer->receiver_id);
                }
            }

            // Lokatsiya yangilash
            if (isset($validated['location'])) {
                $shipment->updateLocation(
                    $validated['location'],
                    $validated['latitude'] ?? null,
                    $validated['longitude'] ?? null,
                    $user->id
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Status muvaffaqiyatli yangilandi',
                'shipment' => $shipment->fresh()->load(['transfer', 'events']),
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
     * Lokatsiya yangilash
     */
    public function updateLocation(Request $request, Shipment $shipment)
    {
        $user = $request->user();

        $validated = $request->validate([
            'location' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $shipment->updateLocation(
            $validated['location'],
            $validated['latitude'] ?? null,
            $validated['longitude'] ?? null,
            $user->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Lokatsiya muvaffaqiyatli yangilandi',
            'shipment' => $shipment->fresh()->load(['events']),
        ]);
    }

    /**
     * Izoh qo'shish
     */
    public function addNote(Request $request, Shipment $shipment)
    {
        $user = $request->user();

        $validated = $request->validate([
            'note' => 'required|string',
        ]);

        $shipment->addNote($validated['note'], $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Izoh qo\'shildi',
            'shipment' => $shipment->fresh()->load(['events']),
        ]);
    }

    /**
     * Muammo xabar qilish
     */
    public function reportIssue(Request $request, Shipment $shipment)
    {
        $user = $request->user();

        $validated = $request->validate([
            'issue' => 'required|string',
        ]);

        $shipment->reportIssue($validated['issue'], $user->id);

        // Notification - jo'natuvchi va qabul qiluvchiga muammo haqida xabar
        $transfer = $shipment->transfer;
        if ($transfer) {
            Notification::createForUser(
                $transfer->sender_id,
                'shipment_issue',
                'Yuk bilan muammo',
                "Sizning {$shipment->tracking_code} raqamli yukingiz bilan muammo xabar qilindi: {$validated['issue']}",
                [
                    'shipment_id' => $shipment->id,
                    'action_url' => "/shipments/{$shipment->id}",
                    'priority' => 'urgent',
                    'data' => [
                        'tracking_code' => $shipment->tracking_code,
                        'issue' => $validated['issue'],
                    ],
                ]
            );

            Notification::createForUser(
                $transfer->receiver_id,
                'shipment_issue',
                'Yuk bilan muammo',
                "Sizning {$shipment->tracking_code} raqamli yukingiz bilan muammo xabar qilindi: {$validated['issue']}",
                [
                    'shipment_id' => $shipment->id,
                    'action_url' => "/shipments/{$shipment->id}",
                    'priority' => 'urgent',
                    'data' => [
                        'tracking_code' => $shipment->tracking_code,
                        'issue' => $validated['issue'],
                    ],
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Muammo xabar qilindi',
            'shipment' => $shipment->fresh()->load(['events']),
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
            'total_shipments' => Shipment::count(),
            'active_shipments' => Shipment::active()->count(),
            'preparing' => Shipment::where('status', 'preparing')->count(),
            'picked_up' => Shipment::where('status', 'picked_up')->count(),
            'in_transit' => Shipment::where('status', 'in_transit')->count(),
            'arrived' => Shipment::where('status', 'arrived')->count(),
            'delivered' => Shipment::where('status', 'delivered')->count(),
            'with_issues' => Shipment::where('has_issues', true)->count(),
            'delayed' => Shipment::delayed()->count(),
            'recent_shipments' => Shipment::with(['transfer.sender', 'transfer.receiver'])
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
