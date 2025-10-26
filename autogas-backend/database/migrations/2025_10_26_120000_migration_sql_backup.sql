-- Agar PHP artisan migrate ishlamasa, ushbu SQL ni qo'lda bajarishingiz mumkin
-- Manual SQL for adding status and is_active columns to products table

ALTER TABLE `products`
ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'
    COMMENT 'Mahsulot holati: pending - kutilmoqda, approved - tasdiqlangan, rejected - rad etilgan'
    AFTER `quantity`,
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Mahsulot faol yoki faol emasmi'
    AFTER `status`;

-- Rollback SQL (agar kerak bo'lsa):
-- ALTER TABLE `products` DROP COLUMN `status`, DROP COLUMN `is_active`;
