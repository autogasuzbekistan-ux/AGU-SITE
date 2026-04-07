<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    protected string $token;
    protected ?string $accountingChatId;

    public function __construct()
    {
        $this->token = config('services.telegram.bot_token', '');
        $this->accountingChatId = config('services.telegram.accounting_chat_id');
    }

    /**
     * Berilgan chat IDga xabar yuborish
     */
    public function sendMessage(string $chatId, string $text): bool
    {
        if (empty($this->token)) {
            return false;
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$this->token}/sendMessage", [
                'chat_id'    => $chatId,
                'text'       => $text,
                'parse_mode' => 'HTML',
            ]);

            if (!$response->json('ok')) {
                Log::warning('Telegram xabar yuborishda xatolik', [
                    'chat_id'     => $chatId,
                    'description' => $response->json('description'),
                ]);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Telegram service xatolik: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Bugalterlar guruhiga xabar yuborish
     */
    public function sendToAccounting(string $text): bool
    {
        if (empty($this->accountingChatId)) {
            return false;
        }

        return $this->sendMessage($this->accountingChatId, $text);
    }

    /**
     * Pul qabul qilindi — bugalterlar guruhiga xabar
     */
    public function notifyMoneyReceived(string $senderName, string $receiverName, float $amount, string $referenceNumber): void
    {
        $now = now()->setTimezone('Asia/Tashkent')->format('d.m.Y H:i');
        $amountFormatted = number_format($amount, 0, '.', ' ');

        $text = implode("\n", [
            '💰 <b>Pul o\'tkazmasi</b>',
            '',
            "👤 <b>Yuboruvchi:</b> {$senderName}",
            "👤 <b>Qabul qiluvchi:</b> {$receiverName}",
            "💵 <b>Miqdor:</b> {$amountFormatted} so'm",
            "🔖 <b>Raqam:</b> {$referenceNumber}",
            '',
            "🕐 <i>{$now}</i>",
        ]);

        $this->sendToAccounting($text);
    }

    /**
     * Balansga pul qo'shildi — bugalterlar guruhiga xabar
     */
    public function notifyBalanceDeposit(string $userName, float $amount, float $newBalance, string $referenceNumber): void
    {
        $now = now()->setTimezone('Asia/Tashkent')->format('d.m.Y H:i');
        $amountFormatted = number_format($amount, 0, '.', ' ');
        $balanceFormatted = number_format($newBalance, 0, '.', ' ');

        $text = implode("\n", [
            '📥 <b>Balansga pul qo\'shildi</b>',
            '',
            "👤 <b>Foydalanuvchi:</b> {$userName}",
            "💵 <b>Miqdor:</b> +{$amountFormatted} so'm",
            "💼 <b>Yangi balans:</b> {$balanceFormatted} so'm",
            "🔖 <b>Raqam:</b> {$referenceNumber}",
            '',
            "🕐 <i>{$now}</i>",
        ]);

        $this->sendToAccounting($text);
    }

    /**
     * Balansdan pul yechildi — bugalterlar guruhiga xabar
     */
    public function notifyBalanceWithdrawal(string $userName, float $amount, float $newBalance, string $referenceNumber): void
    {
        $now = now()->setTimezone('Asia/Tashkent')->format('d.m.Y H:i');
        $amountFormatted = number_format($amount, 0, '.', ' ');
        $balanceFormatted = number_format($newBalance, 0, '.', ' ');

        $text = implode("\n", [
            '📤 <b>Balansdan pul yechildi</b>',
            '',
            "👤 <b>Foydalanuvchi:</b> {$userName}",
            "💵 <b>Miqdor:</b> -{$amountFormatted} so'm",
            "💼 <b>Yangi balans:</b> {$balanceFormatted} so'm",
            "🔖 <b>Raqam:</b> {$referenceNumber}",
            '',
            "🕐 <i>{$now}</i>",
        ]);

        $this->sendToAccounting($text);
    }

    /**
     * Transfer tasdiqlandi — bugalterlar guruhiga xabar
     */
    public function notifyTransferApproved(string $trackingNumber, string $senderName, string $receiverName, float $quantity): void
    {
        $now = now()->setTimezone('Asia/Tashkent')->format('d.m.Y H:i');
        $quantityFormatted = number_format($quantity, 0, '.', ' ');

        $text = implode("\n", [
            '✅ <b>Transfer tasdiqlandi</b>',
            '',
            "📋 <b>Tracking:</b> {$trackingNumber}",
            "👤 <b>Yuboruvchi:</b> {$senderName}",
            "👤 <b>Qabul qiluvchi:</b> {$receiverName}",
            "⛽ <b>Miqdor:</b> {$quantityFormatted} litr",
            '',
            "🕐 <i>{$now}</i>",
        ]);

        $this->sendToAccounting($text);
    }
}
