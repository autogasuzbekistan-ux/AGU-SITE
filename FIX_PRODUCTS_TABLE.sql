-- AUTO GAS UZBEKISTAN - Products jadvaliga status va is_active qo'shish
-- Muammo: Mahsulot qo'shishda xato chiqyapti, chunki yangi ustunlar yo'q
-- Yechim: Ushbu SQL ni database'da bajarish kerak

-- 1. Avval tekshiramiz - ustunlar mavjudmi?
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'autogas_marketplace'
  AND TABLE_NAME = 'products'
  AND COLUMN_NAME IN ('status', 'is_active');

-- Agar yuqoridagi so'rov bo'sh natija bersa (0 rows), demak ustunlar yo'q.
-- Quyidagi SQL ni bajaring:

-- 2. Status va is_active ustunlarini qo'shamiz
ALTER TABLE `products`
ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'
    COMMENT 'Mahsulot holati: pending=kutilmoqda, approved=tasdiqlangan, rejected=rad etilgan'
    AFTER `quantity`,
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Mahsulot faol yoki faol emasmi: 1=faol, 0=faol emas'
    AFTER `status`;

-- 3. Tekshirish - muvaffaqiyatli qo'shilganini ko'rish
DESCRIBE `products`;

-- 4. Mavjud mahsulotlarga default qiymatlar berish (agar kerak bo'lsa)
UPDATE `products`
SET `status` = 'approved', `is_active` = 1
WHERE `status` IS NULL OR `is_active` IS NULL;

-- TAYYOR! Endi seller panel orqali mahsulot qo'shish ishlaydi.

-- ===================================================================
-- ROLLBACK (Agar biror narsa noto'g'ri bo'lsa, qaytarish uchun):
-- ===================================================================
-- ALTER TABLE `products` DROP COLUMN `status`, DROP COLUMN `is_active`;
