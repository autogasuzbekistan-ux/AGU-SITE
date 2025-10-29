-- ===============================================
-- AUTO GAS UZBEKISTAN - TO'LIQ MIGRATION
-- Products jadvaliga status va is_active qo'shish
-- ===============================================

-- QADAM 1: Ustunlar mavjudmi tekshirish
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'autogas_marketplace'
  AND TABLE_NAME = 'products'
  AND COLUMN_NAME IN ('status', 'is_active');

-- Agar yuqoridagi so'rov bo'sh natija bersa (0 rows), QADAM 2 ga o'ting
-- Agar ustunlar mavjud bo'lsa, QADAM 3 ga o'ting

-- ===============================================
-- QADAM 2: Ustunlarni qo'shish
-- ===============================================

ALTER TABLE `products`
ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'
    COMMENT 'Mahsulot holati: pending=kutilmoqda, approved=tasdiqlangan, rejected=rad etilgan'
    AFTER `quantity`,
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Mahsulot faol yoki faol emasmi: 1=faol, 0=nofaol'
    AFTER `status`;

-- ===============================================
-- QADAM 3: Mavjud mahsulotlarga default qiymatlar
-- ===============================================

UPDATE `products`
SET
    `status` = 'approved',
    `is_active` = 1
WHERE `status` IS NULL
   OR `is_active` IS NULL
   OR `status` = '';

-- ===============================================
-- QADAM 4: Natijani tekshirish
-- ===============================================

-- Products jadval strukturasini ko'rish
DESCRIBE `products`;

-- Oxirgi 10 ta mahsulotni ko'rish
SELECT
    id,
    name,
    category,
    price,
    quantity,
    stockStatus,
    status,
    is_active,
    seller_id,
    created_at
FROM products
ORDER BY id DESC
LIMIT 10;

-- Status bo'yicha statistika
SELECT
    status,
    is_active,
    COUNT(*) as count
FROM products
GROUP BY status, is_active;

-- ===============================================
-- MIGRATION MUVAFFAQIYATLI BAJARILDI! ✅
-- ===============================================

-- ROLLBACK (Agar muammo bo'lsa, qaytarish uchun):
-- ALTER TABLE `products` DROP COLUMN `status`, DROP COLUMN `is_active`;
