<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'transfer_id',
        'transaction_id',
        'shipment_id',
        'data',
        'action_url',
        'is_read',
        'read_at',
        'sent_via_email',
        'sent_via_sms',
        'email_sent_at',
        'sms_sent_at',
        'priority',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'sent_via_email' => 'boolean',
        'sent_via_sms' => 'boolean',
        'read_at' => 'datetime',
        'email_sent_at' => 'datetime',
        'sms_sent_at' => 'datetime',
    ];

    // Relationships

    /**
     * Notification egasi
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Bog'liq transfer
     */
    public function transfer()
    {
        return $this->belongsTo(Transfer::class);
    }

    /**
     * Bog'liq transaction
     */
    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Bog'liq shipment
     */
    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }

    // Helper Methods

    /**
     * Notificationni o'qilgan deb belgilash
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return $this;
    }

    /**
     * Notificationni o'qilmagan deb belgilash
     */
    public function markAsUnread()
    {
        $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return $this;
    }

    /**
     * Email yuborilganini belgilash
     */
    public function markEmailSent()
    {
        $this->update([
            'sent_via_email' => true,
            'email_sent_at' => now(),
        ]);

        return $this;
    }

    /**
     * SMS yuborilganini belgilash
     */
    public function markSmsSent()
    {
        $this->update([
            'sent_via_sms' => true,
            'sms_sent_at' => now(),
        ]);

        return $this;
    }

    /**
     * Notification yaratish (static helper)
     */
    public static function createForUser($userId, $type, $title, $message, $options = [])
    {
        return self::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'transfer_id' => $options['transfer_id'] ?? null,
            'transaction_id' => $options['transaction_id'] ?? null,
            'shipment_id' => $options['shipment_id'] ?? null,
            'data' => $options['data'] ?? null,
            'action_url' => $options['action_url'] ?? null,
            'priority' => $options['priority'] ?? 'medium',
        ]);
    }

    /**
     * Transfer approved notification
     */
    public static function transferApproved($transfer, $recipientId)
    {
        return self::createForUser(
            $recipientId,
            'transfer_approved',
            'Transfer tasdiqlandi',
            "Sizning {$transfer->tracking_number} raqamli transferingiz tasdiqlandi.",
            [
                'transfer_id' => $transfer->id,
                'action_url' => "/transfers/{$transfer->id}",
                'priority' => 'high',
                'data' => [
                    'tracking_number' => $transfer->tracking_number,
                    'quantity' => $transfer->quantity,
                ],
            ]
        );
    }

    /**
     * Transfer rejected notification
     */
    public static function transferRejected($transfer, $recipientId, $reason = null)
    {
        $message = "Sizning {$transfer->tracking_number} raqamli transferingiz rad etildi.";
        if ($reason) {
            $message .= " Sabab: {$reason}";
        }

        return self::createForUser(
            $recipientId,
            'transfer_rejected',
            'Transfer rad etildi',
            $message,
            [
                'transfer_id' => $transfer->id,
                'action_url' => "/transfers/{$transfer->id}",
                'priority' => 'high',
                'data' => [
                    'tracking_number' => $transfer->tracking_number,
                    'reason' => $reason,
                ],
            ]
        );
    }

    /**
     * New transfer request notification
     */
    public static function newTransferRequest($transfer, $receiverId)
    {
        return self::createForUser(
            $receiverId,
            'transfer_request',
            'Yangi transfer so\'rovi',
            "Sizga {$transfer->sender->name} dan yangi transfer so'rovi keldi. Tracking: {$transfer->tracking_number}",
            [
                'transfer_id' => $transfer->id,
                'action_url' => "/transfers/{$transfer->id}",
                'priority' => 'high',
                'data' => [
                    'tracking_number' => $transfer->tracking_number,
                    'sender_name' => $transfer->sender->name,
                    'quantity' => $transfer->quantity,
                ],
            ]
        );
    }

    /**
     * Money received notification
     */
    public static function moneyReceived($transaction, $recipientId)
    {
        return self::createForUser(
            $recipientId,
            'money_received',
            'Pul qabul qilindi',
            "{$transaction->sender->name} sizga {$transaction->amount} so'm pul o'tkazdi.",
            [
                'transaction_id' => $transaction->id,
                'action_url' => "/transactions/{$transaction->id}",
                'priority' => 'high',
                'data' => [
                    'amount' => $transaction->amount,
                    'sender_name' => $transaction->sender->name,
                    'reference_number' => $transaction->reference_number,
                ],
            ]
        );
    }

    /**
     * Shipment status changed notification
     */
    public static function shipmentStatusChanged($shipment, $userId)
    {
        return self::createForUser(
            $userId,
            'shipment_status_changed',
            'Yuk holati o\'zgartirildi',
            "Sizning {$shipment->tracking_code} raqamli yukingiz holati o'zgartirildi: {$shipment->status_name}",
            [
                'shipment_id' => $shipment->id,
                'action_url' => "/shipments/{$shipment->id}",
                'priority' => 'medium',
                'data' => [
                    'tracking_code' => $shipment->tracking_code,
                    'status' => $shipment->status,
                    'status_name' => $shipment->status_name,
                ],
            ]
        );
    }

    /**
     * Shipment delivered notification
     */
    public static function shipmentDelivered($shipment, $userId)
    {
        return self::createForUser(
            $userId,
            'shipment_delivered',
            'Yuk topshirildi',
            "Sizning {$shipment->tracking_code} raqamli yukingiz muvaffaqiyatli topshirildi!",
            [
                'shipment_id' => $shipment->id,
                'action_url' => "/shipments/{$shipment->id}",
                'priority' => 'high',
                'data' => [
                    'tracking_code' => $shipment->tracking_code,
                    'delivered_at' => $shipment->actual_delivery_at,
                ],
            ]
        );
    }

    /**
     * Low balance warning
     */
    public static function lowBalanceWarning($userId, $balance)
    {
        return self::createForUser(
            $userId,
            'low_balance',
            'Balans kam',
            "Sizning balansingiz kam qoldi: {$balance} so'm. Iltimos, to'ldiring.",
            [
                'action_url' => '/transactions',
                'priority' => 'medium',
                'data' => [
                    'balance' => $balance,
                ],
            ]
        );
    }

    // Scopes

    /**
     * O'qilmagan notificationlar
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * O'qilgan notificationlar
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Berilgan user uchun
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Berilgan type uchun
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Urgent (high priority)
     */
    public function scopeUrgent($query)
    {
        return $query->whereIn('priority', ['high', 'urgent']);
    }

    /**
     * Recent (so'nggi 7 kun)
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subDays(7));
    }

    // Accessors

    /**
     * Notification icon
     */
    public function getIconAttribute()
    {
        return match($this->type) {
            'transfer_approved', 'transfer_request' => 'fa-exchange-alt',
            'transfer_rejected' => 'fa-times-circle',
            'money_received' => 'fa-money-bill-wave',
            'shipment_status_changed' => 'fa-truck',
            'shipment_delivered' => 'fa-check-circle',
            'low_balance' => 'fa-exclamation-triangle',
            default => 'fa-bell',
        };
    }

    /**
     * Notification color
     */
    public function getColorAttribute()
    {
        return match($this->type) {
            'transfer_approved', 'money_received', 'shipment_delivered' => 'green',
            'transfer_rejected' => 'red',
            'transfer_request', 'shipment_status_changed' => 'blue',
            'low_balance' => 'orange',
            default => 'gray',
        };
    }

    /**
     * Time ago (for display)
     */
    public function getTimeAgoAttribute()
    {
        return $this->created_at->diffForHumans();
    }
}
