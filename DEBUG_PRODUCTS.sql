-- Mahsulotlar ko'rinmasligi muammosini tekshirish

-- 1. Products jadvalidagi BARCHA mahsulotlarni ko'rish
SELECT
    id,
    name,
    category,
    price,
    quantity,
    stockStatus,
    seller_id,
    LEFT(imageUrl, 50) as image_preview,
    created_at
FROM products
ORDER BY id DESC
LIMIT 20;

-- 2. Status va is_active ustunlari mavjudmi tekshirish
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'autogas_marketplace'
  AND TABLE_NAME = 'products'
  AND COLUMN_NAME IN ('status', 'is_active');

-- 3. Agar status va is_active yo'q bo'lsa, ularni qo'shish
-- (Faqat yuqoridagi so'rov bo'sh natija bersa bajaring!)
ALTER TABLE `products`
ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved'
    COMMENT 'Mahsulot holati' AFTER `quantity`,
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'Mahsulot faol/faol emas' AFTER `status`;

-- 4. Mahsulotlarni status bo'yicha ko'rish (agar status ustuni mavjud bo'lsa)
-- SELECT id, name, status, is_active, stockStatus FROM products ORDER BY id DESC LIMIT 10;
