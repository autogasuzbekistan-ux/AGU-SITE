<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Foydalanuvchining barcha notificationlari
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Notification::where('user_id', $user->id)
            ->with(['transfer', 'transaction', 'shipment'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->has('is_read')) {
            $isRead = $request->boolean('is_read');
            if ($isRead) {
                $query->read();
            } else {
                $query->unread();
            }
        }

        if ($request->has('type')) {
            $query->ofType($request->type);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->boolean('recent_only')) {
            $query->recent();
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
        ]);
    }

    /**
     * O'qilmagan notificationlar soni
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();

        $count = Notification::where('user_id', $user->id)
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $count,
        ]);
    }

    /**
     * So'nggi notificationlar (bell dropdown uchun)
     */
    public function recent(Request $request)
    {
        $user = $request->user();

        $limit = $request->get('limit', 10);

        $notifications = Notification::where('user_id', $user->id)
            ->with(['transfer', 'transaction', 'shipment'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $unreadCount = Notification::where('user_id', $user->id)
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Bitta notificationni ko'rish
     */
    public function show(Request $request, Notification $notification)
    {
        $user = $request->user();

        // Faqat o'z notificationini ko'ra oladi
        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        // Automatik o'qilgan deb belgilash
        if (!$notification->is_read) {
            $notification->markAsRead();
        }

        return response()->json([
            'success' => true,
            'notification' => $notification->load(['transfer', 'transaction', 'shipment']),
        ]);
    }

    /**
     * Notificationni o'qilgan deb belgilash
     */
    public function markAsRead(Request $request, Notification $notification)
    {
        $user = $request->user();

        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification o\'qilgan deb belgilandi',
            'notification' => $notification,
        ]);
    }

    /**
     * Notificationni o'qilmagan deb belgilash
     */
    public function markAsUnread(Request $request, Notification $notification)
    {
        $user = $request->user();

        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $notification->markAsUnread();

        return response()->json([
            'success' => true,
            'message' => 'Notification o\'qilmagan deb belgilandi',
            'notification' => $notification,
        ]);
    }

    /**
     * Barcha notificationlarni o'qilgan deb belgilash
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        $updated = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Barcha notificationlar o\'qilgan deb belgilandi',
            'updated_count' => $updated,
        ]);
    }

    /**
     * Notificationni o'chirish
     */
    public function destroy(Request $request, Notification $notification)
    {
        $user = $request->user();

        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Ruxsat yo\'q',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification o\'chirildi',
        ]);
    }

    /**
     * O'qilgan notificationlarni o'chirish
     */
    public function deleteRead(Request $request)
    {
        $user = $request->user();

        $deleted = Notification::where('user_id', $user->id)
            ->where('is_read', true)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'O\'qilgan notificationlar o\'chirildi',
            'deleted_count' => $deleted,
        ]);
    }

    /**
     * Barcha notificationlarni o'chirish
     */
    public function deleteAll(Request $request)
    {
        $user = $request->user();

        $deleted = Notification::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barcha notificationlar o\'chirildi',
            'deleted_count' => $deleted,
        ]);
    }

    /**
     * Notification statistikasi
     */
    public function statistics(Request $request)
    {
        $user = $request->user();

        $stats = [
            'total' => Notification::where('user_id', $user->id)->count(),
            'unread' => Notification::where('user_id', $user->id)->unread()->count(),
            'read' => Notification::where('user_id', $user->id)->read()->count(),
            'urgent' => Notification::where('user_id', $user->id)->urgent()->count(),
            'today' => Notification::where('user_id', $user->id)
                ->whereDate('created_at', today())
                ->count(),
            'this_week' => Notification::where('user_id', $user->id)
                ->where('created_at', '>=', now()->startOfWeek())
                ->count(),
            'by_type' => Notification::where('user_id', $user->id)
                ->select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->pluck('count', 'type'),
        ];

        return response()->json([
            'success' => true,
            'statistics' => $stats,
        ]);
    }

    /**
     * Test notification (development only)
     */
    public function sendTestNotification(Request $request)
    {
        $user = $request->user();

        $notification = Notification::createForUser(
            $user->id,
            'test',
            'Test Notification',
            'Bu test notification. Tizim ishlayapti!',
            [
                'priority' => 'medium',
                'data' => [
                    'test' => true,
                    'timestamp' => now()->toDateTimeString(),
                ],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Test notification yuborildi',
            'notification' => $notification,
        ]);
    }
}
